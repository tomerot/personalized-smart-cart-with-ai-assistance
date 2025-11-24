from fastapi import APIRouter, HTTPException, status
from services import user as user_service
from schemas import (
    UserResponse,
    UserStatusResponse,
    AllergiesRequest,
    DietaryNeedsRequest,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{phone}", response_model=UserResponse)
async def get_user_profile(phone: str):
    """
    Get user profile by phone number.

    Args:
        phone: User's phone number

    Returns:
        UserResponse: User profile with allergies and dietary needs
    """
    user = await user_service.get_user_profile(phone)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with phone '{phone}' not found",
        )

    return user


@router.get("/{phone}/status", response_model=UserStatusResponse)
async def get_user_status(phone: str):
    """
    Get user status including cart session and shopping list availability.

    Called after login to determine what UI elements to show/enable:
    - If has_active_cart is true: we can load cart session - maybe auto load, and pop msg
    - If has_shopping_list is true: Enable "Load List" button

    Args:
        phone: User's phone number

    Returns:
        UserStatusResponse: Flags indicating active cart and shopping list presence
    """
    return await user_service.get_user_status(phone)


@router.put("/{phone}/allergies", response_model=UserResponse)
async def add_user_allergies(phone: str, request: AllergiesRequest):
    """
    Add multiple allergies to user's allergies list.

    Only adds allergies that don't already exist. Duplicates are automatically skipped.

    Args:
        phone: User's phone number
        request: AllergiesRequest with list of allergies to add

    Returns:
        UserResponse: Updated user profile
    """
    user = await user_service.add_user_allergies(phone, request.allergies)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with phone '{phone}' not found",
        )

    return user


@router.delete("/{phone}/allergies", response_model=UserResponse)
async def remove_user_allergies(phone: str, request: AllergiesRequest):
    """
    Remove multiple allergies from user's allergies list.

    If empty list provided, no changes are made.

    Args:
        phone: User's phone number
        request: AllergiesRequest with list of allergies to remove

    Returns:
        UserResponse: Updated user profile
    """
    user = await user_service.remove_user_allergies(phone, request.allergies)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with phone '{phone}' not found",
        )

    return user


@router.put("/{phone}/dietary-needs", response_model=UserResponse)
async def add_user_dietary_needs(phone: str, request: DietaryNeedsRequest):
    """
    Add multiple dietary needs to user's dietary needs list.

    Only adds dietary needs that don't already exist. Duplicates are automatically skipped.

    Args:
        phone: User's phone number
        request: DietaryNeedsRequest with list of dietary needs to add

    Returns:
        UserResponse: Updated user profile
    """
    user = await user_service.add_user_dietary_needs(phone, request.dietary_needs)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with phone '{phone}' not found",
        )

    return user


@router.delete("/{phone}/dietary-needs", response_model=UserResponse)
async def remove_user_dietary_needs(phone: str, request: DietaryNeedsRequest):
    """
    Remove multiple dietary needs from user's dietary needs list.

    If empty list provided, no changes are made.

    Args:
        phone: User's phone number
        request: DietaryNeedsRequest with list of dietary needs to remove

    Returns:
        UserResponse: Updated user profile
    """
    user = await user_service.remove_user_dietary_needs(phone, request.dietary_needs)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with phone '{phone}' not found",
        )

    return user
