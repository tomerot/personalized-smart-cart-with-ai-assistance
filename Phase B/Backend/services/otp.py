import datetime
import random
from twilio.rest import Client
import os
from models import OTP


client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))


def generate_otp() -> str:
    return f"{random.randint(100000, 999999)}"


def send_sms_with_otp(to_phone: str, otp_code: str) -> bool:
    if not client:
        print(f"Twilio client not initialized. Cannot send SMS to {to_phone}")
        return False

    try:
        message = client.messages.create(
            body=f"Your OTP code is: {otp_code}. Valid for 3 minutes.",
            from_=os.getenv("TWILIO_PHONE_NUMBER"),
            to=to_phone,
        )
        print(f"SMS sent successfully to {to_phone}")
        return True
    except Exception as e:
        print(f"Failed to send SMS to {to_phone}: {e}")
        return False


async def create_or_update_otp(phone: str, otp_code: str) -> str | None:
    now = datetime.datetime.utcnow()
    expires = now + datetime.timedelta(minutes=3)

    try:
        existing_otp = await OTP.find_one(OTP.phone == phone)

        if existing_otp:
            existing_otp.otp_code = otp_code
            existing_otp.created_at = now
            existing_otp.expires_at = expires
            await existing_otp.save()
        else:
            otp = OTP(
                phone=phone, otp_code=otp_code, created_at=now, expires_at=expires
            )
            await otp.insert()
        return otp_code

    except Exception as e:
        print(f"Error in create_or_update_otp: {e}")
        return None


async def verify_otp(phone: str, otp_code: str) -> bool:
    try:
        otp_record = await OTP.find_one(OTP.phone == phone, OTP.otp_code == otp_code)

        if not otp_record:
            print(f"OTP verification failed for phone: {phone} otp: {otp_code}")
            return False

        await otp_record.delete()
        print(f"OTP verification successful for phone {phone}")
        return True

    except Exception as e:
        print(f"Error in verify_otp: {e}")
        return False
