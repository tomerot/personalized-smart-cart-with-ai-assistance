from pydantic import Field
import datetime
from typing import List
from beanie import Document
from schemas import Item


class CartSession(Document):
    phone: str = Field(unique=True)
    items: List[Item]
    last_updated: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

    class Settings:
        name = "cart_session"
