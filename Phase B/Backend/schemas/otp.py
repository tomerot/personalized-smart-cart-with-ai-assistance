from pydantic import BaseModel, Field


class OTPCodeRequest(BaseModel):
    otp_code: str = Field(
        ..., min_length=6, max_length=6, description="The 6-digit OTP code"
    )
