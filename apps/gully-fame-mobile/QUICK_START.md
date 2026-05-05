# 🚀 Quick Start Guide - Gully Fame Mobile

## ✅ Status: READY TO DEVELOP

The persistent runtime error has been **FIXED**. The app is now ready for full development.

---

## Starting the App

### Option 1: Expo Go (Easiest)

```bash
npm start
# or
npx expo start
```

Then scan the QR code with Expo Go app on your phone.

### Option 2: Development Build

```bash
npm run start-android
# or
npm run ios
```

### Option 3: Web

```bash
npm run web
```

---

## Available Commands

```bash
# Start development server
npm start

# Start with Android
npm run start-android

# Start with iOS
npm run ios

# Start web version
npm run web

# Run Android build
npm run android

# Run iOS build
npm run ios

# Lint code
npm run lint

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Reset project (clears cache)
npm run reset-project

# Prebuild (for native development)
npm run prebuild
```

---

## Project Structure

```
apps/gully-fame-mobile/
├── src/
│   ├── api/              # API services and endpoints
│   ├── assets/           # Images, fonts, etc.
│   ├── components/       # Reusable components
│   ├── contexts/         # React contexts
│   ├── features/         # Feature modules
│   ├── hooks/            # Custom hooks
│   ├── navigation/       # Navigation setup
│   ├── screens/          # Screen components
│   ├── store/            # Redux store
│   ├── styles/           # Theme and styles
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── App.js                # App entry point
├── index.js              # React Native entry point
├── app.json              # Expo configuration
├── babel.config.js       # Babel configuration
├── metro.config.js       # Metro bundler config
└── package.json          # Dependencies
```

---

## Key Technologies

- **React Native**: 0.81.5
- **Expo**: 54.0.34
- **React**: 18.3.1
- **Redux**: @reduxjs/toolkit 2.9.1
- **Navigation**: @react-navigation 7.x
- **Styling**: NativeWind + Tailwind CSS
- **Forms**: React Hook Form + Yup
- **API**: Axios + React Query
- **State**: Redux + Zustand

---

## Troubleshooting

### Port Already in Use

```bash
# Kill all Node processes
Get-Process node | Stop-Process -Force

# Then start again
npm start
```

### Cache Issues

```bash
# Clear all caches
npm run reset-project

# Or manually
rm -r .expo node_modules .next .turbo dist build
npm install
```

### Module Not Found

```bash
# Reinstall dependencies
rm -r node_modules package-lock.json
npm install
```

### React Version Mismatch

```bash
# Verify correct versions
npm list react react-dom

# Should show:
# react@18.3.1
# react-dom@18.3.1
```

---

## Development Tips

1. **Use TypeScript**: All files should be `.ts` or `.tsx`
2. **Follow naming conventions**:
   - Components: `PascalCase` (e.g., `HomeScreen.tsx`)
   - Utilities: `camelCase` (e.g., `formatDate.ts`)
   - Constants: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)

3. **Use path aliases**:
   - `@api` → `src/api`
   - `@components` → `src/components`
   - `@screens` → `src/screens`
   - etc.

4. **Redux for global state**: Use Redux for app-wide state
5. **Zustand for local state**: Use Zustand for component-level state
6. **React Query for API**: Use React Query for server state

---

## Environment Variables

Create `.env.local` with:

```
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
EXPO_PUBLIC_RAZORPAY_KEY_ID=your_key_id
EXPO_PUBLIC_ENV=development
```

---

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:coverage

# Run specific test file
npm test -- HomeScreen.test.tsx
```

---

## Building for Production

### Android

```bash
npm run prebuild
npm run android
```

### iOS

```bash
npm run prebuild
npm run ios
```

### EAS Build (Recommended)

```bash
eas build --platform android
eas build --platform ios
```

---

## Common Issues & Solutions

| Issue                                   | Solution                                                       |
| --------------------------------------- | -------------------------------------------------------------- |
| "Cannot read property 'S' of undefined" | ✅ FIXED - React version mismatch resolved                     |
| Port 8081 in use                        | Kill Node processes: `Get-Process node \| Stop-Process -Force` |
| Module not found                        | Clear cache: `npm run reset-project`                           |
| Bundler slow                            | Clear cache and rebuild: `npm start --clear`                   |
| TypeScript errors                       | Run: `npm run lint`                                            |

---

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [React Navigation](https://reactnavigation.org)
- [NativeWind](https://www.nativewind.dev)

---

## Support

For issues or questions:

1. Check `ERROR_FIX_REPORT.md` for the runtime error fix
2. Check `COMPLETE_ANALYSIS_REPORT.md` for codebase analysis
3. Check `DEVELOPER_GUIDE.md` for development guidelines

---

**Last Updated**: May 5, 2026
**Status**: ✅ READY TO DEVELOP
