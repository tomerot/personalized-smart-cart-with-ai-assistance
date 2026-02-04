#!/bin/bash

# Smart Cart Installation Script
# Run this on a fresh Raspberry Pi to set up everything

REPO_URL="git@github.com:USERNAME/REPOSITORY_NAME.git" # Private Repository URL
INSTALL_PATH="/home/sysadmin/smart-cart"

echo "======================================"
echo "  Smart Cart Installation Script"
echo "======================================"
echo ""

# Step 1: Generate SSH key using ed25519 encryption algorithm
echo "[1/8] Generating SSH key..."
if [ ! -f ~/.ssh/id_ed25519 ]; then
    ssh-keygen -t ed25519 -C "$(hostname)"  -f ~/.ssh/id_ed25519 -N ""
    echo ""
fi

echo "======================================"
echo "  Add this SSH key to GitHub:"
echo "======================================"
echo ""
cat ~/.ssh/id_ed25519.pub
echo ""
echo "Go to: GitHub → Settings → SSH and GPG keys → New SSH key"
echo "Paste the key above and save it."
echo ""
read -p "Press Enter after you've added the key to GitHub..."

# Step 2: Clone repository
echo ""
echo "[2/8] Cloning repository..."
git clone $REPO_URL $INSTALL_PATH
cd $INSTALL_PATH

# Step 3: Create virtual environments
echo ""
echo "[3/8] Creating virtual environment for va_controller..."
cd $INSTALL_PATH/Controllers/va_controller
python3 -m venv venv
venv/bin/pip install -q -r requirements.txt

echo "[4/8] Creating virtual environment for bs_controller..."
cd $INSTALL_PATH/Controllers/bs_controller
python3 -m venv venv
venv/bin/pip install -q -r requirements.txt

# Step 5: Create .env files
echo ""
echo "[5/8] Configuring environment variables..."
echo ""
read -p "Enter your VAPI_API_KEY: " VAPI_API_KEY
read -p "Enter your VAPI_ASSISTANT_ID: " VAPI_ASSISTANT_ID

cat > $INSTALL_PATH/Controllers/va_controller/.env << EOF
VAPI_API_KEY=$VAPI_API_KEY
VAPI_ASSISTANT_ID=$VAPI_ASSISTANT_ID
LOG_FILE_PATH=./logs
EOF

cat > $INSTALL_PATH/Controllers/bs_controller/.env << EOF
LOG_FILE_PATH=./logs
EOF

echo "Environment files created."

# Step 6: Install systemd services
echo ""
echo "[6/8] Installing systemd services..."
sudo cp $INSTALL_PATH/setup/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable va-controller bs-controller kiosk-server cleanup-logs

# Step 7: Setup autostart (Chromium kiosk + hide cursor)
echo ""
echo "[7/8] Setting up autostart..."
mkdir -p ~/.config/autostart
cp $INSTALL_PATH/setup/autostart/*.desktop ~/.config/autostart/

# Step 8: Setup cron jobs
echo ""
echo "[8/8] Setting up cron jobs..."
chmod +x $INSTALL_PATH/setup/scripts/*.sh

# Add cron job (update at 3AM)
(crontab -l 2>/dev/null | grep -v "smart-cart"; echo "0 3 * * * $INSTALL_PATH/setup/scripts/update.sh") | crontab -

echo ""
echo "======================================"
echo "  Installation Complete!"
echo "======================================"
echo ""
echo "The system will now reboot to start all services."
echo ""
read -p "Press Enter to reboot (or Ctrl+C to cancel)..."

sudo reboot

