from pydantic import BaseModel, Field
from typing import List, Optional
from schemas.product_item import PurchaseData


class CheckForgottenItemsRequest(BaseModel):
    cart_barcodes: List[str] = Field(..., description="List of product barcodes currently in the cart")


class ForgottenItemResponse(BaseModel):
    barcode: str
    name: str
    company: str
    category: str
    price: float
    size: Optional[str] = None
    image_url: str
    frequency: int = Field(..., description="Total quantity purchased across last 3 purchases")


class ForgottenItemsResponse(BaseModel):
    phone: str
    forgotten_items: List[ForgottenItemResponse]
    total_found: int


class PurchaseHistoryResponse(BaseModel):
    phone: str
    purchases: List[PurchaseData]

    class Config:
        from_attributes = True
