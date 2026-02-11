# Installation and Running Guide

The `\Installation` folder contains a **simplified setup** for anyone who wants to quickly try out and get an impression of the application.

## ⚠️ Important Notes

The `\Installation` is **for testing purposes only** and **does not include**:

- **Barcode Scanner Controller** - Requires Linux and specific hardware (USB barcode scanner). Not included since most testers won't have the hardware.
- **Auto-start on boot** - No systemd services or autostart configurations.
- **Auto-update** - No scheduled updates from GitHub.
- **Kiosk mode** - Chromium kiosk mode setup is not included.
- **Production configurations** - Log cleanup, restart-on-failure, etc.

For the complete source code including all features:

- Barcode Scanner Controller
- Backend API (FastAPI) including database models and services
- Frontend source code (React) includeing both **Kiosk** and **List Creation** apps
- Production setup files (production installation, systemd files, autostart files, scripts)

Check the `\Implementation` folder in the repository.

---

### Usage Notes

- **New users** - New users are created automatically when you enter a phone number.
- **OTP Code** - We use Twilio's free tier, so SMS messages won't be sent. Use `000000` as the OTP code.
- **Use mouse only** - The keyboard is not enabled in this application.
- **Audio settings (Windows)** - The volume control feature is not available on Windows since it's designed for the production environment (Linux).
- **Create a shopping list** - You can also create a shopping list using the [List Creation App](https://list-creation-eight.vercel.app/) before testing the kiosk.

---

## Example Products for Testing the Voice Assistant

To explore the voice assistant capabilities - including allergen alerts, alternative suggestions, and product information inquiries,
you many manually enter the following example products (by barcode) into the cart:

| Product | Barcode Number | Allergens |
|---------|----------------|-----------|
| Sesame Kabukis | 7290117906477 | Sesame |
| Za'atar | 7290000134826 | Sesame |
| Mana-Hama | 7290000073767 | Soy |
| Milk Chocolate Bar | 7290000170053 | Dairy, Soy |
| Bamba | 7290000066318 | Peanuts |

To test the alert mechanism, first ask the assistant to monitor products containing the allergens you wish to avoid, and only then add the product to the cart.

The currently selected allergens can be viewed in the Profile section.

## Prerequisites

- **Python 3.10+** installed
- **VAPI API Keys** - Provided by us for testing.

---

## Quick Start

### Step 1: Clone the Repository

```bash
git clone https://github.com/tomerot/personalized-smart-cart-with-ai-assistance.git
cd personalized-smart-cart-with-ai-assistance/Installation
```

### Step 2: Run the Installation Script

**Linux:**
```bash
cd Linux
chmod +x install.sh
./install.sh
```

**Windows (PowerShell):**
```powershell
cd Windows
.\install.ps1
```

**You can open PowerShell directly inside the Windows folder:**
1. Open the `Installation\Windows` folder in File Explorer.
2. Click on the address bar at the top.
3. Type powershell and press Enter.
4. A PowerShell window will open in that folder.

Then run:
```poweshell
.\install.ps1
```

The script will:
1. Create a Python virtual environment
2. Install required dependencies
3. Ask for the VAPI API keys and create the configuration file
4. **Automatically start the application and open your browser!**

### Before Using the App

**Important:** The backend is deployed on Render's free tier, which puts the server to sleep after inactivity.
**Wake up the server** by opening this [Link](https://smart-cart-backend-nh7z.onrender.com/docs) and waiting until the page loads (may take 30-60 seconds).

Press `Ctrl+C` to stop the application when you're done.
