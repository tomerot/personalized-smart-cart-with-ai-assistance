from pydantic import Field
from typing import List
from beanie import Document
from schemas import Item


class ShoppingList(Document):
    phone: str = Field(unique=True)
    items: List[Item]

    class Settings:
        name = "shopping_lists"
