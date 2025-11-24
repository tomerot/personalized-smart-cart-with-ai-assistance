from fastapi import APIRouter, HTTPException, status
from services import purchase_history as history_service
from schemas import (
    PurchaseHistoryResponse,
    CheckForgottenItemsRequest,
    ForgottenItemsResponse,
)
from models import User

router = APIRouter(prefix="/purchase-history", tags=["Purchase History"])


@router.post("/{phone}/checkout", response_model=PurchaseHistoryResponse)
async def checkout(phone: str):
    """
    Checkout: Convert cart session to purchase and add to history.

    Process:
    1. Get cart session
    2. Convert to purchase (with full product data)
    3. Add to purchase history (keep last 3 purchases)
    4. Delete cart session

    Args:
        phone: User's phone number

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
        history = await history_service.checkout_cart(phone)
        if not history:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No cart session found for phone '{phone}'",
            )
        return history
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to checkout: {str(e)}",
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
    Get top 3 frequently bought items from last 3 purchases that are NOT in the current cart.

    Compares purchase history with current cart barcodes (sent from frontend)
    to find items the user usually buys but forgot this time.
    Returns top 3 items sorted by purchase frequency.

    Args:
        phone: User's phone number
        request: CheckForgottenItemsRequest with current cart barcodes

    Returns:
        ForgottenItemsResponse: Top 3 forgotten items with details
    """
    try:
        forgotten = await history_service.get_forgotten_items(phone, request.cart_barcodes)

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
