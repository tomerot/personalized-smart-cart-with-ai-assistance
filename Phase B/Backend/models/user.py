from pydantic import Field
from typing import List
from beanie import Document


class User(Document):
    phone: str = Field(unique=True)
    allergies: List[str] = Field(default_factory=list)
    dietary_needs: List[str] = Field(default_factory=list)

    class Settings:
        name = "users"
