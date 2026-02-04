from typing import List
from pydantic import BaseModel
from datetime import datetime
from schemas.product_item import ProductItemData


class CartSyncRequest(BaseModel):
    items: List[ProductItemData]


class CartSessionResponse(BaseModel):
    phone: str
    items: List[ProductItemData]
    last_updated: datetime

    model_config = {"from_attributes": True}
