#!/bin/bash

# Kiosk Browser Script
# Runs Chromium in kiosk mode with auto-restart on failure

while true; do
    chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble http://localhost:8000
    sleep 2
done

