from fastapi import APIRouter, HTTPException, status
from services import otp as otp_service
from services import user as user_service
from schemas import OTPSendRequest, OTPVerifyRequest

router = APIRouter(prefix="/otp", tags=["OTP"])


@router.post("/send-otp")
async def send_otp(request: OTPSendRequest):
    otp_code = otp_service.generate_otp()

    # Try to send SMS first
    sms_sent = otp_service.send_sms_with_otp(request.phone, otp_code)
    if not sms_sent:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to send SMS. Please check the phone number or try again later.",
        )

    # Only save to database if SMS was sent successfully
    saved_otp = await otp_service.create_or_update_otp(request.phone, otp_code)
    if not saved_otp:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SMS sent but failed to save OTP. Please try again.",
        )

    return {"message": "OTP sent successfully."}


@router.post("/verify-otp")
async def verify_otp(request: OTPVerifyRequest):
    # Verify the OTP
    is_valid = await otp_service.verify_otp(request.phone, request.otp_code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP."
        )

    # Get or create user after successful verification
    try:
        user = await user_service.get_or_create_user(request.phone)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OTP verified but failed to create user session.",
        )

    return {"message": "OTP verified successfully.", "is_new_user": user.id is not None}
