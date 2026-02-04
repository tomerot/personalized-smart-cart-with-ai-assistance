from pydantic import BaseModel, Field
from typing import List, Optional
from beanie import Document


class NutritionalInfo(BaseModel):
    calories_per_100g: Optional[float] = 0
    fat_per_100g: Optional[float] = 0
    sodium_per_100mg: Optional[float] = 0
    carbs_per_100g: Optional[float] = 0
    sugar_per_100g: Optional[float] = 0
    protein_per_100g: Optional[float] = 0


class Product(Document):
    barcode: str = Field(..., unique=True, index=True)
    name: str
    image_url: str = Field(default="https://placehold.co/600x400?text=Placeholder")
    company: str
    category: str = Field(
        ..., index=True, description="Detailed category ('in small', not 'in big')"
    )
    price: float = Field(..., gt=0)
    size: Optional[str] = None
    ingredients: List[str] = Field(default_factory=list)
    allergens: List[str] = Field(default_factory=list)
    dietary_tags: List[str] = Field(default_factory=list)
    nutritional_info: NutritionalInfo
    available: bool = Field(default=True)

    class Settings:
        name = "products"
