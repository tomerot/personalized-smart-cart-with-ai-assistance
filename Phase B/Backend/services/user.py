from models import User, CartSession, ShoppingList
from typing import List, Optional
from schemas import UserStatusResponse


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


async def add_user_allergies(phone: str, allergies: List[str]) -> Optional[User]:
    """
    Add multiple allergies to user's allergies list.

    Args:
        phone: User's phone number
        allergies: List of allergies to add (will be converted to lowercase)

    Returns:
        User object if found, None otherwise
    """
    try:
        user = await User.find_one(User.phone == phone)
        if not user:
            print(f"User not found for phone: {phone}")
            return None

        # Convert all allergies to lowercase and add only new ones
        allergies_lower = [a.lower() for a in allergies]
        existing_set = set(user.allergies)

        for allergy in allergies_lower:
            if allergy not in existing_set:
                user.allergies.append(allergy)

        await user.save()
        print(f"Added allergies {allergies_lower} for phone: {phone}")
        return user
    except Exception as e:
        print(f"Error in add_user_allergies: {e}")
        raise


async def remove_user_allergies(phone: str, allergies: List[str]) -> Optional[User]:
    """
    Remove multiple allergies from user's allergies list.

    Args:
        phone: User's phone number
        allergies: List of allergies to remove (will be converted to lowercase)

    Returns:
        User object if found, None otherwise
    """
    try:
        user = await User.find_one(User.phone == phone)
        if not user:
            print(f"User not found for phone: {phone}")
            return None

        # If empty list, do nothing
        if not allergies:
            print(f"Empty list provided, no allergies removed for phone: {phone}")
            return user

        # Convert to lowercase and remove
        allergies_lower = [a.lower() for a in allergies]
        user.allergies = [a for a in user.allergies if a not in allergies_lower]

        await user.save()
        print(f"Removed allergies {allergies_lower} for phone: {phone}")
        return user
    except Exception as e:
        print(f"Error in remove_user_allergies: {e}")
        raise


async def add_user_dietary_needs(phone: str, dietary_needs: List[str]) -> Optional[User]:
    """
    Add multiple dietary needs to user's dietary needs list.

    Args:
        phone: User's phone number
        dietary_needs: List of dietary needs to add (will be converted to lowercase)

    Returns:
        User object if found, None otherwise
    """
    try:
        user = await User.find_one(User.phone == phone)
        if not user:
            print(f"User not found for phone: {phone}")
            return None

        # Convert all dietary needs to lowercase and add only new ones
        dietary_needs_lower = [d.lower() for d in dietary_needs]
        existing_set = set(user.dietary_needs)

        for need in dietary_needs_lower:
            if need not in existing_set:
                user.dietary_needs.append(need)

        await user.save()
        print(f"Added dietary needs {dietary_needs_lower} for phone: {phone}")
        return user
    except Exception as e:
        print(f"Error in add_user_dietary_needs: {e}")
        raise


async def remove_user_dietary_needs(phone: str, dietary_needs: List[str]) -> Optional[User]:
    """
    Remove multiple dietary needs from user's dietary needs list.

    Args:
        phone: User's phone number
        dietary_needs: List of dietary needs to remove (will be converted to lowercase)

    Returns:
        User object if found, None otherwise
    """
    try:
        user = await User.find_one(User.phone == phone)
        if not user:
            print(f"User not found for phone: {phone}")
            return None

        # If empty list, do nothing
        if not dietary_needs:
            print(f"Empty list provided, no dietary needs removed for phone: {phone}")
            return user

        # Convert to lowercase and remove
        dietary_needs_lower = [d.lower() for d in dietary_needs]
        user.dietary_needs = [d for d in user.dietary_needs if d not in dietary_needs_lower]

        await user.save()
        print(f"Removed dietary needs {dietary_needs_lower} for phone: {phone}")
        return user
    except Exception as e:
        print(f"Error in remove_user_dietary_needs: {e}")
        raise


async def get_user_status(phone: str) -> UserStatusResponse:
    """
    Get user status including cart session and shopping list availability.

    Used after login to determine what UI elements to show/enable.

    Args:
        phone: User's phone number

    Returns:
        UserStatusResponse: Status flags for active cart and shopping list
    """
    try:
        # Check for active cart session
        cart_session = await CartSession.find_one(CartSession.phone == phone)
        has_active_cart = cart_session is not None

        # Check for shopping list
        shopping_list = await ShoppingList.find_one(ShoppingList.phone == phone)
        has_shopping_list = shopping_list is not None

        print(
            f"User status for {phone}: cart={has_active_cart}, list={has_shopping_list}"
        )

        return UserStatusResponse(
            has_active_cart=has_active_cart, has_shopping_list=has_shopping_list
        )
    except Exception as e:
        print(f"Error in get_user_status: {e}")
        raise
