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


async def add_user_allergy(phone: str, allergy: str) -> tuple[Optional[User], bool]:
    """
    Add a single allergy to user's allergies list.

    Args:
        phone: User's phone number
        allergy: Single allergy to add (will be converted to lowercase)

    Returns:
        tuple: (User object if found/None, True if added/False if already exists)
    """
    try:
        user = await User.find_one(User.phone == phone)
        if not user:
            print(f"User not found for phone: {phone}")
            return None, False

        # Convert allergy to lowercase for consistency
        allergy_lower = allergy.lower()

        # Check if allergy already exists
        if allergy_lower in user.allergies:
            print(f"Allergy '{allergy_lower}' already exists for phone: {phone}")
            return user, False

        # Add the new allergy
        user.allergies.append(allergy_lower)
        await user.save()
        print(f"Added allergy '{allergy_lower}' for phone: {phone}")
        return user, True
    except Exception as e:
        print(f"Error in add_user_allergy: {e}")
        raise


async def remove_user_allergy(phone: str, allergy: str) -> tuple[Optional[User], bool]:
    """
    Remove a specific allergy from user's allergies list.

    Args:
        phone: User's phone number
        allergy: Single allergy to remove (will be converted to lowercase)

    Returns:
        tuple: (User object if found/None, True if removed/False if not found)
    """
    try:
        user = await User.find_one(User.phone == phone)
        if not user:
            print(f"User not found for phone: {phone}")
            return None, False

        # Convert allergy to lowercase for consistency
        allergy_lower = allergy.lower()

        # Check if allergy exists
        if allergy_lower not in user.allergies:
            print(f"Allergy '{allergy_lower}' not found for phone: {phone}")
            return user, False

        # Remove the allergy
        user.allergies.remove(allergy_lower)
        await user.save()
        print(f"Removed allergy '{allergy_lower}' for phone: {phone}")
        return user, True
    except Exception as e:
        print(f"Error in remove_user_allergy: {e}")
        raise


async def clear_user_allergies(phone: str) -> Optional[User]:
    """
    Clear all allergies from user's allergies list.

    Args:
        phone: User's phone number

    Returns:
        User: Updated user object if found, None otherwise
    """
    try:
        user = await User.find_one(User.phone == phone)
        if not user:
            print(f"User not found for phone: {phone}")
            return None

        user.allergies = []
        await user.save()
        print(f"Cleared all allergies for phone: {phone}")
        return user
    except Exception as e:
        print(f"Error in clear_user_allergies: {e}")
        raise


async def add_user_dietary_need(
    phone: str, dietary_need: str
) -> tuple[Optional[User], bool]:
    """
    Add a single dietary need to user's dietary needs list.

    Args:
        phone: User's phone number
        dietary_need: Single dietary need to add (will be converted to lowercase)

    Returns:
        tuple: (User object if found/None, True if added/False if already exists)
    """
    try:
        user = await User.find_one(User.phone == phone)
        if not user:
            print(f"User not found for phone: {phone}")
            return None, False

        # Convert dietary need to lowercase for consistency
        dietary_need_lower = dietary_need.lower()

        # Check if dietary need already exists
        if dietary_need_lower in user.dietary_needs:
            print(
                f"Dietary need '{dietary_need_lower}' already exists for phone: {phone}"
            )
            return user, False

        # Add the new dietary need
        user.dietary_needs.append(dietary_need_lower)
        await user.save()
        print(f"Added dietary need '{dietary_need_lower}' for phone: {phone}")
        return user, True
    except Exception as e:
        print(f"Error in add_user_dietary_need: {e}")
        raise


async def remove_user_dietary_need(
    phone: str, dietary_need: str
) -> tuple[Optional[User], bool]:
    """
    Remove a specific dietary need from user's dietary needs list.

    Args:
        phone: User's phone number
        dietary_need: Single dietary need to remove (will be converted to lowercase)

    Returns:
        tuple: (User object if found/None, True if removed/False if not found)
    """
    try:
        user = await User.find_one(User.phone == phone)
        if not user:
            print(f"User not found for phone: {phone}")
            return None, False

        # Convert dietary need to lowercase for consistency
        dietary_need_lower = dietary_need.lower()

        # Check if dietary need exists
        if dietary_need_lower not in user.dietary_needs:
            print(f"Dietary need '{dietary_need_lower}' not found for phone: {phone}")
            return user, False

        # Remove the dietary need
        user.dietary_needs.remove(dietary_need_lower)
        await user.save()
        print(f"Removed dietary need '{dietary_need_lower}' for phone: {phone}")
        return user, True
    except Exception as e:
        print(f"Error in remove_user_dietary_need: {e}")
        raise


async def clear_user_dietary_needs(phone: str) -> Optional[User]:
    """
    Clear all dietary needs from user's dietary needs list.

    Args:
        phone: User's phone number

    Returns:
        User: Updated user object if found, None otherwise
    """
    try:
        user = await User.find_one(User.phone == phone)
        if not user:
            print(f"User not found for phone: {phone}")
            return None

        user.dietary_needs = []
        await user.save()
        print(f"Cleared all dietary needs for phone: {phone}")
        return user
    except Exception as e:
        print(f"Error in clear_user_dietary_needs: {e}")
        raise
