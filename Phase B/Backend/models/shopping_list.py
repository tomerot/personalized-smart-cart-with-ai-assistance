from pydantic import Field
from typing import List, Optional
from beanie import Document
from schemas import Item


class ShoppingList(Document):
    phone: str = Field(unique=True)
    items: List[Item]
    optimized_route: Optional[List[str]] = Field(default_factory=list, description="Optimized category visit order")

    class Settings:
        name = "shopping_lists"
