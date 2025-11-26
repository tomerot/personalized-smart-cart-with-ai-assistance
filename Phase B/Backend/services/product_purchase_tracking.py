from models import ProductPurchaseTracking, CartSession, Product, User
from typing import List, Dict, Any, Optional
from datetime import datetime
from statistics import median

# Configuration constants for abandonment detection and freeze logic

# If user shopped within last 14 days → they are "actively shopping"
# Used to detect: "Is user still shopping regularly, but ignoring THIS product?"
ACTIVE_SHOPPER_THRESHOLD_DAYS = 14

# If user hasn't shopped for 30+ days → they are "inactive/away" (vacation, illness, etc.)
# Used in 2 places:
#   1. FREEZE: If inactive for 30+ days, don't update averages on next purchase (preserve pattern)
#   2. SUGGESTIONS: Don't return suggestions if user inactive for 30+ days (don't spam)
INACTIVITY_THRESHOLD_DAYS = 30  # User hasn't shopped in 30+ days = inactive/away (ex. vacation) - we dont track the last purchase interval

# Used together to detect abandoned products:
# Threshold = max(60 days, average_interval * 2.5)
# If user is ACTIVE (shopped within 14 days) BUT specific product overdue by threshold → DELETE tracking
# Examples:
#   - Milk (7-day avg): threshold = max(60, 7×2.5) = 60 days
#   - Shampoo (30-day avg): threshold = max(60, 30×2.5) = 75 days
ABANDONMENT_MULTIPLIER = 2.5
ABANDONMENT_THRESHOLD_DAYS = 60


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
    2. Freeze Logic: Don't update average if user was inactive (long absence)
    3. Outlier Protection: Use median-based averaging to handle anomalies

    Automatically calculates and updates:
    - purchase_count
    - last_purchase_date
    - average_interval_days (if >= 2 purchases)

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
            purchase_dates=[purchase_date],
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
        # User is active shopper but this product is way overdue
        if (
            days_since_last_shop is not None
            and days_since_last_shop < ACTIVE_SHOPPER_THRESHOLD_DAYS
        ):
            # User is actively shopping
            if tracking.average_interval_days:
                # Calculate abandonment threshold
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
                        f"   Threshold: {abandonment_threshold} days\n"
                        f"   → Deleting product tracking"
                    )
                    await tracking.delete()
                    return

        # FREEZE LOGIC (Long Absence)
        # User hasn't shopped at all for a long time
        freeze_data = False
        if user.last_checkout_date:
            days_inactive = (purchase_date - user.last_checkout_date).days
            if days_inactive > INACTIVITY_THRESHOLD_DAYS:
                freeze_data = True
                print(
                    f"❄️ FREEZE MODE: {phone} - {barcode}\n"
                    f"   User inactive for {days_inactive} days\n"
                    f"   → Keeping old average, just updating date"
                )

        # Add new purchase date
        tracking.purchase_dates.append(purchase_date)
        tracking.purchase_count += 1
        tracking.last_purchase_date = purchase_date

        # Recalculate average interval if we have 2+ purchases
        if len(tracking.purchase_dates) >= 2:
            if freeze_data:
                # FREEZE: Don't recalculate average (long absence)
                # Keep the old average_interval_days
                print(
                    f"   Keeping frozen average: {tracking.average_interval_days:.1f} days"
                )
            else:
                # NORMAL: Recalculate average with outlier protection
                sorted_dates = sorted(tracking.purchase_dates)
                intervals = [
                    (sorted_dates[i] - sorted_dates[i - 1]).days
                    for i in range(1, len(sorted_dates))
                ]

                tracking.average_interval_days = calculate_robust_average_interval(
                    intervals
                )

                print(
                    f"Updated tracking for {phone} - {barcode}: "
                    f"{tracking.purchase_count} purchases, "
                    f"avg interval: {tracking.average_interval_days:.1f} days"
                )

    await tracking.save()


def calculate_robust_average_interval(intervals: List[float]) -> float:
    """
    Calculate average interval with outlier handling using median.

    Strategy:
    1. If < 3 purchases, use mean (not enough data for outlier detection)
    2. If >= 3 purchases, use median (robust to outliers)
    3. Remove extreme outliers (>3x median) before calculating
    4. Minimum return value is 1 day (prevents division by zero)

    Args:
        intervals: List of days between purchases

    Returns:
        Average interval in days (median-based for robustness, minimum 1 day)
    """
    if not intervals:
        return 1  # Minimum 1 day interval

    if len(intervals) < 3:
        # Not enough data for robust statistics, use simple mean
        result = sum(intervals) / len(intervals)
        return max(result, 1)  # Ensure at least 1 day

    # Use median (robust to outliers)
    median_val = median(intervals)

    # Remove extreme outliers (>3x median)
    # Example: [7, 7, 8, 50] -> median=7.5, remove 50 (>22.5)
    filtered = [interval for interval in intervals if interval <= median_val * 3]

    # If we filtered everything out (rare edge case), use original
    if not filtered:
        filtered = intervals

    # Return median of filtered data (most robust approach)
    result = median(filtered)
    return max(result, 1)  # Ensure at least 1 day (prevents division by zero)


async def get_replenishment_suggestions(
    phone: str, cart_barcodes: List[str]
) -> List[Dict[str, Any]]:
    """
    Get ALL products that are due for repurchase based on their buying intervals.

    NEW: Returns empty if user is inactive (hasn't shopped in 30+ days) to avoid
    suggesting items during long absences (vacation, illness, etc.)

    A product is "due" if:
    - User has bought it at least 2 times (can calculate average interval)
    - Days since last purchase is between (avg_interval - 1) and (avg_interval * 1.5)

    Example:
        - Product bought every 20 days (average_interval_days = 20)
        - Due window: 19 days to 30 days
        - If last bought 22 days ago → SUGGEST (overdue)
        - If last bought 10 days ago → DON'T SUGGEST (too early)

    Args:
        phone: User's phone number
        cart_barcodes: List of product barcodes currently in cart (exclude these)

    Returns:
        List of due products with details, sorted by most overdue first.
        Returns empty list if:
        - User is inactive (hasn't shopped in 30+ days)
        - No products are due
        - User has insufficient purchase history
    """
    try:
        # Check if user is active
        user = await User.find_one(User.phone == phone)
        if not user:
            print(f"User {phone} not found")
            return []

        # If user is inactive, don't suggest anything (they're away)
        if user.last_checkout_date:
            days_inactive = (datetime.utcnow() - user.last_checkout_date).days
            if days_inactive > INACTIVITY_THRESHOLD_DAYS:
                print(
                    f"⏸️ USER INACTIVE: {phone}\n"
                    f"   Last shopped: {days_inactive} days ago\n"
                    f"   → Returning no suggestions (user is away)"
                )
                return []

        # Get all tracked products for this user with 2+ purchases
        tracked = await ProductPurchaseTracking.find(
            ProductPurchaseTracking.phone == phone,
            ProductPurchaseTracking.purchase_count >= 2,
            ProductPurchaseTracking.average_interval_days != None,
        ).to_list()

        if not tracked:
            print(f"No tracking data with 2+ purchases found for {phone}")
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

            # Calculate due window: (avg - 1 day) to (avg * 1.5)
            lower_bound = avg_interval - 1
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
