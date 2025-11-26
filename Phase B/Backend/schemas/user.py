from pydantic import BaseModel, Field
from typing import List


class UserResponse(BaseModel):
    phone: str
    allergies: List[str] = []
    dietary_needs: List[str] = []

    class Config:
        from_attributes = True


class UserStatusResponse(BaseModel):
    """Response schema for user status check after login"""

    has_active_cart: bool
    has_shopping_list: bool


class AllergiesRequest(BaseModel):
    allergies: List[str] = Field(
        ...,
        description="List of allergies to add/remove (e.g., ['peanuts', 'dairy', 'gluten'])",
    )


class DietaryNeedsRequest(BaseModel):
    dietary_needs: List[str] = Field(
        ...,
        description="List of dietary needs to add/remove (e.g., ['vegan', 'kosher'])",
    )
