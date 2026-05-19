# 🎬 Gully Fame - Complete Codebase Analysis

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Monorepo Structure](#monorepo-structure)
3. [Technology Stack](#technology-stack)
4. [Mobile App Architecture](#mobile-app-architecture)
5. [Admin Panel Architecture](#admin-panel-architecture)
6. [API Integration](#api-integration)
7. [State Management](#state-management)
8. [Authentication Flow](#authentication-flow)
9. [Key Features](#key-features)
10. [File-by-File Breakdown](#file-by-file-breakdown)

---

## 🎯 Project Overview

**Gully Fame** is a TikTok-like social platform with video competitions. It's a **monorepo** containing 3 interconnected applications:

1. **Mobile App** (React Native + Expo) - User-facing reel platform
2. **Admin Panel** (Next.js) - Management dashboard for admins and sponsors
3. **Video Editor** (Expo) - Standalone video editing tool

**Tech Stack**: React Native, Next.js, Redux, Axios, Firebase, Razorpay

---

## 📁 Monorepo Structure

```
gully-fame-monorepo/
├── apps/
│   ├── gully-fame-mobile/          # React Native mobile app (Expo)
│   │   ├── app/                    # Expo Router file-based routing
│   │   ├── src/
│   │   │   ├── api/                # API services & axios config
│   │   │   ├── components/         # Reusable components
│   │   │   ├── contexts/           # Auth, Branding, UserRole contexts
│   │   │   ├── store/              # Redux slices
│   │   │   ├── screens/            # Screen components (deprecated)
│   │   │   ├── types/              # TypeScript interfaces
│   │   │   ├── utils/              # Helper functions
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   ├── modules/            # Video editor, camera modules
│   │   │   └── styles/             # Styling files
│   │   ├── metro.config.js         # Metro bundler config
│   │   ├── babel.config.js         # Babel config
│   │   ├── package.json            # Mobile dependencies
│   │   └── .env                    # Environment variables
│   │
│   ├── gully-fame-admin/           # Next.js admin dashboard
│   │   ├── app/                    # Next.js app directory
│   │   │   ├── layout.tsx          # Root layout with AuthGuard
│   │   │   ├── page.tsx            # Dashboard page
│   │   │   ├── login/              # Login page
│   │   │   ├── competitions/       # Competition management
│   │   │   ├── users/              # User management
│   │   │   ├── analytics/          # Analytics page
│   │   │   ├── moderation/         # Content moderation
│   │   │   ├── monetization/       # Monetization settings
│   │   │   ├── reports/            # Reports page
│   │   │   ├── reels/              # Reel management
│   │   │   ├── settings/           # Settings page
│   │   │   └── app-content/        # App content management
│   │   ├── components/             # React components
│   │   ├── lib/                    # API clients & utilities
│   │   ├── public/                 # Static assets
│   │   ├── package.json            # Admin dependencies
│   │   └── next.config.js          # Next.js config
│   │
│   └── videoeditor/                # Expo video editor app
│       ├── app/                    # Expo Router routing
│       ├── src/                    # Source code
│       └── package.json            # Video editor dependencies
│
├── packages/                       # Shared packages (if any)
├── turbo.json                      # Monorepo build orchestration
├── package.json                    # Root workspace config
├── tsconfig.json                   # TypeScript config
├── app.json                        # Expo config
├── eas.json                        # EAS build config
└── .gitattributes                  # Git line ending config
```

---

## 🛠️ Technology Stack

### Mobile App (React Native + Expo)

**Core Framework**:

- React 19.1.0
- React Native 0.81.5
- Expo 54.0.34
- Expo Router 6.0.10 (file-based routing)

**State Management**:

- Redux Toolkit 2.9.1
- React Redux 9.2.0
- Zustand 5.0.8
- React Query 5.90.5

**UI & Styling**:

- NativeWind 4.2.1 (Tailwind CSS for React Native)
- React Native Reanimated 4.1.1
- React Native Gesture Handler 2.28.0
- Expo Vector Icons 15.0.3

**Media & Camera**:

- Expo Camera 17.0.10
- Expo Video 3.0.14
- Expo Image Picker 17.0.8
- React Native Vision Camera 5.0.9

**Networking & Auth**:

- Axios 1.12.2
- Firebase 12.4.0
- Socket.io Client 4.8.1
- React Native Google Sign-In 16.1.1

**Storage**:

- AsyncStorage 2.2.0
- Expo Secure Store 15.0.8

**Forms & Validation**:

- React Hook Form 7.65.0
- Yup 1.7.1

**Payments**:

- React Native Razorpay 2.3.1

### Admin Panel (Next.js)

- Next.js 14.0.0
- React 18.2.0
- Tailwind CSS 3.3.0
- Lucide React 0.294.0 (icons)
- Recharts 2.10.0 (charts)

---

## 📱 Mobile App Architecture

### Routing Structure (Expo Router)

```
app/
├── _layout.tsx              # Root layout with providers
├── index.tsx                # Splash/initial screen
├── auth/
│   ├── _layout.tsx
│   ├── signin.tsx           # Login screen
│   ├── signup.tsx           # Registration screen
│   └── otp.tsx              # OTP verification
├── onboarding/
│   └── _layout.tsx
└── (main)/                  # Main app screens
    ├── _layout.tsx          # Bottom tab navigation
    ├── home/                # Home feed
    ├── reel/                # Reel viewing
    ├── search/              # Search
    ├── profile/             # User profile
    ├── community/           # Community features
    ├── inbox/               # Messages
    ├── settings/            # Settings
    ├── competitions/        # Competitions list
    ├── camera/              # Camera screen
    ├── upload/              # Reel upload
    └── [other screens]
```

### API Services (`src/api/services/`)

Each service handles specific domain:

- **authService.ts** - Login, register, OTP, profile, password reset
- **reelsService.ts** - Fetch, create, like, comment, share reels
- **competitionService.ts** - Browse, join, submit competitions
- **userService.ts** - User profile, follow/unfollow
- **paymentService.ts** - Razorpay payment integration
- **notificationService.ts** - Push notifications
- **chatService.ts** - Messaging
- **categoryService.ts** - Content categories
- **bannerService.ts** - Promotional banners
- **kycService.ts** - KYC verification
- **videoEditorService.ts** - Video editor integration

### Redux Store (`src/store/`)

```typescript
store = {
  user: {
    id, email, firstName, lastName, mobile, role, profileImage, ...
  },
  reels: {
    items: [],
    loading: false,
    error: null,
    ...
  },
  competitions: {
    items: [],
    loading: false,
    ...
  },
  ui: {
    modals: {},
    loading: false,
    ...
  }
}
```

### Context Providers (`src/contexts/`)

- **AuthContext** - Token management, login/logout
- **BrandingContext** - App logos, colors, splash screens
- **UserRoleContext** - User role (participant, fan, admin)

---

## 🖥️ Admin Panel Architecture

### Pages Structure

```
app/
├── layout.tsx               # Root layout with AuthGuard
├── page.tsx                 # Dashboard (admin/sponsor view)
├── login/page.tsx           # Login page
├── competitions/
│   ├── page.tsx             # List competitions
│   ├── create/page.tsx      # Create competition
│   └── [id]/
│       ├── page.tsx         # Competition details
│       ├── edit/page.tsx    # Edit competition
│       ├── leaderboard/     # Leaderboard
│       └── participants/    # Participants list
├── users/page.tsx           # User management
├── analytics/page.tsx       # Analytics
├── moderation/page.tsx      # Content moderation
├── monetization/page.tsx    # Monetization settings
├── reports/page.tsx         # Reports
├── reels/page.tsx           # Reel management
├── settings/page.tsx        # Settings
└── app-content/             # App content management
    ├── components/          # Branding components
    ├── home-sections/       # Home page sections
    └── page.tsx
```

### API Clients (`lib/`)

- **dashboardApi.ts** - Dashboard stats, recent activity
- **userApi.ts** - User management, KYC, earnings
- **competitionApi.ts** - Competition CRUD
- **bannerApi.ts** - Banner management
- **categoryApi.ts** - Category management
- **brandingApi.ts** - Logo, splash screen uploads
- **authApi.ts** - Admin authentication

---

## 🔌 API Integration

### Axios Configuration (`src/api/axios.ts`)

```typescript
// Base URL
BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://103.194.228.68:3552/v1/api/"

// Request Interceptor
- Adds Authorization header with Bearer token
- Logs request details for debugging
- Handles skipAuth flag for public endpoints

// Response Interceptor
- Handles 401 errors (token refresh)
- Logs response data
- Handles network errors with retry logic
- Returns custom error format

// Timeout: 60 seconds (for mobile builds)
```

### API Response Format

```typescript
{
  success: boolean,
  message?: string,
  data?: T,
  error?: string,
  errors?: Record<string, string[]>,
  code?: number
}
```

### Error Handling

- Network errors: Retry up to 2 times with 1s delay
- 401 Unauthorized: Attempt token refresh
- 403 Forbidden: Log warning
- 404 Not Found: Log warning
- 500 Server Error: Log error
- Network unavailable: Return custom error

---

## 🔐 State Management

### Redux Slices

1. **userSlice** - User data, authentication state
2. **reelsSlice** - Reels list, likes, comments
3. **competitionsSlice** - Competitions data
4. **uiSlice** - UI state (modals, loading, etc.)

### Context API

- **AuthContext** - Token, login/logout functions
- **BrandingContext** - App branding data
- **UserRoleContext** - User role information

### AsyncStorage

Persistent data stored locally:

- authToken
- userRole
- userEmail
- userFirstName, userLastName
- userMobile
- profileCompleted
- userId
- accountCreatedVia

---

## 🔑 Authentication Flow

### Login Process

1. User enters email/mobile and password
2. `authService.login()` sends POST to `/auth/login`
3. Backend returns token and user data
4. Token saved to AsyncStorage via `setAuthToken()`
5. `AuthContext` updated with token
6. User redirected to main app

### Token Management

- Token stored in AsyncStorage
- Axios interceptor adds token to all requests
- On 401 error, attempt refresh via `/auth/refresh-token`
- If refresh fails, redirect to login

### Social Login

- Google Sign-In via `@react-native-google-signin/google-signin`
- Apple Sign-In via Expo Auth Session
- Firebase integration for social auth

---

## ✨ Key Features

### Mobile App

- **Reels**: Create, upload, view, like, comment, share
- **Competitions**: Browse, join, submit entries, view winners
- **User Profiles**: View/edit, follow/unfollow, followers
- **Search**: Search reels, users, competitions, categories
- **Messaging**: Chat with other users
- **Notifications**: Push notifications for activities
- **Payments**: Razorpay integration for tips/coins
- **KYC**: User verification process
- **Video Editor**: Built-in video editing with effects
- **Camera**: Direct video capture with filters

### Admin Panel

- **Dashboard**: Platform statistics and recent activity
- **User Management**: View users, manage KYC, reset passwords
- **Competition Management**: Create, approve, manage competitions
- **Banner Management**: Upload promotional banners
- **Category Management**: Create and manage categories
- **Branding**: Upload logos and splash screens
- **Analytics**: View platform metrics
- **Sponsor Dashboard**: Sponsors view their competitions

---

## 📄 File-by-File Breakdown

### Mobile App - Critical Files

#### `app/_layout.tsx`

- Root layout component
- Loads custom fonts (Rubik, Playfair Display, Inter)
- Wraps app with providers (UserRoleProvider, BrandingProvider)
- Handles splash screen
- Sets up Expo Router

#### `src/api/axios.ts`

- Creates Axios instance with base URL
- Request interceptor: adds auth token
- Response interceptor: handles errors, retries
- Token management functions
- Network error handling

#### `src/api/services/authService.ts`

- `register()` - User registration
- `verifyOtp()` - OTP verification
- `login()` - User login
- `getUserProfile()` - Fetch user profile
- `updateProfile()` - Update user profile
- `resetPassword()` - Password reset
- `socialLogin()` - Google/Apple login

#### `src/api/services/reelsService.ts`

- `getReelsFeed()` - Fetch reels feed (GET `/feed/matrix`)
- `uploadReel()` - Upload new reel
- `likeReel()` - Like a reel
- `unlikeReel()` - Unlike a reel
- `commentOnReel()` - Add comment
- `shareReel()` - Share reel
- `deleteReel()` - Delete reel

#### `src/store/index.tsx`

- Redux store configuration
- Combines 4 slices: user, reels, competitions, ui
- Exports RootState and AppDispatch types

#### `src/contexts/AuthContext.tsx`

- Manages authentication state
- Provides token and login/logout functions
- Loads token from AsyncStorage on app start
- Clears all user data on logout

#### `src/contexts/BrandingContext.tsx`

- Manages app branding (logos, colors, splash screens)
- Fetches branding data from API
- Provides branding data to entire app

### Admin Panel - Critical Files

#### `app/layout.tsx`

- Root layout with AuthGuard wrapper
- Sets metadata (title, description)
- Wraps children with authentication check

#### `app/page.tsx`

- Dashboard page
- Shows different views for admin vs sponsor
- Displays platform stats for admin
- Displays sponsor's competitions for sponsor
- Fetches data from dashboardApi and competitionApi

#### `app/competitions/page.tsx`

- Lists all competitions
- Shows competition details
- Allows filtering and sorting
- Links to create, edit, view competition details

#### `app/competitions/create/page.tsx`

- Form to create new competition
- Validates input
- Submits to competitionApi.createCompetition()

#### `lib/dashboardApi.ts`

- `getQuickStats()` - Fetch platform statistics
- `getRecentActivity()` - Fetch recent activity

#### `lib/competitionApi.ts`

- `getCompetitions()` - List competitions
- `getCompetitionDetail()` - Get single competition
- `createCompetition()` - Create new competition
- `updateCompetition()` - Update competition
- `deleteCompetition()` - Delete competition

#### `lib/userApi.ts`

- `getUsers()` - List users
- `getUserDetail()` - Get user profile
- `updateUserKyc()` - Update KYC status
- `resetUserPassword()` - Reset password

#### `components/DashboardLayout.tsx`

- Main layout wrapper
- Sidebar navigation
- Header with user info
- Responsive design

#### `components/AuthGuard.tsx`

- Checks if user is authenticated
- Redirects to login if not authenticated
- Wraps protected pages

---

## 🔄 Data Flow Examples

### Reel Upload Flow

```
1. User selects video from gallery
2. Video sent to video editor module
3. User edits video (trim, effects, filters)
4. User adds title, description, category
5. reelsService.uploadReel() called
6. FormData sent to POST /reels/upload
7. Backend processes video with FFmpeg
8. Reel added to database
9. Redux reelsSlice updated
10. Reel appears in user's profile and feed
```

### Competition Join Flow

```
1. User views competition details
2. User clicks "Join Competition"
3. competitionService.joinCompetition() called
4. POST /competitions/{id}/join sent
5. Backend adds user to participants
6. Redux competitionsSlice updated
7. UI shows "Joined" status
8. User can now submit entries
```

### Admin Dashboard Load Flow

```
1. Admin navigates to dashboard
2. AuthGuard checks authentication
3. Dashboard page checks user role
4. If admin: fetch platform stats and recent activity
5. If sponsor: fetch sponsor's competitions
6. Data displayed in StatCards and panels
7. Real-time updates via polling or WebSocket
```

---

## 🚀 Build & Deployment

### Development Commands

```bash
# Install dependencies
npm install

# Run mobile app
npm run start:mobile

# Run admin panel
npm run start:admin

# Run both
npm start
```

### Build Process

- **Mobile**: Expo prebuild → EAS build → APK/IPA
- **Admin**: Next.js build → Vercel/self-hosted
- **Monorepo**: Turborepo manages build order and caching

### Environment Variables

**Mobile** (`.env`):

```
EXPO_PUBLIC_API_BASE_URL=http://103.194.228.68:3552/v1/api/
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_GOOGLE_CLIENT_ID=...
EXPO_PUBLIC_RAZORPAY_KEY_ID=...
```

**Admin**:

- Requires authentication setup
- API base URL configured in lib files

---

## 📊 Summary

**Gully Fame** is a well-architected monorepo with:

- ✅ Clear separation of concerns (mobile, admin, video editor)
- ✅ Robust API integration with error handling
- ✅ Modern state management (Redux + Context)
- ✅ File-based routing (Expo Router)
- ✅ TypeScript for type safety
- ✅ Responsive design (Tailwind CSS)
- ✅ Real-time features (Socket.io)
- ✅ Payment integration (Razorpay)
- ✅ Video processing (FFmpeg)

**Key Technologies**: React Native, Next.js, Redux, Axios, Firebase, Razorpay, Expo

**Main Features**: Reels, Competitions, User Profiles, Messaging, Payments, Video Editing

---

**Document Generated**: May 15, 2026
**Last Updated**: By Kiro AI
