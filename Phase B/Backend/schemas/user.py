from pydantic import BaseModel, Field
from typing import List


class UserResponse(BaseModel):
    phone: str
    allergies: List[str] = []
    dietary_needs: List[str] = []

    class Config:
        from_attributes = True


class UpdateAllergiesRequest(BaseModel):
    allergies: List[str] = Field(
        ..., description="List of user allergies (e.g., ['peanuts', 'dairy', 'gluten'])"
    )


class UpdateDietaryNeedsRequest(BaseModel):
    dietary_needs: List[str] = Field(
        ...,
        description="List of dietary requirements (e.g., ['vegan', 'kosher', 'halal'])",
    )
