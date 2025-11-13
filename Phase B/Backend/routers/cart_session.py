from fastapi import APIRouter, HTTPException, status
from schemas import CartSyncRequest, CartSessionResponse, CartRecoveryResponse
from services import cart_session
from models import User

router = APIRouter(prefix="/cart-session", tags=["Cart Session"])


@router.post("/{phone}/sync", response_model=CartSessionResponse)
async def sync_cart(phone: str, request: CartSyncRequest):
    """
    Sync/save cart session for crash recovery.

    This endpoint should be called periodically (e.g., every 3 minutes) to backup
    the user's cart state. Creates new session if doesn't exist, updates if exists.

    Args:
        phone: User's phone number
        request: Cart items to save

    Returns:
        CartSessionResponse: Saved cart session with timestamp
    """
    # Validate user exists
    user = await User.find_one(User.phone == phone)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with phone '{phone}' not found",
        )

    cart = await cart_session.sync_cart_session(phone, request.items)
    return cart


@router.get("/{phone}", response_model=CartRecoveryResponse)
async def get_cart(phone: str):
    """
    Check for active cart session and retrieve for recovery if exists.

    Used when user logs in to check if they have a saved cart session
    that needs to be recovered (e.g., after app crash).

    Args:
        phone: User's phone number

    Returns:
        CartRecoveryResponse:
            - has_active_session: true if cart exists, false otherwise
            - cart_session: The saved cart data if exists, null otherwise
            - message: Description of the result
    """
    cart = await cart_session.get_cart_session(phone)

    if not cart:
        return CartRecoveryResponse(
            has_active_session=False,
            cart_session=None,
            message="No active cart session found. User can start fresh shopping."
        )

    return CartRecoveryResponse(
        has_active_session=True,
        cart_session=cart,
        message="Active cart session found. Ready for recovery."
    )


@router.delete("/{phone}")
async def delete_cart(phone: str):
    """
    Delete cart session.

    Should be called after successful checkout or when user explicitly clears cart.
    This removes the backup session from the database.

    Args:
        phone: User's phone number

    Returns:
        Success message

    Raises:
        404: No cart session found for this user
    """
    deleted = await cart_session.delete_cart_session(phone)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No cart session found for this user"
        )

    return {"message": f"Cart session deleted successfully for phone '{phone}'"}
