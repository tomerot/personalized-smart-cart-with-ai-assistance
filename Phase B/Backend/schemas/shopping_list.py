from pydantic import BaseModel, Field
from typing import List
from schemas.product_item import ProductItemData


class ShoppingListRequest(BaseModel):
    items: List[ProductItemData] = Field(..., description="List of items with full product data")


class ShoppingListResponse(BaseModel):
    phone: str
    items: List[ProductItemData]
    category_order: List[str] = []
    route_coordinates: List[dict] = []

    class Config:
        from_attributes = True
