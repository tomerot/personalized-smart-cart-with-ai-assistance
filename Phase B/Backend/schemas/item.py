from pydantic import BaseModel
from typing import Optional


class Item(BaseModel):
    product_barcode: str
    quantity: int = 1
    name: Optional[str] = None  # Product name for display
    price: Optional[float] = None
    size: Optional[str] = None
