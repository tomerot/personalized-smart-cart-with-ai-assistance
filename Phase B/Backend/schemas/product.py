from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class NutritionalInfoResponse(BaseModel):
    calories_per_100g: float = 0
    fat_per_100g: float = 0
    sodium_per_100mg: float = 0
    carbs_per_100g: float = 0
    sugar_per_100g: float = 0
    protein_per_100g: float = 0

    class Config:
        from_attributes = True


class ProductResponse(BaseModel):
    barcode: str
    name: str
    image_url: str
    company: str
    category: str
    price: float = Field(..., gt=0)
    size: Optional[str] = None
    ingredients: List[str] = []
    allergens: List[str] = []
    dietary_tags: List[str] = []
    nutritional_info: NutritionalInfoResponse
    available: bool = True

    class Config:
        from_attributes = True


class LocationResponse(BaseModel):
    x: int
    y: int


class ProductLocationResponse(BaseModel):
    barcode: str
    product_name: str
    category: str
    location: LocationResponse


class ProductAvailabilityResponse(BaseModel):
    barcode: str
    available: bool


class ProductIngredientsResponse(BaseModel):
    barcode: str
    ingredients: List[str]


class ConflictCheckResponse(BaseModel):
    has_conflict: bool
    allergen_conflicts: List[str] = []
    dietary_conflicts: List[str] = []
    details: str


class AlternativeProductInfo(BaseModel):
    barcode: str
    name: str
    image_url: str
    company: str
    price: float
    category: str
    size: Optional[str] = None
    dietary_tags: List[str]
    allergens: List[str]


class FindAlternativesResponse(BaseModel):
    has_conflict: bool  # Top-level flag for easy frontend check
    original_product: Dict[str, Any]
    conflict_with_original: ConflictCheckResponse
    alternatives: List[AlternativeProductInfo]
    total_alternatives: int
