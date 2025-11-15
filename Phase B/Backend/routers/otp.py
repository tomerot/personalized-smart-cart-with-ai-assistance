from fastapi import APIRouter, HTTPException, status
from services import otp as otp_service
from services import user as user_service
from schemas import OTPSendRequest, OTPVerifyRequest

router = APIRouter(prefix="/otp", tags=["OTP"])


@router.post("/send-otp")
async def send_otp(request: OTPSendRequest):
    """
    Send OTP code via SMS for phone verification.
    Generates a 6-digit OTP code and sends it to the user's phone via SMS.

    Args:
        request: OTPSendRequest containing phone number

    Returns:
        Success message confirming OTP was sent

    Raises:
        503: SMS delivery failed
        500: SMS sent but database save failed
    """
    # Generate a random 6-digit OTP code
    otp_code = otp_service.generate_otp()

    # Try to send SMS first before saving to database
    sms_sent = otp_service.send_sms_with_otp(request.phone, otp_code)
    if not sms_sent:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to send SMS. Please check the phone number or try again later.",
        )

    # Save to database if SMS was sent successfully
    saved_otp = await otp_service.create_or_update_otp(request.phone, otp_code)
    if not saved_otp:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SMS sent but failed to save OTP. Please try again.",
        )

    return {"message": "OTP sent successfully."}


@router.post("/verify-otp")
async def verify_otp(request: OTPVerifyRequest):
    """
    Verify OTP code and authenticate user.

    Args:
        request: OTPVerifyRequest containing phone number and OTP code

    Returns:
        Success message with is_new_user flag for frontend routing

    Raises:
        400: Invalid or expired OTP
        500: OTP valid but user creation failed
    """
    # Verify the OTP code against database record
    is_valid = await otp_service.verify_otp(request.phone, request.otp_code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP."
        )
    try:
        user = await user_service.get_or_create_user(request.phone)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OTP verified but failed to create user session.",
        )

    # Return success with user creation status for frontend routing
    return {"message": "OTP verified successfully.", "is_new_user": user.id is not None}
