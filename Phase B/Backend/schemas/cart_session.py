from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from schemas.item import Item


class CartSyncRequest(BaseModel):
    items: List[Item]


class CartSessionResponse(BaseModel):
    phone: str
    items: List[Item]
    last_updated: datetime

    model_config = {"from_attributes": True}
