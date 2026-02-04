import os
from dotenv import load_dotenv

load_dotenv()

# --- Log File Path ---
LOG_FILE_PATH = os.environ.get("LOG_FILE_PATH", "./logs")

# --- Local WebSocket Server Configuration ---
LOCAL_WS_HOST = "localhost"
LOCAL_WS_PORT = 8766

# --- Barcode Scanner Device ID Configuration ---
SCANNER_VID = 0x2f50 # Vendor ID
SCANNER_PID = 0x0301 # Product ID