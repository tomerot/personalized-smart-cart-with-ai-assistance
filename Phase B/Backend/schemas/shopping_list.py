from pydantic import BaseModel, Field
from typing import List
from schemas.product_item import ShoppingListItemData, ProductItemData


class ShoppingListRequest(BaseModel):
    items: List[ProductItemData] = Field(..., description="List of items with full product data (location added by backend)")


class ShoppingListResponse(BaseModel):
    phone: str
    items: List[ShoppingListItemData]
    optimized_route: List[str] = []
    optimal_path: List[dict] = []

    class Config:
        from_attributes = True
