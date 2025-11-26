from models import ShoppingList, Category
from schemas.product_item import ProductItemData
from typing import List, Dict, Any, Optional
from services.route_optimizer import calculate_shopping_route


async def create_or_update_shopping_list(
    phone: str, items: List[ProductItemData]
) -> Optional[ShoppingList]:
    """
    Create or update user's shopping list.

    If shopping list exists: Replace with new items
    If not exists: Create new shopping list
    If items is empty: Delete shopping list (no items = no list)

    Also calculates optimized route through store.

    Args:
        phone: User's phone number
        items: List of items with full product data + quantity

    Returns:
        ShoppingList: Created or updated shopping list with optimized route
        None: If items is empty (list deleted)
    """
    try:
        # If items is empty, delete the shopping list instead of saving empty list
        if not items or len(items) == 0:
            deleted = await delete_shopping_list(phone)
            if deleted:
                print(f"Deleted shopping list for {phone} (empty items provided)")
            return None

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

        # Calculate optimized route and coordinates
        if items:
            # Get unique categories from items (now directly from item data)
            categories = [item.category for item in items if item.category]

            if categories:
                # Calculate route using optimizer
                optimized_route = calculate_shopping_route(categories)
                shopping_list.category_order = optimized_route

                # Fetch coordinates from database for each category in the route
                route_coordinates = []
                for category_name in optimized_route:
                    category = await Category.find_one(Category.name == category_name)
                    if category:
                        route_coordinates.append({
                            "x": category.location.x,
                            "y": category.location.y
                        })
                    else:
                        print(f"Warning: Category '{category_name}' not found in database")

                shopping_list.route_coordinates = route_coordinates
                await shopping_list.save()
                print(f"Calculated optimized route: {optimized_route}")
                print(f"Route coordinates: {route_coordinates}")
            else:
                shopping_list.category_order = []
                shopping_list.route_coordinates = []
                await shopping_list.save()
                print("No valid categories found in items")
        else:
            shopping_list.category_order = []
            shopping_list.route_coordinates = []
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
    Get user's shopping list with items sorted by optimized category order.

    Args:
        phone: User's phone number

    Returns:
        ShoppingList: User's shopping list with items sorted by category_order, or None if not found
    """
    try:
        shopping_list = await ShoppingList.find_one(ShoppingList.phone == phone)

        if shopping_list:
            # Sort items by the optimized category order
            if shopping_list.category_order and shopping_list.items:
                # Create category -> index mapping for sorting
                category_index = {
                    cat: idx for idx, cat in enumerate(shopping_list.category_order)
                }

                # Sort items based on category_order (items in same category keep original order)
                shopping_list.items.sort(
                    key=lambda item: category_index.get(item.category, 999)
                )

                print(f"Retrieved shopping list for phone: {phone} (items sorted by route)")
            else:
                print(f"Retrieved shopping list for phone: {phone}")
        else:
            print(f"No shopping list found for phone: {phone}")

        return shopping_list

    except Exception as e:
        print(f"Error in get_shopping_list: {e}")
        raise
