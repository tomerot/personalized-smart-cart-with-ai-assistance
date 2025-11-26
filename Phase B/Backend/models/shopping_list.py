from pydantic import Field
from typing import List, Optional
from beanie import Document
from schemas.product_item import ProductItemData


class ShoppingList(Document):
    phone: str = Field(unique=True)
    items: List[ProductItemData]
    category_order: Optional[List[str]] = Field(
        default_factory=list, description="Optimized order of categories to visit"
    )
    route_coordinates: Optional[List[dict]] = Field(
        default_factory=list,
        description="Grid coordinates (x, y) for the optimal shopping route",
    )

    class Settings:
        name = "shopping_lists"
