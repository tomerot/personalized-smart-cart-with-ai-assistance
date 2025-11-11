from pydantic import BaseModel, Field

PHONE_REGEX = r"^\+972\d{9}$"


class OTPSendRequest(BaseModel):
    phone: str = Field(..., pattern=PHONE_REGEX)


class OTPVerifyRequest(BaseModel):
    phone: str = Field(..., pattern=PHONE_REGEX)
    otp_code: str = Field(
        ..., min_length=6, max_length=6, description="The 6-digit OTP code"
    )
