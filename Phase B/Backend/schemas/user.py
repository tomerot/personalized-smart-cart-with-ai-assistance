from pydantic import BaseModel, Field
from typing import List


class UserResponse(BaseModel):
    phone: str
    allergies: List[str] = []
    dietary_needs: List[str] = []

    class Config:
        from_attributes = True


class UpdateDietaryNeedsRequest(BaseModel):
    dietary_needs: List[str] = Field(
        ...,
        description="List of dietary requirements (e.g., ['vegan', 'kosher', 'halal'])",
    )


class AddAllergyRequest(BaseModel):
    allergy: str = Field(
        ..., description="Single allergy to add (e.g., 'peanuts', 'dairy', 'gluten')"
    )
