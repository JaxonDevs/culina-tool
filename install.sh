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

echo ""
echo "[1/3] Installing Backend Dependencies..."
npm install
npm install express cors body-parser cheerio axios rss-parser dotenv

echo ""
echo "[2/3] Installing Frontend and Building..."
cd frontend
npm install
npm run build
cd ..

echo ""
echo "[3/3] Setup Complete!"
echo "=============================================="
echo "To start Culina Tool, run ./start.sh"
echo "Then open your browser to run the Setup Wizard!"
echo "=============================================="
