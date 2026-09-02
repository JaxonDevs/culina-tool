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

echo.
echo [1/3] Installing Backend Dependencies...
call npm install
call npm install express cors body-parser cheerio axios rss-parser dotenv

echo.
echo [2/3] Installing Frontend and Building...
cd frontend
call npm install
call npm run build
cd ..

echo.
echo [3/3] Windows Startup Setup
set /p ADD_STARTUP="Do you want Culina Tool to run automatically in the background when Windows starts? (y/n): "
if /i "%ADD_STARTUP%"=="y" (
    echo Set WshShell = CreateObject("WScript.Shell"^) > "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\culina-tool.vbs"
    echo WshShell.Run chr(34^) ^& "%~dp0start.bat" ^& Chr(34^), 0 >> "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\culina-tool.vbs"
    echo Set WshShell = Nothing >> "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\culina-tool.vbs"
    echo [OK] Added to Windows Startup folder.
)

echo.
echo [4/4] Setup Complete! 
echo ==============================================
echo To start Culina Tool, run start.bat
echo Then open your browser and follow the Setup Wizard!
echo ==============================================
pause
