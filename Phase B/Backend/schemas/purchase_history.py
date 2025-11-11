from pydantic import BaseModel, Field
from typing import List
from .item import Item


class SavePurchaseRequest(BaseModel):
    items: List[Item] = Field(
        ..., description="List of items purchased with their quantities"
    )


class PurchaseHistoryResponse(BaseModel):
    phone: str
    items: List[Item]

    class Config:
        from_attributes = True


class CheckForgottenItemsRequest(BaseModel):
    items: List[Item] = Field(
        ..., description="List of items currently in the cart"
    )


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
