from pydantic import BaseModel, Field
from typing import List, Optional


class NutritionalInfoData(BaseModel):
    """Embedded nutritional info for products in cart/lists"""
    calories_per_100g: Optional[float] = 0
    fat_per_100g: Optional[float] = 0
    sodium_per_100mg: Optional[float] = 0
    carbs_per_100g: Optional[float] = 0
    sugar_per_100g: Optional[float] = 0
    protein_per_100g: Optional[float] = 0


class ProductItemData(BaseModel):
    """
    Base schema for storing complete product data with quantity.
    Used in cart_session and shopping_list.
    """
    barcode: str
    name: str
    image_url: str
    company: str
    category: str
    price: float
    size: Optional[str] = None
    ingredients: List[str] = Field(default_factory=list)
    allergens: List[str] = Field(default_factory=list)
    dietary_tags: List[str] = Field(default_factory=list)
    nutritional_info: NutritionalInfoData
    available: bool = True
    quantity: int = Field(..., gt=0, description="Quantity of this product")
