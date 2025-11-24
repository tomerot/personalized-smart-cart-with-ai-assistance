from models import Purchase_history, CartSession
from schemas.product_item import PurchaseData
from typing import List, Dict, Any, Optional
from datetime import datetime


async def checkout_cart(phone: str) -> Optional[Purchase_history]:
    """
    Checkout: Convert cart session to purchase and add to history.

    1. Get cart session
    2. Calculate total amount and total items
    3. Create PurchaseData from cart
    4. Add to purchase history (keep max 3 purchases)
    5. Delete cart session

    Args:
        phone: User's phone number

    Returns:
        Purchase_history: Updated purchase history or None if cart not found
    """
    try:
        # Get cart session
        cart_session = await CartSession.find_one(CartSession.phone == phone)
        if not cart_session or not cart_session.items:
            print(f"No cart session found for phone: {phone}")
            return None

        # Calculate totals
        total_amount = sum(item.price * item.quantity for item in cart_session.items)
        total_items = sum(item.quantity for item in cart_session.items)

        # Create purchase data from cart
        new_purchase = PurchaseData(
            items=cart_session.items,
            created_at=datetime.utcnow(),
            total_amount=total_amount,
            total_items=total_items,
        )

        # Get or create purchase history
        history = await Purchase_history.find_one(Purchase_history.phone == phone)

        if not history:
            # First purchase - create new document
            history = Purchase_history(phone=phone, purchases=[new_purchase])
            await history.insert()
            print(f"Created new purchase history for phone: {phone}")
        else:
            # Add new purchase to list
            history.purchases.append(new_purchase)

            # Keep only last 3 purchases (remove oldest if > 3)
            if len(history.purchases) > 3:
                history.purchases = history.purchases[-3:]  # Keep last 3

            await history.save()
            print(
                f"Added purchase to history for phone: {phone}. Total purchases: {len(history.purchases)}"
            )

        # Delete cart session after successful checkout
        await cart_session.delete()
        print(f"Deleted cart session for phone: {phone} after checkout")

        return history

    except Exception as e:
        print(f"Error in checkout_cart: {e}")
        raise


async def get_forgotten_items(
    phone: str, cart_barcodes: List[str]
) -> List[Dict[str, Any]]:
    """
    Get top 3 frequently bought items from last 3 purchases that are NOT in the current cart.

    Args:
        phone: User's phone number
        cart_barcodes: List of product barcodes currently in the cart

    Returns:
        List of top 3 forgotten items with product details, sorted by purchase frequency
    """
    try:
        # Get purchase history
        history = await Purchase_history.find_one(Purchase_history.phone == phone)
        if not history or not history.purchases:
            print(f"No purchase history found for phone: {phone}")
            return []

        # Count item frequencies across all purchases (last 3)
        item_frequency: Dict[str, Dict[str, Any]] = {}

        for purchase in history.purchases:
            for item in purchase.items:
                barcode = item.barcode
                if barcode not in cart_barcodes:  # Only items NOT in cart
                    if barcode not in item_frequency:
                        # Store first occurrence with full product data
                        item_frequency[barcode] = {
                            "barcode": item.barcode,
                            "name": item.name,
                            "company": item.company,
                            "category": item.category,
                            "price": item.price,
                            "size": item.size,
                            "image_url": item.image_url,
                            "frequency": 0,
                        }
                    # Increment frequency (count how many times purchased)
                    item_frequency[barcode]["frequency"] += item.quantity

        # Convert to list and sort by frequency
        forgotten = list(item_frequency.values())
        forgotten.sort(key=lambda x: x["frequency"], reverse=True)

        # Return top 3
        top_3_forgotten = forgotten[:3]
        print(f"Found {len(top_3_forgotten)} forgotten items for phone: {phone}")

        return top_3_forgotten

    except Exception as e:
        print(f"Error in get_forgotten_items: {e}")
        raise


async def get_purchase_history(phone: str) -> Optional[Purchase_history]:
    """
    Get user's complete purchase history (last 3 purchases).

    Args:
        phone: User's phone number

    Returns:
        Purchase_history: User's purchase history or None if not found
    """
    try:
        history = await Purchase_history.find_one(Purchase_history.phone == phone)
        if history:
            print(
                f"Retrieved purchase history for phone: {phone} ({len(history.purchases)} purchases)"
            )
        else:
            print(f"No purchase history found for phone: {phone}")
        return history
    except Exception as e:
        print(f"Error in get_purchase_history: {e}")
        raise
