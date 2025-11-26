from beanie import Document, Indexed
from pydantic import Field
from typing import List, Optional
from datetime import datetime


class ProductPurchaseTracking(Document):
    """
    Tracks individual product purchase patterns per user for smart replenishment recommendations.

    One document per user+product combination.
    Used to calculate purchase intervals and predict when user needs to buy again.
    """

    phone: str = Field(..., description="User's phone number")
    barcode: str = Field(..., description="Product barcode")

    # Purchase history for this specific product
    purchase_dates: List[datetime] = Field(
        default_factory=list,
        description="All timestamps when this product was purchased",
    )

    # Cached calculations (updated after each purchase)
    purchase_count: int = Field(
        default=0, description="Total number of times purchased"
    )
    last_purchase_date: Optional[datetime] = Field(
        default=None, description="Most recent purchase timestamp"
    )
    average_interval_days: Optional[float] = Field(
        default=None,
        description="Average days between purchases. None if less than 2 purchases.",
    )

    class Settings:
        name = "product_purchase_tracking"
        indexes = [
            [
                ("phone", 1),
                ("barcode", 1),
            ],  # Compound index for fast user+product lookup
        ]
