# Gully Fame Mobile - Developer Guide

## 📖 Table of Contents

1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Project Structure](#project-structure)
4. [Key Features](#key-features)
5. [Development Workflow](#development-workflow)
6. [API Integration](#api-integration)
7. [State Management](#state-management)
8. [Navigation](#navigation)
9. [Styling](#styling)
10. [Error Handling](#error-handling)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**Gully Fame Mobile** is a React Native application built with Expo for iOS and Android platforms. It's a social media platform for short-form video content with competition features.

### Tech Stack

- **Framework:** React Native 0.81.5
- **Build Tool:** Expo 54.0.34
- **State Management:** Redux Toolkit 2.9.1
- **Data Fetching:** React Query 5.90.5
- **Navigation:** React Navigation 7.x
- **Styling:** NativeWind 4.2.1 + Custom Theme
- **Language:** TypeScript 5.4.0

### Key Dependencies

- `@react-navigation/native` - Navigation
- `@react-navigation/bottom-tabs` - Tab navigation
- `@react-navigation/native-stack` - Stack navigation
- `@reduxjs/toolkit` - State management
- `axios` - HTTP client
- `react-hook-form` - Form management
- `yup` - Form validation
- `@react-native-async-storage/async-storage` - Local storage
- `expo-camera` - Camera access
- `react-native-razorpay` - Payment processing
- `ffmpeg-kit-react-native-community` - Video processing

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (check with `node --version`)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

```bash
# 1. Navigate to the mobile app directory
cd apps/gully-fame-mobile

# 2. Install dependencies
npm install

# 3. Start the development server
npm start

# 4. Choose platform
# Press 'a' for Android
# Press 'i' for iOS
# Press 'w' for web
```

### Environment Setup

Create `.env` file in `apps/gully-fame-mobile/`:

```env
EXPO_PUBLIC_API_BASE_URL=http://your-api-url/v1/api/
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_domain
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
EXPO_PUBLIC_ENV=development
```

---

## 📁 Project Structure

```
apps/gully-fame-mobile/
├── src/
│   ├── api/                    # API integration
│   │   ├── axios.ts           # Axios configuration
│   │   ├── endpoints.ts        # API endpoint constants
│   │   ├── index.ts            # API exports
│   │   ├── types.ts            # API types
│   │   └── services/           # API services
│   │       ├── authService.ts
│   │       ├── userService.ts
│   │       ├── competitionService.ts
│   │       ├── reelsService.ts
│   │       └── ... (14 more services)
│   ├── components/             # Reusable components
│   │   ├── ErrorBoundary.tsx
│   │   ├── layout/
│   │   ├── modals/
│   │   ├── reel/
│   │   └── ui/
│   ├── contexts/               # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── BrandingContext.tsx
│   │   ├── CompetitionContext.tsx
│   │   ├── ReelsContext.tsx
│   │   └── UserRoleContext.tsx
│   ├── hooks/                  # Custom hooks
│   │   ├── useAsync.ts
│   │   ├── useFetch.ts
│   │   ├── useForm.ts
│   │   └── ... (5 more hooks)
│   ├── navigation/             # Navigation setup
│   │   ├── AppNavigator.tsx
│   │   └── types.ts
│   ├── screens/                # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── ReelsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── ... (16 more screens)
│   ├── store/                  # Redux store
│   │   ├── index.tsx
│   │   └── slices/
│   │       ├── userSlice.ts
│   │       ├── reelsSlice.ts
│   │       ├── competitionsSlice.ts
│   │       └── uiSlice.ts
│   ├── styles/                 # Styling
│   │   ├── theme.ts            # Theme constants
│   │   └── ... (11 more style files)
│   ├── types/                  # TypeScript types
│   │   ├── index.ts
│   │   ├── categories.ts
│   │   ├── competitions.ts
│   │   └── ... (8 more type files)
│   └── utils/                  # Utility functions
│       ├── errorMessages.ts
│       ├── validation.ts
│       ├── storage.ts
│       └── ... (11 more utilities)
├── App.js                      # App entry point
├── index.js                    # React Native entry point
├── app.json                    # Expo configuration
├── babel.config.js             # Babel configuration
├── metro.config.js             # Metro bundler configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies
└── README.md                   # Project README
```

---

## ✨ Key Features

### 1. Authentication

- Email/password login and registration
- Social login (Google, Facebook)
- OTP verification
- Token refresh mechanism
- Secure token storage

### 2. Reels

- Upload short-form videos
- Like/unlike reels
- Comment on reels
- Share reels
- Trending reels feed

### 3. Competitions

- Browse competitions
- Join competitions
- View leaderboards
- Submit entries
- Track rankings

### 4. User Profile

- View user profile
- Edit profile information
- Change password
- KYC verification
- View followers/following

### 5. Payments

- Razorpay integration
- In-app purchases
- Payment history
- Wallet management

### 6. Video Editing

- Record videos
- Edit videos
- Add effects
- Add music
- Export videos

---

## 💻 Development Workflow

### Creating a New Screen

1. **Create screen file** in `src/screens/`:

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { AppScreenProps } from '../navigation/types';

export default function MyScreen({ navigation, route }: AppScreenProps) {
  return (
    <View>
      <Text>My Screen</Text>
    </View>
  );
}
```

2. **Add to navigation** in `src/navigation/AppNavigator.tsx`:

```typescript
import MyScreen from '../screens/MyScreen';

// Add to AppStack
<Stack.Screen name="MyScreen" component={MyScreen} />
```

3. **Update types** in `src/navigation/types.ts`:

```typescript
export type AppStackParamList = {
  MyScreen: { param1: string };
  // ... other screens
};
```

### Creating a New API Service

1. **Create service file** in `src/api/services/`:

```typescript
import apiClient from "../axios";
import { ApiResponse } from "../types";

export const myService = {
  async getData(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get("endpoint");
      return {
        success: true,
        data: response.data,
        message: "Success",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  },
};
```

2. **Export from API index** in `src/api/index.ts`:

```typescript
export { myService } from "./services/myService";
```

3. **Use in component**:

```typescript
import { myService } from "../api";

const data = await myService.getData();
```

### Creating a Redux Slice

1. **Create slice file** in `src/store/slices/`:

```typescript
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface MyState {
  data: any[];
  loading: boolean;
}

const initialState: MyState = {
  data: [],
  loading: false,
};

const mySlice = createSlice({
  name: "my",
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<any[]>) => {
      state.data = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setData, setLoading } = mySlice.actions;
export default mySlice.reducer;
```

2. **Add to store** in `src/store/index.tsx`:

```typescript
import myReducer from "./slices/mySlice";

export const store = configureStore({
  reducer: {
    my: myReducer,
    // ... other reducers
  },
});
```

3. **Use in component**:

```typescript
import { useDispatch, useSelector } from 'react-redux';
import { setData } from '../store/slices/mySlice';

const MyComponent = () => {
  const dispatch = useDispatch();
  const data = useSelector((state: RootState) => state.my.data);

  const handleSetData = () => {
    dispatch(setData([...]));
  };

  return <View>{/* ... */}</View>;
};
```

---

## 🔌 API Integration

### Using API Services

```typescript
import { competitionService } from "../api";

// In a component
const [competitions, setCompetitions] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchCompetitions = async () => {
    setLoading(true);
    const response = await competitionService.getCompetitions();
    if (response.success) {
      setCompetitions(response.data.items);
    }
    setLoading(false);
  };

  fetchCompetitions();
}, []);
```

### API Endpoints

All endpoints are defined in `src/api/endpoints.ts`:

```typescript
import { API_ENDPOINTS } from "../api/endpoints";

// Use endpoints
const url = API_ENDPOINTS.AUTH.LOGIN;
const url = API_ENDPOINTS.COMPETITION.GET_ALL;
```

### Error Handling

```typescript
import { ERROR_MESSAGES } from "../utils/errorMessages";

try {
  const response = await myService.getData();
  if (!response.success) {
    Alert.alert("Error", response.message || ERROR_MESSAGES.SOMETHING_WENT_WRONG);
  }
} catch (error) {
  Alert.alert("Error", ERROR_MESSAGES.NETWORK_ERROR);
}
```

---

## 🎨 Styling

### Using Theme Constants

```typescript
import { COLORS, SPACING, TYPOGRAPHY } from "../styles/theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    padding: SPACING.LG,
  },
  title: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XXL,
    fontWeight: TYPOGRAPHY.FONT_FAMILY.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
});
```

### Color Palette

```typescript
// Primary
COLORS.PRIMARY = '#E91E63'
COLORS.PRIMARY_DARK = '#C2185B'
COLORS.PRIMARY_LIGHT = '#F06292'

// Secondary
COLORS.SECONDARY = '#007AFF'
COLORS.SECONDARY_DARK = '#0051D5'
COLORS.SECONDARY_LIGHT = '#5AC8FA'

// Neutral
COLORS.WHITE = '#FFFFFF'
COLORS.BLACK = '#000000'
COLORS.GRAY_50 to COLORS.GRAY_900

// Status
COLORS.SUCCESS = '#10B981'
COLORS.WARNING = '#F59E0B'
COLORS.ERROR = '#EF4444'
COLORS.INFO = '#3B82F6'
```

---

## ⚠️ Error Handling

### Using Error Messages

```typescript
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../utils/errorMessages";

// Show error
Alert.alert("Error", ERROR_MESSAGES.INVALID_CREDENTIALS);

// Show success
Alert.alert("Success", SUCCESS_MESSAGES.LOGIN_SUCCESS);
```

### Error Boundary

```typescript
import ErrorBoundary from '../components/ErrorBoundary';

<ErrorBoundary onError={(error, info) => console.log(error, info)}>
  <MyComponent />
</ErrorBoundary>
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

```typescript
import { render, screen } from '@testing-library/react-native';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('My Component')).toBeTruthy();
  });
});
```

---

## 📦 Deployment

### Build for Android

```bash
# Build APK
eas build --platform android

# Build AAB (for Play Store)
eas build --platform android --app-variant release
```

### Build for iOS

```bash
# Build IPA
eas build --platform ios

# Build for App Store
eas build --platform ios --app-variant release
```

### Submit to App Stores

```bash
# Submit to Google Play
eas submit --platform android

# Submit to App Store
eas submit --platform ios
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Metro Bundler Errors

```bash
# Clear cache and rebuild
npm start -- --clear

# Or complete clean
rm -rf node_modules .expo
npm install
npm start
```

#### 2. Module Not Found

```bash
# Check imports are correct
# Verify file exists
# Check path aliases in tsconfig.json and babel.config.js
```

#### 3. Type Errors

```bash
# Run TypeScript compiler
npx tsc --noEmit

# Fix type errors in the output
```

#### 4. API Connection Issues

```bash
# Check .env file
# Verify API_BASE_URL is correct
# Check network connectivity
# Check API server is running
```

#### 5. Build Failures

```bash
# Clean build
npm run clean

# Rebuild
npm install
npm start
```

---

## 📚 Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation Documentation](https://reactnavigation.org/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

---

## 📞 Support

For questions or issues:

1. Check this guide
2. Check `CODEBASE_FIXES.md` for detailed information
3. Check inline code comments
4. Check error messages in `src/utils/errorMessages.ts`

---

**Last Updated:** May 5, 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready
