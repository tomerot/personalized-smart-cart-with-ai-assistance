from models import ShoppingList, Product
from schemas import Item
from typing import List, Dict, Any, Optional
from services.route_optimizer import calculate_shopping_route


async def create_or_update_shopping_list(
    phone: str, items: List[Item]
) -> ShoppingList:
    """
    Create or update user's shopping list.

    If shopping list exists: Replace with new items
    If not exists: Create new shopping list

    Also calculates optimized route through store.

    Args:
        phone: User's phone number
        items: List of items to set in shopping list

    Returns:
        ShoppingList: Created or updated shopping list with optimized route
    """
    try:
        # Check if shopping list exists
        shopping_list = await ShoppingList.find_one(ShoppingList.phone == phone)

        if shopping_list:
            # Update existing list
            shopping_list.items = items
            await shopping_list.save()
            print(f"Updated shopping list for phone: {phone}")
        else:
            # Create new list
            shopping_list = ShoppingList(phone=phone, items=items)
            await shopping_list.insert()
            print(f"Created new shopping list for phone: {phone}")

        # Calculate optimized route
        if items:
            # Get unique categories from items
            categories = []
            for item in items:
                product = await Product.find_one(Product.barcode == item.product_barcode)
                if product and product.category:
                    categories.append(product.category)

            if categories:
                # Calculate route using JSON-based optimizer
                optimized_route = calculate_shopping_route(categories)
                shopping_list.optimized_route = optimized_route
                await shopping_list.save()
                print(f"Calculated optimized route: {optimized_route}")
            else:
                shopping_list.optimized_route = []
                await shopping_list.save()
                print("No valid categories found in items")
        else:
            shopping_list.optimized_route = []
            await shopping_list.save()

        return shopping_list

    except Exception as e:
        print(f"Error in create_or_update_shopping_list: {e}")
        raise


async def delete_shopping_list(phone: str) -> bool:
    """
    Delete user's shopping list.

    Args:
        phone: User's phone number

    Returns:
        bool: True if deleted, False if not found
    """
    try:
        shopping_list = await ShoppingList.find_one(ShoppingList.phone == phone)

        if not shopping_list:
            print(f"No shopping list found for phone: {phone}")
            return False

        await shopping_list.delete()
        print(f"Deleted shopping list for phone: {phone}")
        return True

    except Exception as e:
        print(f"Error in delete_shopping_list: {e}")
        raise


async def get_shopping_list(phone: str) -> Optional[ShoppingList]:
    """
    Get user's shopping list (items only).

    Args:
        phone: User's phone number

    Returns:
        ShoppingList: User's shopping list or None if not found
    """
    try:
        shopping_list = await ShoppingList.find_one(ShoppingList.phone == phone)

        if shopping_list:
            print(f"Retrieved shopping list for phone: {phone}")
        else:
            print(f"No shopping list found for phone: {phone}")

        return shopping_list

    except Exception as e:
        print(f"Error in get_shopping_list: {e}")
        raise


async def get_shopping_list_with_products(phone: str) -> Dict[str, Any]:
    """
    Get user's shopping list with full product information for each item.

    Args:
        phone: User's phone number

    Returns:
        Dict with shopping list and detailed product information:
        {
            "phone": str,
            "items": [
                {
                    "product_barcode": str,
                    "quantity": int,
                    "product_details": {
                        "name": str,
                        "company": str,
                        "category": str,
                        "price": float,
                        ...
                    }
                }
            ]
        }
    """
    try:
        # Get shopping list
        shopping_list = await ShoppingList.find_one(ShoppingList.phone == phone)

        if not shopping_list:
            print(f"No shopping list found for phone: {phone}")
            return None

        # Fetch product details for each item
        items_with_details = []

        for item in shopping_list.items:
            product = await Product.find_one(Product.barcode == item.product_barcode)

            if product:
                items_with_details.append({
                    "product_barcode": item.product_barcode,
                    "quantity": item.quantity,
                    "product_details": {
                        "name": product.name,
                        "image_url": product.image_url,
                        "company": product.company,
                        "category": product.category,
                        "price": product.price,
                        "allergens": product.allergens,
                        "dietary_tags": product.dietary_tags,
                        "nutritional_info": {
                            "calories_per_100g": product.nutritional_info.calories_per_100g,
                            "fat_per_100g": product.nutritional_info.fat_per_100g,
                            "sodium_per_100mg": product.nutritional_info.sodium_per_100mg,
                            "carbs_per_100g": product.nutritional_info.carbs_per_100g,
                            "sugar_per_100g": product.nutritional_info.sugar_per_100g,
                            "protein_per_100g": product.nutritional_info.protein_per_100g,
                        },
                        "available": product.available,
                    },
                })
            else:
                # Product not found, include minimal info
                items_with_details.append({
                    "product_barcode": item.product_barcode,
                    "quantity": item.quantity,
                    "product_details": None,
                })

        print(
            f"Retrieved shopping list with product details for phone: {phone} ({len(items_with_details)} items)"
        )

        return {
            "phone": phone,
            "items": items_with_details,
            "optimized_route": shopping_list.optimized_route or []
        }

    except Exception as e:
        print(f"Error in get_shopping_list_with_products: {e}")
        raise
