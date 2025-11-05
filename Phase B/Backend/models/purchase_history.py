from pydantic import Field
from typing import List
from beanie import Document
from schemas import Item


class Purchase_history(Document):
    phone: str = Field(unique=True)
    items: List[Item]

    class Settings:
        name = "purchase_history"
