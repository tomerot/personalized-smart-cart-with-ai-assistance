from models import ShoppingList, Category
from schemas.product_item import ProductItemData
from typing import List, Dict, Any, Optional
from services.route_optimizer import calculate_shopping_route


async def create_or_update_shopping_list(
    phone: str, items: List[ProductItemData]
) -> ShoppingList:
    """
    Create or update user's shopping list.

    If shopping list exists: Replace with new items
    If not exists: Create new shopping list

    Also calculates optimized route through store.

    Args:
        phone: User's phone number
        items: List of items with full product data + quantity

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
