from pydantic import Field
import datetime
from typing import List
from beanie import Document
from schemas.product_item import ProductItemData


class CartSession(Document):
    phone: str = Field(unique=True)
    items: List[ProductItemData]
    last_updated: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

    class Settings:
        name = "cart_session"
