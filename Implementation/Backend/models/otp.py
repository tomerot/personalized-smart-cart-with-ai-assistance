from pydantic import Field
import datetime
from beanie import Document


class OTP(Document):
    phone: str
    otp_code: str = Field(..., min_length=6, max_length=6)
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    expires_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.utcnow()
        + datetime.timedelta(minutes=3)
    )

    class Settings:
        name = "otp_verification"
