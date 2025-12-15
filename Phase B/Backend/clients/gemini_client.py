import google.generativeai as genai
from typing import Optional


class GeminiClient:
    """Client for Google Gemini API"""

    def __init__(self, api_key: str):
        """Initialize Gemini client with API key"""
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash")
        print("✓ Gemini client initialized")

    def generate_content(self, prompt: str) -> str:
        """Generate content using Gemini"""
        response = self.model.generate_content(prompt)
        return response.text.strip()


# Global client instance
_client: Optional[GeminiClient] = None


def init_gemini_client(api_key: str) -> GeminiClient:
    """Initialize global Gemini client"""
    global _client
    _client = GeminiClient(api_key)
    return _client


def get_gemini_client() -> GeminiClient:
    """Get initialized Gemini client"""
    if _client is None:
        raise RuntimeError(
            "Gemini client not initialized. Call init_gemini_client() first."
        )
    return _client
