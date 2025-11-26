from pydantic import BaseModel, Field
from typing import List
from schemas.product_item import ProductItemData


class ShoppingListRequest(BaseModel):
    items: List[ProductItemData] = Field(..., description="List of items with full product data")


class ShoppingListResponse(BaseModel):
    phone: str
    items: List[ProductItemData]
    category_order: List[str] = Field(
        default_factory=list, description="Optimized order of categories to visit"
    )
    route_coordinates: List[dict] = Field(
        default_factory=list,
        description="Grid coordinates (x, y) for the optimal shopping route",
    )

    class Config:
        from_attributes = True
