from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from schemas.item import Item


class CartSyncRequest(BaseModel):
    """Request schema for syncing cart session"""
    items: List[Item]


class CartSessionResponse(BaseModel):
    """Response schema for cart session"""
    phone: str
    items: List[Item]
    last_updated: datetime

    model_config = {"from_attributes": True}


class CartRecoveryResponse(BaseModel):
    """Response schema for cart recovery check"""
    has_active_session: bool
    cart_session: Optional[CartSessionResponse] = None
    message: str
