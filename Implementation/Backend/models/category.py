from beanie import Document
from pydantic import BaseModel, Field


class Location(BaseModel):
    x: int = Field(..., description="X coordinate on supermarket grid")
    y: int = Field(..., description="Y coordinate on supermarket grid")


class Category(Document):
    name: str = Field(..., unique=True, index=True)
    location: Location

    class Settings:
        name = "categories"
