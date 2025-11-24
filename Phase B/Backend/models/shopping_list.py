from pydantic import Field
from typing import List, Optional
from beanie import Document
from schemas.product_item import ProductItemData


class ShoppingList(Document):
    phone: str = Field(unique=True)
    items: List[ProductItemData]
    optimized_route: Optional[List[str]] = Field(
        default_factory=list, description="Optimized category visit order"
    )
    optimal_path: Optional[List[dict]] = Field(
        default_factory=list,
        description="Optimal path with coordinates for future implementation",
    )

    class Settings:
        name = "shopping_lists"
