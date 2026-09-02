@echo off
setlocal
echo ==============================================
echo       Culina Tool - Installation Setup
echo ==============================================
echo.

echo [0/4] Checking Dependencies...
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed! Please download it from https://nodejs.org/
    pause
    exit /b
)
git --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git is not installed! Please download it from https://git-scm.com/
    pause
    exit /b
)
echo [OK] All dependencies found!
echo.

set /p LICENSE_KEY="Enter your License Key (leave blank for Free Edition): "
if "%LICENSE_KEY%"=="" set LICENSE_KEY=free

set /p GEMINI_API_KEY="Enter your Google Gemini API Key for AI features (Optional): "

echo.
echo [1/4] Configuring Environment...
echo LICENSE_KEY=%LICENSE_KEY% > .env
if not "%GEMINI_API_KEY%"=="" (
    echo GEMINI_API_KEY=%GEMINI_API_KEY% >> .env
)

echo.
echo [2/4] Installing Backend Dependencies...
call npm install
call npm install express cors body-parser cheerio axios rss-parser dotenv

echo.
echo [3/4] Installing Frontend and Building...
cd frontend
call npm install
call npm run build
cd ..

echo.
echo [4/4] Setup Complete! 
echo ==============================================
echo To start Culina Tool, run start.bat
echo ==============================================
pause
