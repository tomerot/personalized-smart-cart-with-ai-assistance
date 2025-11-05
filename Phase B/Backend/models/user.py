from pydantic import Field, BaseModel
from typing import List
from beanie import Document


class UserPreferences(BaseModel):
    allergies: List[str] = Field(default_factory=list)
    dietary_needs: List[str] = Field(default_factory=list)


class User(Document):
    phone: str = Field(unique=True)
    preferences: UserPreferences = Field(default_factory=UserPreferences)

    class Settings:
        name = "users"
