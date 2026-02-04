#!/bin/bash

# Smart Cart - Testing Installation Script (Linux)
# Sets up and runs the Voice Assistant Controller and Kiosk

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR/../App"

echo "======================================"
echo "  Smart Cart - Testing Setup (Linux)"
echo "======================================"
echo ""

# Step 1: Create virtual environment
echo "[1/3] Creating virtual environment..."
cd "$APP_DIR/VA Controller"
python3 -m venv venv
source venv/bin/activate
pip install -q -r requirements.txt
deactivate
echo "Virtual environment created."

# Step 2: Configure environment variables
echo ""
echo "[2/3] Configuring environment variables..."
echo ""
read -p "Enter your VAPI_API_KEY: " VAPI_API_KEY
read -p "Enter your VAPI_ASSISTANT_ID: " VAPI_ASSISTANT_ID

cat > "$APP_DIR/VA Controller/.env" << EOF
VAPI_API_KEY=$VAPI_API_KEY
VAPI_ASSISTANT_ID=$VAPI_ASSISTANT_ID
LOG_FILE_PATH=./logs
EOF

echo "Environment file created."

# Step 3: Run the application
echo ""
echo "[3/3] Starting the application..."
echo ""

# Start Kiosk server in the background
cd "$APP_DIR/Kiosk"
python3 -m http.server 8000 &
KIOSK_PID=$!
echo "Kiosk server started (PID: $KIOSK_PID)"

# Wait a moment for the server to start
sleep 2

# Open browser
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8000
elif command -v open &> /dev/null; then
    open http://localhost:8000
fi

# Start Voice Assistant Controller (foreground)
echo "Starting Voice Assistant Controller..."
echo ""
echo "======================================"
echo "  Application Running!"
echo "  Browser: http://localhost:8000"
echo "  Press Ctrl+C to stop"
echo "======================================"
echo ""

cd "$APP_DIR/VA Controller"
source venv/bin/activate
python va_controller.py

# Cleanup when stopped
kill $KIOSK_PID 2>/dev/null
echo ""
echo "Application stopped."
