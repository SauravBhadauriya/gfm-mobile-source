#!/bin/bash

echo "========================================"
echo "Gully Fame Mobile - Quick Setup"
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    echo "EXPO_PUBLIC_API_BASE_URL=http://103.194.228.68:3552/v1/api/" > .env
    echo ".env file created!"
else
    echo ".env file already exists."
fi

echo ""
echo "Cleaning old files..."
rm -rf node_modules
rm -f package-lock.json
rm -rf .expo

echo ""
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: npm install failed!"
    echo "Please check your Node.js installation."
    exit 1
fi

echo ""
echo "========================================"
echo "Setup complete! Starting Expo..."
echo "========================================"
echo ""

npx expo start --clear

