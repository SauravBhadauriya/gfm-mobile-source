# Video Editor App

## Quick Start

### Android (Windows)
```bash
npm run android
```
✅ Fully configured and ready to build!

### iOS

**Option 1: Build on macOS (requires Mac)**
```bash
npm run prebuild:ios
cd ios && pod install && cd ..
npm run ios
```

**Option 2: EAS Build (cloud - no Mac needed)**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo (free account)
eas login

# Configure project (first time only)
eas build:configure

# Build iOS app
eas build --platform ios
```

**Note**: EAS Build requires:
- ✅ Expo account (free tier available) - `eas login`
- ⚠️ Apple Developer account (for production builds) - EAS can help set this up

## Status

- ✅ **Android**: Ready to build and test
- ✅ **iOS**: Configured, needs macOS to build (or use EAS Build)

Both platforms are configured with all required permissions and plugins.

