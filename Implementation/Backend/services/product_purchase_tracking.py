from models import ProductPurchaseTracking, CartSession, Product, User
from typing import List, Dict, Any, Optional
from datetime import datetime

# Configuration constants for abandonment detection and freeze logic

# Threshold for user activity:
# - < 30 days since last shop: User is ACTIVE → check for product abandonment, update averages
# - ≥ 30 days since last shop: User is INACTIVE/AWAY → freeze data when they return, no abandonment check
INACTIVITY_THRESHOLD_DAYS = 30

# Abandonment detection for products:
# Threshold = max(30 days, average_interval * 1.5)
# If user is ACTIVE but specific product overdue by threshold → DELETE tracking
# Examples:
#   - Milk (7-day avg): threshold = max(30, 7×1.5) = 30 days
#   - Bi-weekly (14-day avg): threshold = max(30, 14×1.5) = 30 days
#   - Monthly (30-day avg): threshold = max(30, 30×1.5) = 45 days
ABANDONMENT_MULTIPLIER = 1.5
ABANDONMENT_THRESHOLD_DAYS = 30

# Only track frequently-bought products (avg interval ≤ 30 days)
# Products with longer intervals are deleted from tracking
MAX_TRACKING_INTERVAL_DAYS = 30


async def checkout_cart(phone: str) -> Dict[str, Any]:
    """
    Checkout: Track each cart item's purchase and delete cart.
    Also updates user's last checkout date for abandonment detection.

    Process:
    1. Get cart session
    2. Update user's last checkout date (for abandonment/freeze detection)
    3. Track each unique product purchase (update purchase tracking)
    4. Delete cart session

    Args:
        phone: User's phone number

    Returns:
        dict: Success message with checkout summary

    Raises:
        ValueError: If no cart found or cart is empty
    """
    try:
        # Get cart session
        cart = await CartSession.find_one(CartSession.phone == phone)
        if not cart or not cart.items:
            raise ValueError(f"No cart session found for phone '{phone}'")

        checkout_time = datetime.utcnow()

        # Update user's last checkout date (for abandonment detection)
        user = await User.find_one(User.phone == phone)
        if user:
            user.last_checkout_date = checkout_time
            await user.save()
            print(f"Updated last_checkout_date for {phone}")

        # Track each unique product (ignore quantities for tracking purposes)
        tracked_items = []
        for item in cart.items:
            await track_product_purchase(phone, item.barcode, checkout_time)
            tracked_items.append(item.barcode)

        # Delete cart session after tracking
        await cart.delete()
        print(f"Checkout completed for {phone}: tracked {len(tracked_items)} products")

        return {
            "message": "Checkout successful",
            "items_tracked": len(tracked_items),
            "checkout_time": checkout_time,
        }

    except ValueError:
        raise
    except Exception as e:
        print(f"Error in checkout_cart: {e}")
        raise


async def track_product_purchase(
    phone: str, barcode: str, purchase_date: datetime
) -> None:
    """
    Update or create tracking record for a single product purchase.

    Handles:
    1. Abandonment Detection: Delete tracking if user is active but ignoring product
    2. Freeze Logic: Don't update average if user was inactive (≥30 days absence)
    3. Frequency Filter: Delete tracking if product avg interval exceeds 30 days

    Uses incremental average calculation for purchase intervals:
    - If k = number of purchases BEFORE this one, then:
      - Number of old intervals = k - 1
      - Number of new intervals = k (after adding current interval)
    - Formula: new_avg = (old_avg * (k - 1) + new_interval) / k

    Args:
        phone: User's phone number
        barcode: Product barcode
        purchase_date: Purchase timestamp
    """
    # Get user to check last shopping activity
    user = await User.find_one(User.phone == phone)
    if not user:
        print(f"Warning: User {phone} not found for tracking")
        return

    tracking = await ProductPurchaseTracking.find_one(
        ProductPurchaseTracking.phone == phone,
        ProductPurchaseTracking.barcode == barcode,
    )

    if not tracking:
        # First time buying this product
        tracking = ProductPurchaseTracking(
            phone=phone,
            barcode=barcode,
            purchase_count=1,
            last_purchase_date=purchase_date,
            average_interval_days=None,  # Can't calculate with only 1 purchase
        )
        print(f"Created new tracking for {phone} - {barcode}")
    else:
        # Check for abandonment or long absence
        days_since_last_purchase = (purchase_date - tracking.last_purchase_date).days

        # Calculate when user last shopped (any product)
        days_since_last_shop = None
        if user.last_checkout_date:
            days_since_last_shop = (purchase_date - user.last_checkout_date).days

        # ABANDONMENT DETECTION
        # User is active (shopped within 30 days) but this product is way overdue
        if (
            days_since_last_shop is not None
            and days_since_last_shop < INACTIVITY_THRESHOLD_DAYS
        ):
            # User is actively shopping
            if tracking.average_interval_days:
                # Calculate abandonment threshold: max(30, avg × 1.5)
                abandonment_threshold = max(
                    ABANDONMENT_THRESHOLD_DAYS,
                    tracking.average_interval_days * ABANDONMENT_MULTIPLIER,
                )

                if days_since_last_purchase > abandonment_threshold:
                    # User is shopping but ignoring this product for too long
                    # Likely stopped buying it (diet change, preference change, etc.)
                    print(
                        f"🗑️ ABANDONMENT DETECTED: {phone} - {barcode}\n"
                        f"   Last shopped: {days_since_last_shop} days ago (ACTIVE)\n"
                        f"   Last bought this: {days_since_last_purchase} days ago (OVERDUE)\n"
                        f"   Threshold: {abandonment_threshold:.1f} days\n"
                        f"   → Deleting product tracking"
                    )
                    await tracking.delete()
                    return

        # FREEZE LOGIC (Long Absence)
        # User hasn't shopped at all for 30+ days → don't update average
        freeze_data = False
        if user.last_checkout_date:
            days_inactive = (purchase_date - user.last_checkout_date).days
            if days_inactive >= INACTIVITY_THRESHOLD_DAYS:
                freeze_data = True
                print(
                    f"❄️ FREEZE MODE: {phone} - {barcode}\n"
                    f"   User inactive for {days_inactive} days\n"
                    f"   → Keeping old average, just updating date and count"
                )

        # Update purchase count and date
        tracking.purchase_count += 1
        tracking.last_purchase_date = purchase_date

        # Calculate/update average interval if we have 2+ purchases
        if tracking.purchase_count >= 2:
            if freeze_data:
                # FREEZE: Don't recalculate average (long absence)
                # Keep the old average_interval_days
                if tracking.average_interval_days:
                    print(
                        f"   Keeping frozen average: {tracking.average_interval_days:.1f} days"
                    )
            else:
                # NORMAL: Calculate average incrementally
                new_interval = days_since_last_purchase

                if tracking.average_interval_days is None:
                    # Second purchase - first interval
                    tracking.average_interval_days = max(float(new_interval), 1.0)
                else:
                    # Incremental average: new_avg = (old_avg * (count-1) + new_interval) / count
                    old_count = tracking.purchase_count - 1
                    tracking.average_interval_days = (
                        tracking.average_interval_days * (old_count - 1) + new_interval
                    ) / old_count
                    tracking.average_interval_days = max(
                        tracking.average_interval_days, 1.0
                    )  # Minimum 1 day

                print(
                    f"Updated tracking for {phone} - {barcode}: "
                    f"{tracking.purchase_count} purchases, "
                    f"avg interval: {tracking.average_interval_days:.1f} days"
                )

                # FREQUENCY FILTER: Delete if product is not frequently bought
                if tracking.average_interval_days > MAX_TRACKING_INTERVAL_DAYS:
                    print(
                        f"🗑️ INFREQUENT PRODUCT: {phone} - {barcode}\n"
                        f"   Average interval: {tracking.average_interval_days:.1f} days\n"
                        f"   Max allowed: {MAX_TRACKING_INTERVAL_DAYS} days\n"
                        f"   → Deleting product tracking"
                    )
                    await tracking.delete()
                    return

    await tracking.save()


async def get_replenishment_suggestions(
    phone: str, cart_barcodes: List[str]
) -> List[Dict[str, Any]]:
    """
    Get ALL products that are due for repurchase based on their buying intervals.

    A product is "due" if:
    - User has bought it at least 3 times (reliable average interval)
    - Days since last purchase is between (avg_interval - 3) and (avg_interval * 1.5)

    Example:
        - Product bought every 20 days (average_interval_days = 20)
        - Due window: 17 days to 30 days
        - If last bought 22 days ago → SUGGEST (overdue)
        - If last bought 10 days ago → DON'T SUGGEST (too early)

    Special case - Returning users (inactive ≥30 days):
        Upper bound is removed, so ALL frequently-bought products (3+ purchases)
        are suggested. When someone returns after being away, they need to restock.

    Args:
        phone: User's phone number
        cart_barcodes: List of product barcodes currently in cart (exclude these)

    Returns:
        List of due products with details, sorted by most overdue first.
        Returns empty list if:
        - No products are due
        - User has insufficient purchase history (less than 3 purchases)
    """
    try:
        # Check if user exists
        user = await User.find_one(User.phone == phone)
        if not user:
            print(f"User {phone} not found")
            return []

        # Check if user is returning from inactivity (≥30 days since last shop)
        is_returning_from_inactivity = False
        if user.last_checkout_date:
            days_since_last_shop = (datetime.utcnow() - user.last_checkout_date).days
            if days_since_last_shop >= INACTIVITY_THRESHOLD_DAYS:
                is_returning_from_inactivity = True
                print(
                    f"🔄 RETURNING USER: {phone}\n"
                    f"   Last shopped: {days_since_last_shop} days ago\n"
                    f"   → Suggesting all frequently-bought products"
                )

        # Get all tracked products for this user with 3+ purchases (reliable average)
        tracked = await ProductPurchaseTracking.find(
            ProductPurchaseTracking.phone == phone,
            ProductPurchaseTracking.purchase_count >= 3,
            ProductPurchaseTracking.average_interval_days != None,
        ).to_list()

        if not tracked:
            print(f"No tracking data with 3+ purchases found for {phone}")
            return []

        now = datetime.utcnow()
        due_items = []

        for item in tracked:
            # Skip if already in cart
            if item.barcode in cart_barcodes:
                continue

            days_since_last = (now - item.last_purchase_date).days
            avg_interval = item.average_interval_days

            # Safety check: ensure avg_interval is at least 1 (prevents division by zero)
            if avg_interval <= 0:
                avg_interval = 1
                print(
                    f"⚠️ WARNING: {item.barcode} has avg_interval <= 0, setting to 1 day"
                )

            # Calculate due window
            lower_bound = avg_interval - 3
            if is_returning_from_inactivity:
                # Returning user: no upper bound, suggest all frequent products
                upper_bound = float("inf")
            else:
                # Normal user: (avg - 3 days) to (avg * 1.5)
                upper_bound = avg_interval * 1.5

            # Check if item is within the due window
            if lower_bound <= days_since_last <= upper_bound:
                # Calculate how overdue (ratio > 1.0 means overdue)
                due_ratio = days_since_last / avg_interval

                due_items.append(
                    {
                        "tracking": item,
                        "due_ratio": due_ratio,
                        "days_since_last": days_since_last,
                        "avg_interval": avg_interval,
                    }
                )

        # Sort by due_ratio descending (most overdue first)
        due_items.sort(key=lambda x: x["due_ratio"], reverse=True)

        # Fetch full product details from Product collection
        suggestions = []
        for item in due_items:
            product = await Product.find_one(
                Product.barcode == item["tracking"].barcode
            )

            # Only suggest if product exists and is available
            if product and product.available:
                suggestions.append(
                    {
                        "barcode": product.barcode,
                        "name": product.name,
                        "company": product.company,
                        "category": product.category,
                        "price": product.price,
                        "size": product.size,
                        "image_url": product.image_url,
                        "days_since_last_purchase": item["days_since_last"],
                        "average_purchase_interval": int(item["avg_interval"]),
                        "due_ratio": round(item["due_ratio"], 2),
                        "status": "overdue" if item["due_ratio"] > 1.0 else "due_soon",
                    }
                )

        print(f"Found {len(suggestions)} replenishment suggestions for {phone}")
        return suggestions

    except Exception as e:
        print(f"Error in get_replenishment_suggestions: {e}")
        raise
