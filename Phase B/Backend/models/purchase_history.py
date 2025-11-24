from pydantic import Field
from typing import List
from beanie import Document
from schemas.product_item import PurchaseData


class Purchase_history(Document):
    phone: str = Field(unique=True)
    purchases: List[PurchaseData] = Field(default_factory=list, description="Last 3 purchases (max)")

    class Settings:
        name = "purchase_history"
