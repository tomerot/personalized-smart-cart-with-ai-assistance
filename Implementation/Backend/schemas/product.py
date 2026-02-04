from pydantic import BaseModel, Field
from typing import List, Optional


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
    available: bool


class ProductIngredientsResponse(BaseModel):
    ingredients: List[str]


class NutritionDetailsResponse(BaseModel):
    """Combined ingredients and nutritional info for AI function calling"""

    ingredients: List[str]
    nutritional_info: NutritionalInfoResponse


class ShelfInfoResponse(BaseModel):
    """Combined availability and location for AI function calling"""

    available: bool
    location: Optional["LocationResponse"] = None


class ConflictCheckResponse(BaseModel):
    allergen_conflicts: List[str] = []
    dietary_conflicts: List[str] = []
    details: str


class FindAlternativesResponse(BaseModel):
    has_conflict: bool
    original_product: ProductResponse
    conflict_with_original: ConflictCheckResponse
    alternatives: List[ProductResponse]
    total_alternatives: int


class ProductScanRequest(BaseModel):
    """Request body for scanning a product and checking conflicts"""

    allergies: List[str] = Field(
        default_factory=list, description="List of user's allergies"
    )
    dietary_needs: List[str] = Field(
        default_factory=list, description="List of user's dietary needs"
    )


class AIAlternativesRequest(BaseModel):
    allergies: List[str] = Field(
        default_factory=list, description="List of user's allergies"
    )
    dietary_needs: List[str] = Field(
        default_factory=list, description="List of user's dietary needs"
    )
    requirement: str = Field(
        ...,
        description="User's specific requirement for alternatives (e.g., 'less sugar', 'cheaper', 'organic')",
    )


class AIAlternativesResponse(BaseModel):
    alternatives: List[ProductResponse] = Field(
        default_factory=list,
        description="AI-recommended alternative products (up to 3)",
    )
    explanation: str = Field(
        ...,
        description="AI-generated explanation for all alternatives, or error message if none found",
    )


class ProductInfoRequest(BaseModel):
    """Request body for product/category info lookup (used by VAPI)"""

    query: str = Field(
        ...,
        description="Product name or category the user is asking about",
    )


class ProductInfoMatchedProduct(BaseModel):
    name: str
    available: bool


class ProductInfoResponse(BaseModel):
    """Response for product/category info lookup"""

    category: str
    location: Optional[LocationResponse] = None
    products: List[ProductInfoMatchedProduct] = Field(default_factory=list)
