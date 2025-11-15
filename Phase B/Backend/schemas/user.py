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


class AddAllergyRequest(BaseModel):
    allergy: str = Field(
        ..., description="Single allergy to add (e.g., 'peanuts', 'dairy', 'gluten')"
    )


class AddDietaryNeedRequest(BaseModel):
    dietary_need: str = Field(
        ..., description="Single dietary need to add (e.g., 'vegan')"
    )
