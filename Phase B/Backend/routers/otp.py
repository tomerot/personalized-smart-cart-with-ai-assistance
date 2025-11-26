from fastapi import APIRouter, HTTPException, status
from services import otp as otp_service
from services import user as user_service
from schemas import OTPCodeRequest, UserResponse

router = APIRouter(prefix="/otp", tags=["OTP"])


@router.post("/{phone}/send")
async def send_otp(phone: str):
    """
    Send OTP code via SMS for phone verification.
    Generates a 6-digit OTP code and sends it to the user's phone via SMS.

    Args:
        phone: Phone number (path parameter)

    Returns:
        Success message confirming OTP was sent

    Raises:
        503: SMS delivery failed
        500: SMS sent but database save failed
    """
    # Generate a random 6-digit OTP code
    otp_code = otp_service.generate_otp()

    # Try to send SMS first before saving to database
    sms_sent = otp_service.send_sms_with_otp(phone, otp_code)
    if not sms_sent:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to send SMS. Please check the phone number or try again later.",
        )

    # Save to database if SMS was sent successfully
    saved_otp = await otp_service.create_or_update_otp(phone, otp_code)
    if not saved_otp:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SMS sent but failed to save OTP. Please try again.",
        )

    return {"message": "OTP sent successfully."}


@router.post("/{phone}/verify")
async def verify_otp(phone: str, request: OTPCodeRequest):
    """
    Verify OTP code and authenticate user.

    Args:
        phone: Phone number (path parameter)
        request: OTPCodeRequest containing OTP code

    Returns:
        Success message with is_new_user flag and user data

    Raises:
        400: Invalid or expired OTP
        500: OTP valid but user creation failed
    """
    # Verify the OTP code against database record
    is_valid = await otp_service.verify_otp(phone, request.otp_code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP."
        )
    try:
        user = await user_service.get_or_create_user(phone)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OTP verified but failed to create user session.",
        )

    # Convert user to response model
    user_data = UserResponse(
        phone=user.phone, allergies=user.allergies, dietary_needs=user.dietary_needs
    )

    # Return success with user creation status and user data
    return {"message": "OTP verified successfully.", "user": user_data}
