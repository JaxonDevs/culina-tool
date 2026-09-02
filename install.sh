#!/bin/bash
echo "=============================================="
echo "      Culina Tool - Installation Setup"
echo "=============================================="
echo ""

echo "[0/4] Checking Dependencies..."
if ! command -v node &> /dev/null
then
    echo "[ERROR] Node.js is not installed! Please install Node.js (e.g. sudo apt install nodejs)."
    exit
fi
if ! command -v npm &> /dev/null
then
    echo "[ERROR] npm is not installed! Please install npm."
    exit
fi
if ! command -v git &> /dev/null
then
    echo "[ERROR] Git is not installed! Please install Git (e.g. sudo apt install git)."
    exit
fi
echo "[OK] All dependencies found!"
echo ""

read -p "Enter your License Key (leave blank for Free Edition): " LICENSE_KEY
if [ -z "$LICENSE_KEY" ]; then
    LICENSE_KEY="free"
fi

read -p "Enter your Google Gemini API Key for AI features (Optional): " GEMINI_API_KEY

echo ""
echo "[1/4] Configuring Environment..."
echo "LICENSE_KEY=$LICENSE_KEY" > .env
if [ ! -z "$GEMINI_API_KEY" ]; then
    echo "GEMINI_API_KEY=$GEMINI_API_KEY" >> .env
fi

echo ""
echo "[2/4] Installing Backend Dependencies..."
npm install
npm install express cors body-parser cheerio axios rss-parser dotenv

echo ""
echo "[3/4] Installing Frontend and Building..."
cd frontend
npm install
npm run build
cd ..

echo ""
echo "[4/4] Setup Complete!"
echo "=============================================="
echo "To start Culina Tool, run ./start.sh"
echo "=============================================="
