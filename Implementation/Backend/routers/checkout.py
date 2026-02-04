from fastapi import APIRouter, HTTPException, status
from services import product_purchase_tracking as tracking_service
from schemas.purchase_tracking import (
    CheckoutResponse,
    ReplenishmentSuggestionsRequest,
    ReplenishmentSuggestionsResponse,
)
from models import User

router = APIRouter(prefix="/checkout", tags=["Checkout"])


@router.post("/{phone}", response_model=CheckoutResponse)
async def checkout(phone: str):
    """
    Checkout: Track all cart items and clear cart.

    Process:
    1. Get cart session
    2. Track each unique product purchase (updates purchase intervals)
    3. Delete cart session

    This endpoint does NOT store complete purchase receipts.
    It only tracks individual product purchase patterns for smart recommendations.

    Args:
        phone: User's phone number

    Returns:
        CheckoutResponse: Success message with tracking summary
    """
    # Validate user exists
    user = await User.find_one(User.phone == phone)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with phone '{phone}' not found",
        )

    try:
        result = await tracking_service.checkout_cart(phone)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Checkout failed: {str(e)}",
        )


@router.post("/{phone}/suggestions", response_model=ReplenishmentSuggestionsResponse)
async def get_replenishment_suggestions(
    phone: str, request: ReplenishmentSuggestionsRequest
):
    """
    Get smart replenishment suggestions based on purchase intervals.

    Returns ALL products that are due for repurchase right now, based on:
    - User's historical buying patterns (average interval between purchases)
    - Time since last purchase

    A product is suggested if:
    - User has bought it at least 3 times (reliable average interval)
    - Days since last purchase is within the due window:
        - Lower bound: average_interval - 3 days
        - Upper bound: average_interval * 1.5
    - Product is NOT already in the cart
    - Product is currently available

    Special case - Returning users (inactive ≥30 days):
    - Upper bound is removed, so ALL frequently-bought products (3+ purchases)
      are suggested to help them restock after being away

    Returns empty list if:
    - User has insufficient purchase history (< 3 purchases per product)
    - No products are currently due for repurchase

    Examples:
        - Milk bought every 7 days: suggests between days 4-10.5
        - Shampoo bought every 30 days: suggests between days 27-45
        - Returning user (30+ days away): suggests all frequently-bought items

    Args:
        phone: User's phone number
        request: Current cart barcodes to exclude from suggestions

    Returns:
        ReplenishmentSuggestionsResponse: All products due for repurchase,
        sorted by most overdue first
    """
    # Validate user exists
    user = await User.find_one(User.phone == phone)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with phone '{phone}' not found",
        )

    try:
        suggestions = await tracking_service.get_replenishment_suggestions(
            phone, request.cart_barcodes
        )

        # Determine appropriate message
        if suggestions:
            message = f"Found {len(suggestions)} item(s) due for repurchase based on your buying habits"
        else:
            message = "No items are due for repurchase right now"

        return {
            "phone": phone,
            "suggestions": suggestions,
            "total_found": len(suggestions),
            "message": message,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get suggestions: {str(e)}",
        )
