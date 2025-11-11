from models import User
from typing import List, Optional


async def get_or_create_user(phone: str) -> User:
    """
    Get existing user by phone or create a new one if doesn't exist.

    Args:
        phone: User's phone number

    Returns:
        User: The existing or newly created user
    """
    try:
        # Try to find existing user
        user = await User.find_one(User.phone == phone)

        if user:
            print(f"User found for phone: {phone}")
            return user

        # Create new user if doesn't exist
        new_user = User(phone=phone, allergies=[], dietary_needs=[])
        await new_user.insert()
        print(f"New user created for phone: {phone}")
        return new_user

    except Exception as e:
        print(f"Error in get_or_create_user: {e}")
        raise


async def get_user_profile(phone: str) -> Optional[User]:
    """
    Get user profile by phone number.

    Args:
        phone: User's phone number

    Returns:
        User: User object if found, None otherwise
    """
    try:
        user = await User.find_one(User.phone == phone)
        if user:
            print(f"Retrieved profile for phone: {phone}")
        else:
            print(f"No profile found for phone: {phone}")
        return user
    except Exception as e:
        print(f"Error in get_user_profile: {e}")
        raise


async def update_user_allergies(phone: str, allergies: List[str]) -> Optional[User]:
    """
    Update user's allergies list.

    Args:
        phone: User's phone number
        allergies: New list of allergies to set

    Returns:
        User: Updated user object if found, None otherwise
    """
    try:
        user = await User.find_one(User.phone == phone)
        if not user:
            print(f"User not found for phone: {phone}")
            return None

        user.allergies = allergies
        await user.save()
        print(f"Updated allergies for phone: {phone} - {allergies}")
        return user
    except Exception as e:
        print(f"Error in update_user_allergies: {e}")
        raise


async def update_user_dietary_needs(
    phone: str, dietary_needs: List[str]
) -> Optional[User]:
    """
    Update user's dietary needs list.

    Args:
        phone: User's phone number
        dietary_needs: New list of dietary needs to set

    Returns:
        User: Updated user object if found, None otherwise
    """
    try:
        user = await User.find_one(User.phone == phone)
        if not user:
            print(f"User not found for phone: {phone}")
            return None

        user.dietary_needs = dietary_needs
        await user.save()
        print(f"Updated dietary needs for phone: {phone} - {dietary_needs}")
        return user
    except Exception as e:
        print(f"Error in update_user_dietary_needs: {e}")
        raise
