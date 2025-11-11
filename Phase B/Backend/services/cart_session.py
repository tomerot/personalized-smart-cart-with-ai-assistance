from typing import Optional, List
from datetime import datetime
from models import CartSession
from schemas import Item


async def sync_cart_session(phone: str, items: List[Item]) -> CartSession:
    """
    Sync/save cart session for user.
    Creates new session if doesn't exist, updates if exists.

    Args:
        phone: User's phone number
        items: List of cart items (barcode + quantity)

    Returns:
        CartSession: Updated cart session
    """
    # Try to find existing cart session
    cart_session = await CartSession.find_one(CartSession.phone == phone)

    if cart_session:
        # Update existing session
        cart_session.items = [Item(**item.model_dump()) for item in items]
        cart_session.last_updated = datetime.utcnow()
        await cart_session.save()
    else:
        # Create new session
        cart_session = CartSession(
            phone=phone,
            items=[Item(**item.model_dump()) for item in items],
            last_updated=datetime.utcnow()
        )
        await cart_session.insert()

    return cart_session


async def get_cart_session(phone: str) -> Optional[CartSession]:
    """
    Retrieve cart session for user.

    Args:
        phone: User's phone number

    Returns:
        CartSession or None if not found
    """
    return await CartSession.find_one(CartSession.phone == phone)


async def delete_cart_session(phone: str) -> bool:
    """
    Delete cart session for user.
    Typically called after successful checkout or when user explicitly clears cart.

    Args:
        phone: User's phone number

    Returns:
        bool: True if deleted, False if not found
    """
    cart_session = await CartSession.find_one(CartSession.phone == phone)

    if cart_session:
        await cart_session.delete()
        return True

    return False
