from pydantic import Field
from typing import List, Optional
from datetime import datetime
from beanie import Document


class User(Document):
    phone: str = Field(unique=True)
    allergies: List[str] = Field(default_factory=list)
    dietary_needs: List[str] = Field(default_factory=list)
    last_checkout_date: Optional[datetime] = Field(
        default=None,
        description="Last time user checked out (any purchase). Used to detect abandonment vs absence.",
    )

    class Settings:
        name = "users"
