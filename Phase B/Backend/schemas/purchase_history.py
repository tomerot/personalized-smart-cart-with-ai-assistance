from pydantic import BaseModel, Field
from typing import List


class PurchaseItem(BaseModel):
    """Item schema for purchase history - tracks only barcode and cumulative quantity"""
    product_barcode: str
    quantity: int = 1


class SavePurchaseRequest(BaseModel):
    items: List[PurchaseItem] = Field(
        ..., description="List of items purchased with their quantities"
    )


class PurchaseHistoryResponse(BaseModel):
    phone: str
    items: List[PurchaseItem]

    class Config:
        from_attributes = True


class CheckForgottenItemsRequest(BaseModel):
    items: List[PurchaseItem] = Field(..., description="List of items currently in the cart (only barcode needed for comparison)")


class ForgottenItemResponse(BaseModel):
    barcode: str
    name: str
    company: str
    category: str
    price: float
    total_purchased: int = Field(
        ..., description="Total quantity purchased across all past orders"
    )


class ForgottenItemsResponse(BaseModel):
    phone: str
    forgotten_items: List[ForgottenItemResponse]
    total_found: int
