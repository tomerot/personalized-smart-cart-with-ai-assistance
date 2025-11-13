from fastapi import APIRouter, HTTPException, status
from services import purchase_history as history_service
from schemas import (
    SavePurchaseRequest,
    PurchaseHistoryResponse,
    CheckForgottenItemsRequest,
    ForgottenItemsResponse,
)
from models import User

router = APIRouter(prefix="/purchase-history", tags=["Purchase History"])


@router.post("/{phone}", response_model=PurchaseHistoryResponse)
async def save_purchase_history(phone: str, request: SavePurchaseRequest):
    """
    Save or update user's purchase history with cumulative quantities.

    - First purchase: Creates new purchase history document
    - Subsequent purchases: Merges items and adds quantities
      (e.g., previous 5 milk + new 3 milk = 8 milk total)

    Args:
        phone: User's phone number
        request: SavePurchaseRequest with list of purchased items

    Returns:
        PurchaseHistoryResponse: Updated purchase history
    """
    # Validate user exists
    user = await User.find_one(User.phone == phone)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with phone '{phone}' not found",
        )

    try:
        history = await history_service.save_purchase_history(phone, request.items)
        return history
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save purchase history: {str(e)}",
        )


@router.get("/{phone}", response_model=PurchaseHistoryResponse)
async def get_purchase_history(phone: str):
    """
    Get user's complete purchase history.

    Args:
        phone: User's phone number

    Returns:
        PurchaseHistoryResponse: User's purchase history with all items
    """
    history = await history_service.get_purchase_history(phone)

    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No purchase history found for phone '{phone}'",
        )

    return history


@router.post("/{phone}/forgotten-items", response_model=ForgottenItemsResponse)
async def check_forgotten_items(phone: str, request: CheckForgottenItemsRequest):
    """
    Get top 3 frequently bought items that are NOT in the current cart.

    Compares purchase history with current cart items (sent from frontend)
    to find items the user usually buys but forgot this time.
    Always returns top 3 items sorted by purchase frequency.

    Args:
        phone: User's phone number
        request: CheckForgottenItemsRequest with current cart items

    Returns:
        ForgottenItemsResponse: Top 3 forgotten items with details
    """
    try:
        forgotten = await history_service.get_forgotten_items(phone, request.items)

        return {
            "phone": phone,
            "forgotten_items": forgotten,
            "total_found": len(forgotten),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get forgotten items: {str(e)}",
        )
