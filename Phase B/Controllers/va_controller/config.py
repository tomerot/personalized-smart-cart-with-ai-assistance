import os
from socket import gethostname

# --- Log File Path ---
LOG_FILE_PATH = "./logs"

# --- Audio Stream Settings ---
AUDIO_FORMAT = "paInt16"  # 16-bit PCM frames
AUDIO_CHANNELS = 1        # Mono audio input
AUDIO_RATE = 16000        # Sampling rate in Hertz
AUDIO_CHUNK_SIZE = 1024   # Number of PCM frames provided by PyAudio per callback

# --- VAPI API Configuration ---
VAPI_API_KEY = os.environ.get("VAPI_API_KEY")
VAPI_CALL_URL = "https://api.vapi.ai/call"

# --- VAPI Call Setup Configuration ---
VAPI_ASSISTANT_ID = os.environ.get("VAPI_ASSISTANT_ID")

# Assistant events to receive
VAPI_CLIENT_MESSAGES = [
    "speech-update",
    "transcript",
    "model-output",
    "tool-calls",
    "tool.completed"
]

# VAPI audio transport settings
VAPI_TRANSPORT_CONFIG = { 
    "provider": "vapi.websocket",
    "audioFormat": {
        "format": "pcm_s16le",
        "container": "raw",
        "sampleRate": AUDIO_RATE 
    }
}

# VAPI call session metadata
VAPI_METADATA = {
    "cart": gethostname() # Identifies the physical cart in VAPI logs
}

# --- Local WebSocket Server Configuration ---
LOCAL_WS_HOST = "localhost"
LOCAL_WS_PORT = 8765