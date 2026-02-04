#!/bin/bash

# Smart Cart Update Script
# Pulls latest changes from GitHub and reboots

cd /home/sysadmin/smart-cart

git pull

# Update Python dependencies
Controllers/va_controller/venv/bin/pip install -q -r Controllers/va_controller/requirements.txt
Controllers/bs_controller/venv/bin/pip install -q -r Controllers/bs_controller/requirements.txt

# Update systemd and autostart files
sudo cp setup/systemd/*.service /etc/systemd/system/
cp setup/autostart/*.desktop ~/.config/autostart/

sudo reboot