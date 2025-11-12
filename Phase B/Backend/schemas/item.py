from pydantic import BaseModel
from typing import Optional


class Item(BaseModel):
    product_barcode: str
    quantity: int = 1
    name: str
    price: float
    size: Optional[str] = None
