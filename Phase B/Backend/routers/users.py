from fastapi import APIRouter, HTTPException, status
from services import user as user_service
from schemas import UserResponse, UpdateAllergiesRequest, UpdateDietaryNeedsRequest

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{phone}", response_model=UserResponse)
async def get_user_profile(phone: str):
    """
    Get user profile by phone number.

    Args:
        phone: User's phone number (e.g., +972123456789)

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


@router.put("/{phone}/allergies", response_model=UserResponse)
async def update_user_allergies(phone: str, request: UpdateAllergiesRequest):
    """
    Update user's allergies list.

    Args:
        phone: User's phone number
        request: UpdateAllergiesRequest with new allergies list

    Returns:
        UserResponse: Updated user profile
    """
    user = await user_service.update_user_allergies(phone, request.allergies)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with phone '{phone}' not found",
        )

    return user


@router.put("/{phone}/dietary-needs", response_model=UserResponse)
async def update_user_dietary_needs(phone: str, request: UpdateDietaryNeedsRequest):
    """
    Update user's dietary needs list.

    Args:
        phone: User's phone number
        request: UpdateDietaryNeedsRequest with new dietary needs list

    Returns:
        UserResponse: Updated user profile
    """
    user = await user_service.update_user_dietary_needs(phone, request.dietary_needs)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with phone '{phone}' not found",
        )

    return user
