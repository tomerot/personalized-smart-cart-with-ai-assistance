from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ReplenishmentSuggestionsRequest(BaseModel):
    """Request body for getting replenishment suggestions"""

    cart_barcodes: List[str] = Field(
        default_factory=list,
        description="List of product barcodes currently in the cart (these will be excluded from suggestions)",
    )


class SuggestionItem(BaseModel):
    """A single product suggestion with replenishment details"""

    barcode: str
    name: str
    company: str
    category: str
    price: float
    size: Optional[str] = None
    image_url: str
    days_since_last_purchase: int = Field(
        ..., description="Number of days since user last bought this product"
    )
    average_purchase_interval: int = Field(
        ..., description="Average number of days between purchases of this product"
    )
    due_ratio: float = Field(
        ...,
        description="How overdue the product is (1.0 = exactly on schedule, >1.0 = overdue)",
    )
    status: str = Field(
        ..., description="'due_soon' if slightly early, 'overdue' if past expected time"
    )


class ReplenishmentSuggestionsResponse(BaseModel):
    """Response containing all products due for repurchase"""

    phone: str
    suggestions: List[SuggestionItem]
    total_found: int
    message: str = Field(
        ..., description="Human-readable message about the suggestions"
    )


class CheckoutResponse(BaseModel):
    """Response after successful checkout"""

    message: str
    items_tracked: int = Field(..., description="Number of unique products tracked")
    checkout_time: datetime
