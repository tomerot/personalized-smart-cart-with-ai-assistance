from fastapi import APIRouter, HTTPException, status
from services import user as user_service
from schemas import (
    UserResponse,
    UserStatusResponse,
    AddAllergyRequest,
    AddDietaryNeedRequest,
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
async def add_user_allergy(phone: str, request: AddAllergyRequest):
    """
    Add a single allergy to user's allergies list.

    Args:
        phone: User's phone number
        request: AddAllergyRequest with allergy to add

    Returns:
        UserResponse: Updated user profile
    """
    user, was_added = await user_service.add_user_allergy(phone, request.allergy)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with phone '{phone}' not found",
        )

    if not was_added:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Allergy '{request.allergy}' is already in user's allergies list",
        )

    return user


@router.put("/{phone}/dietary-needs", response_model=UserResponse)
async def add_user_dietary_need(phone: str, request: AddDietaryNeedRequest):
    """
    Add a single dietary need to user's dietary needs list.

    Args:
        phone: User's phone number
        request: AddDietaryNeedRequest with dietary need to add

    Returns:
        UserResponse: Updated user profile
    """
    user, was_added = await user_service.add_user_dietary_need(
        phone, request.dietary_need
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with phone '{phone}' not found",
        )

    if not was_added:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Dietary need '{request.dietary_need}' is already in user's dietary needs list",
        )

    return user


@router.delete("/{phone}/dietary-needs", response_model=UserResponse)
async def clear_user_dietary_needs(phone: str):
    """
    Clear all dietary needs from user's dietary needs list.

    Args:
        phone: User's phone number

    Returns:
        UserResponse: Updated user profile with empty dietary needs list
    """
    user = await user_service.clear_user_dietary_needs(phone)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with phone '{phone}' not found",
        )

    return user


@router.delete("/{phone}/dietary-needs/{dietary_need}", response_model=UserResponse)
async def remove_user_dietary_need(phone: str, dietary_need: str):
    """
    Remove a specific dietary need from user's dietary needs list.

    Args:
        phone: User's phone number
        dietary_need: The specific dietary need to remove

    Returns:
        UserResponse: Updated user profile
    """
    user, was_removed = await user_service.remove_user_dietary_need(phone, dietary_need)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with phone '{phone}' not found",
        )

    if not was_removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dietary need '{dietary_need}' not found in user's dietary needs list",
        )

    return user


@router.delete("/{phone}/allergies", response_model=UserResponse)
async def clear_user_allergies(phone: str):
    """
    Clear all allergies from user's allergies list.

    Args:
        phone: User's phone number

    Returns:
        UserResponse: Updated user profile with empty allergies list
    """
    user = await user_service.clear_user_allergies(phone)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with phone '{phone}' not found",
        )

    return user


@router.delete("/{phone}/allergies/{allergy}", response_model=UserResponse)
async def remove_user_allergy(phone: str, allergy: str):
    """
    Remove a specific allergy from user's allergies list.

    Args:
        phone: User's phone number
        allergy: The specific allergy to remove

    Returns:
        UserResponse: Updated user profile
    """
    user, was_removed = await user_service.remove_user_allergy(phone, allergy)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with phone '{phone}' not found",
        )

    if not was_removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Allergy '{allergy}' not found in user's allergies list",
        )

    return user
