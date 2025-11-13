from fastapi import APIRouter, HTTPException, status
from services import shopping_list as shopping_list_service
from schemas import (
    ShoppingListRequest,
    ShoppingListResponse,
    ShoppingListWithProductsResponse,
)
from models import User

router = APIRouter(prefix="/shopping-list", tags=["Shopping List"])


@router.post("/{phone}", response_model=ShoppingListResponse)
async def create_or_update_shopping_list(phone: str, request: ShoppingListRequest):
    """
    Create or update user's shopping list.

    - If shopping list exists: Replaces items with new list
    - If not exists: Creates new shopping list

    Args:
        phone: User's phone number
        request: ShoppingListRequest with list of items

    Returns:
        ShoppingListResponse: Created or updated shopping list
    """
    # Validate user exists
    user = await User.find_one(User.phone == phone)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with phone '{phone}' not found",
        )

    try:
        shopping_list = await shopping_list_service.create_or_update_shopping_list(
            phone, request.items
        )
        return shopping_list
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create/update shopping list: {str(e)}",
        )


@router.delete("/{phone}")
async def delete_shopping_list(phone: str):
    """
    Delete user's shopping list.

    Args:
        phone: User's phone number

    Returns:
        Success message
    """
    deleted = await shopping_list_service.delete_shopping_list(phone)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No shopping list found for phone '{phone}'",
        )

    return {"message": f"Shopping list deleted successfully for phone '{phone}'"}


@router.get("/{phone}", response_model=ShoppingListResponse)
async def get_shopping_list(phone: str):
    """
    Get user's shopping list (items only with barcodes and quantities).

    Args:
        phone: User's phone number

    Returns:
        ShoppingListResponse: Shopping list with items
    """
    shopping_list = await shopping_list_service.get_shopping_list(phone)

    if not shopping_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No shopping list found for phone '{phone}'",
        )

    return shopping_list


@router.get(
    "/{phone}/with-products-info", response_model=ShoppingListWithProductsResponse
)
async def get_shopping_list_with_products(phone: str):
    """
    Get user's shopping list with full product information for each item.

    Returns shopping list items enriched with complete product details including:
    - Product name, company, category
    - Price and availability
    - Allergens and dietary tags
    - Nutritional information

    Args:
        phone: User's phone number

    Returns:
        ShoppingListWithProductsResponse: Shopping list with detailed product info
    """
    result = await shopping_list_service.get_shopping_list_with_products(phone)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No shopping list found for phone '{phone}'",
        )

    return result
