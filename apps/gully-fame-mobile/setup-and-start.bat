@echo off
echo ========================================
echo Gully Fame Mobile - Quick Setup
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file...
    echo EXPO_PUBLIC_API_BASE_URL=http://103.194.228.68:3552/v1/api/ > .env
    echo .env file created!
) else (
    echo .env file already exists.
)

echo.
echo Cleaning old files...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /q package-lock.json
if exist .expo rmdir /s /q .expo

echo.
echo Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: npm install failed!
    echo Please check your Node.js installation.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup complete! Starting Expo...
echo ========================================
echo.

call npx expo start --clear

pause

