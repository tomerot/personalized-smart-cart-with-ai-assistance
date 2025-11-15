import datetime
import random
from twilio.rest import Client
import os
from models import OTP

# Initialize Twilio client (from environment variables)
client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))


def generate_otp() -> str:
    """Generate a random 6-digit OTP code."""
    return f"{random.randint(100000, 999999)}"


def send_sms_with_otp(to_phone: str, otp_code: str) -> bool:
    """
    Send OTP code via SMS using Twilio.

    Returns True if SMS sent successfully, False otherwise.
    """
    # Check if Twilio client is properly initialized
    if not client:
        print(f"Twilio client not initialized. Cannot send SMS to {to_phone}")
        return False

    try:
        # Send SMS with OTP code using Twilio API
        message = client.messages.create(
            body=f"Your OTP code is: {otp_code}. Valid for 3 minutes.",
            from_=os.getenv("TWILIO_PHONE_NUMBER"),
            to=to_phone,
        )
        print(f"SMS sent successfully to {to_phone}")
        return True
    except Exception as e:
        # Log error and return False to indicate failure
        print(f"Failed to send SMS to {to_phone}: {e}")
        return False


async def create_or_update_otp(phone: str, otp_code: str) -> str | None:
    """
    Save OTP to database with 3-minute expiration.

    Updates existing OTP record if one exists for this phone,
    otherwise creates a new record.
    """
    # Set OTP expiration time (3 minutes from now)
    now = datetime.datetime.utcnow()
    expires = now + datetime.timedelta(minutes=3)

    try:
        # Check if user already has an OTP record
        existing_otp = await OTP.find_one(OTP.phone == phone)

        if existing_otp:
            # Update existing OTP record with new code and timestamps
            existing_otp.otp_code = otp_code
            existing_otp.created_at = now
            existing_otp.expires_at = expires
            await existing_otp.save()
        else:
            # Create new OTP record for this phone number
            otp = OTP(
                phone=phone, otp_code=otp_code, created_at=now, expires_at=expires
            )
            await otp.insert()
        return otp_code

    except Exception as e:
        print(f"Error in create_or_update_otp: {e}")
        return None


async def verify_otp(phone: str, otp_code: str) -> bool:
    """
    Verify OTP code and delete record if valid.

    Returns True if OTP is valid and not expired, False otherwise.
    OTP record is deleted after successful verification (its a one-time use).
    """
    try:
        # Find OTP record matching both phone and code
        otp_record = await OTP.find_one(OTP.phone == phone, OTP.otp_code == otp_code)

        if not otp_record:
            # OTP doesn't exist or code doesn't match
            print(f"OTP verification failed for phone: {phone} otp: {otp_code}")
            return False

        # Delete OTP record after successful verification (one-time use)
        await otp_record.delete()
        print(f"OTP verification successful for phone {phone}")
        return True

    except Exception as e:
        print(f"Error in verify_otp: {e}")
        return False
