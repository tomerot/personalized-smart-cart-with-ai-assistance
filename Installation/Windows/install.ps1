# Smart Cart - Testing Installation Script (Windows)
# Sets up and runs the Voice Assistant Controller and Kiosk

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppDir = Join-Path $ScriptDir "..\App"

Write-Host "======================================"
Write-Host "  Smart Cart - Testing Setup (Windows)"
Write-Host "======================================"
Write-Host ""

# Step 1: Create virtual environment
Write-Host "[1/3] Creating virtual environment..."
Set-Location "$AppDir\VA Controller"
python -m venv venv
& ".\venv\Scripts\pip.exe" install -q -r requirements.txt
Write-Host "Virtual environment created."

# Step 2: Configure environment variables
Write-Host ""
Write-Host "[2/3] Configuring environment variables..."
Write-Host ""
$VAPI_API_KEY = Read-Host "Enter your VAPI_API_KEY"
$VAPI_ASSISTANT_ID = Read-Host "Enter your VAPI_ASSISTANT_ID"

$envContent = @"
VAPI_API_KEY=$VAPI_API_KEY
VAPI_ASSISTANT_ID=$VAPI_ASSISTANT_ID
LOG_FILE_PATH=./logs
"@

$envContent | Out-File -FilePath "$AppDir\VA Controller\.env" -Encoding UTF8 -NoNewline
Write-Host "Environment file created."

# Step 3: Run the application
Write-Host ""
Write-Host "[3/3] Starting the application..."
Write-Host ""

# Start Kiosk server in a new window
$kioskProcess = Start-Process -FilePath "python" -ArgumentList "-m http.server 8000" -WorkingDirectory "$AppDir\Kiosk" -PassThru -WindowStyle Minimized
Write-Host "Kiosk server started (PID: $($kioskProcess.Id))"

# Wait a moment for the server to start
Start-Sleep -Seconds 2

# Open browser
Start-Process "http://localhost:8000"

# Start Voice Assistant Controller
Write-Host "Starting Voice Assistant Controller..."
Write-Host ""
Write-Host "======================================"
Write-Host "  Application Running!"
Write-Host "  Browser: http://localhost:8000"
Write-Host "  Press Ctrl+C to stop"
Write-Host "======================================"
Write-Host ""

Set-Location "$AppDir\VA Controller"
& ".\venv\Scripts\python.exe" va_controller.py

# Cleanup when stopped
Stop-Process -Id $kioskProcess.Id -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "Application stopped."
