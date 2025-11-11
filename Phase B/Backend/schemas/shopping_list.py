from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from .item import Item


class ShoppingListRequest(BaseModel):
    items: List[Item] = Field(..., description="List of items in shopping list")


class ShoppingListResponse(BaseModel):
    phone: str
    items: List[Item]
    optimized_route: List[str] = []

    class Config:
        from_attributes = True


class ProductDetailsInList(BaseModel):
    name: str
    image_url: str
    company: str
    category: str
    price: float
    allergens: List[str]
    dietary_tags: List[str]
    nutritional_info: Dict[str, float]
    available: bool


class ShoppingListItemWithProduct(BaseModel):
    product_barcode: str
    quantity: int
    product_details: Optional[ProductDetailsInList] = Field(
        None, description="Full product information, None if product not found"
    )


class ShoppingListWithProductsResponse(BaseModel):
    phone: str
    items: List[ShoppingListItemWithProduct]
    optimized_route: List[str] = []
