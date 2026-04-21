@echo off
echo ========================================
echo Fixing Development Build Error
echo ========================================
echo.

echo Step 1: Cleaning old build files...
if exist android rmdir /s /q android
if exist ios rmdir /s /q ios
if exist .expo rmdir /s /q .expo
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo Step 2: Rebuilding native code...
call npx expo prebuild --clean

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: prebuild failed!
    echo Please check the error message above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build files regenerated!
echo ========================================
echo.
echo Next steps:
echo 1. For Android: npx expo run:android
echo 2. For iOS: npx expo run:ios
echo 3. Or start dev server: npx expo start --clear
echo.

pause

