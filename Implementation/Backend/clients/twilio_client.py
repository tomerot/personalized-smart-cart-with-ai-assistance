from twilio.rest import Client
from typing import Optional


class TwilioClient:
    """Client for Twilio SMS API"""

    def __init__(self, account_sid: str, auth_token: str, phone_number: str):
        """Initialize Twilio client"""
        self.client = Client(account_sid, auth_token)
        self.phone_number = phone_number
        print("✓ Twilio client initialized")

    def send_sms(self, to: str, message: str):
        """Send SMS message"""
        return self.client.messages.create(
            body=message, from_=self.phone_number, to=to
        )


# Global client instance
_client: Optional[TwilioClient] = None


def init_twilio_client(
    account_sid: str, auth_token: str, phone_number: str
) -> TwilioClient:
    """Initialize global Twilio client"""
    global _client
    _client = TwilioClient(account_sid, auth_token, phone_number)
    return _client


def get_twilio_client() -> TwilioClient:
    """Get initialized Twilio client"""
    if _client is None:
        raise RuntimeError(
            "Twilio client not initialized. Call init_twilio_client() first."
        )
    return _client
