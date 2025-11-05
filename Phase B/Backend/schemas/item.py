from pydantic import BaseModel


class Item(BaseModel):
    product_barcode: str
    quantity: int = 1
