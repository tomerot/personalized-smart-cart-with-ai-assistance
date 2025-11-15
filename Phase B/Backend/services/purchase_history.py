from models import Purchase_history, Product
from schemas import PurchaseItem
from typing import List, Dict, Any


async def save_purchase_history(
    phone: str, purchased_items: List[PurchaseItem]
) -> Purchase_history:
    """
    Save or update user's purchase history with cumulative quantities.

    If first purchase: Create new document
    If existing: Merge items and add quantities (e.g., 5 milk + 3 milk = 8 milk total)

    Args:
        phone: User's phone number
        purchased_items: List of items just purchased

    Returns:
        Purchase_history: Updated purchase history document
    """
    try:
        # Check if user has existing purchase history
        history = await Purchase_history.find_one(Purchase_history.phone == phone)

        if not history:
            # First purchase - create new document
            history = Purchase_history(phone=phone, items=purchased_items)
            await history.insert()
            print(f"Created new purchase history for phone: {phone}")
            return history

        # Existing history - merge items and update quantities
        # Convert existing items to dict for easier lookup
        existing_items_dict: Dict[str, int] = {
            item.product_barcode: item.quantity for item in history.items
        }

        # Add/update quantities from new purchase
        for purchased_item in purchased_items:
            barcode = purchased_item.product_barcode
            if barcode in existing_items_dict:
                # Item exists - add quantity
                existing_items_dict[barcode] += purchased_item.quantity
            else:
                # New item - add to dict
                existing_items_dict[barcode] = purchased_item.quantity

        # Convert back to list of PurchaseItems
        updated_items = [
            PurchaseItem(product_barcode=barcode, quantity=quantity)
            for barcode, quantity in existing_items_dict.items()
        ]

        # Update document
        history.items = updated_items
        await history.save()

        print(f"Updated purchase history for phone: {phone}")
        return history

    except Exception as e:
        print(f"Error in save_purchase_history: {e}")
        raise


async def get_forgotten_items(
    phone: str, cart_items: List[PurchaseItem]
) -> List[Dict[str, Any]]:
    """
    Get top 3 frequently bought items that are NOT in the current cart.

    Args:
        phone: User's phone number
        cart_items: List of items currently in the cart (only barcode is used for comparison)

    Returns:
        List of top 3 forgotten items with product details, sorted by purchase frequency
    """
    try:
        # Get purchase history
        history = await Purchase_history.find_one(Purchase_history.phone == phone)
        if not history or not history.items:
            print(f"No purchase history found for phone: {phone}")
            return []

        # Get cart barcodes from provided cart items
        cart_barcodes = {item.product_barcode for item in cart_items}

        # Find items in history but NOT in cart
        forgotten = []
        for item in history.items:
            if item.product_barcode not in cart_barcodes:
                # Get product details
                product = await Product.find_one(
                    Product.barcode == item.product_barcode
                )

                if product and product.available:
                    forgotten.append(
                        {
                            "barcode": product.barcode,
                            "name": product.name,
                            "company": product.company,
                            "category": product.category,
                            "price": product.price,
                            "size": product.size,
                            "total_purchased": item.quantity,  # How many times bought
                        }
                    )

        # Sort by total_purchased (most frequently bought first)
        forgotten.sort(key=lambda x: x["total_purchased"], reverse=True)

        # Return top 3
        top_3_forgotten = forgotten[:3]
        print(f"Found {len(top_3_forgotten)} forgotten items for phone: {phone}")

        return top_3_forgotten

    except Exception as e:
        print(f"Error in get_forgotten_items: {e}")
        raise


async def get_purchase_history(phone: str) -> Purchase_history | None:
    """
    Get user's complete purchase history.

    Args:
        phone: User's phone number

    Returns:
        Purchase_history: User's purchase history or None if not found
    """
    try:
        history = await Purchase_history.find_one(Purchase_history.phone == phone)
        if history:
            print(f"Retrieved purchase history for phone: {phone}")
        else:
            print(f"No purchase history found for phone: {phone}")
        return history
    except Exception as e:
        print(f"Error in get_purchase_history: {e}")
        raise
