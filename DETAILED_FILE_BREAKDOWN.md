# 📚 Detailed File-by-File Codebase Breakdown

## 🎯 Purpose

Ye document har important file ka detailed breakdown hai with code examples, logic explanation, aur connections.

---

## 📱 MOBILE APP FILES

### 1. `apps/gully-fame-mobile/app/_layout.tsx`

**Purpose**: Root layout component jo poora app ko wrap karta hai

**Key Imports**:

```typescript
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BrandingProvider } from "@contexts/BrandingContext";
import { UserRoleProvider } from "@/contexts/UserRoleContext";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "@expo-google-fonts/rubik";
```

**Main Logic**:

- Loads custom fonts (Rubik, Playfair Display, Inter)
- Prevents splash screen from auto-hiding
- Wraps app with providers (BrandingProvider, UserRoleProvider)
- Sets up Expo Router Stack navigation
- Handles font loading and error states

**Code Structure**:

```typescript
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_700Bold,
    // ... more fonts
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BrandingProvider>
        <UserRoleProvider>
          <Stack>
            {/* Routes defined here */}
          </Stack>
        </UserRoleProvider>
      </BrandingProvider>
    </GestureHandlerRootView>
  );
}
```

**Connections**:

- Wraps all screens with providers
- Loads fonts before rendering
- Manages splash screen visibility

---

### 2. `apps/gully-fame-mobile/src/api/axios.ts`

**Purpose**: Axios instance configuration with interceptors for API calls

**Key Features**:

- Base URL configuration with fallback
- Request interceptor (adds auth token)
- Response interceptor (handles errors)
- Token management
- Network error handling

**Code Structure**:

```typescript
// Base URL setup
export let BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
if (!BASE_URL) {
  BASE_URL = "http://103.194.228.68:3552/v1/api/";
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds for mobile
  headers: {
    "Content-Type": "application/json",
    "User-Agent": "GullyFame-Mobile/1.0",
  },
});

// Request Interceptor
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (!config.skipAuth) {
    const token = await AsyncStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token refresh logic
      const refreshed = await refreshToken();
      if (refreshed) {
        return apiClient(error.config);
      }
    }
    return Promise.reject(error);
  }
);
```

**Key Functions**:

- `setAuthToken(token)` - Save token to AsyncStorage and set header
- `getAuthToken()` - Get token from AsyncStorage
- `removeAuthToken()` - Clear token

**Connections**:

- Used by all API services
- Called by AuthContext for token management
- Handles all HTTP requests/responses

---

### 3. `apps/gully-fame-mobile/src/store/index.tsx`

**Purpose**: Redux store configuration

**Code**:

```typescript
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import reelsReducer from "./slices/reelsSlice";
import competitionsReducer from "./slices/competitionsSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    reels: reelsReducer,
    competitions: competitionsReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**State Structure**:

```typescript
{
  user: {
    user: UserData | null
  },
  reels: {
    reels: Reel[],
    currentReel: Reel | null,
    loading: boolean,
    error: string | null
  },
  competitions: {
    competitions: Competition[],
    loading: boolean,
    error: string | null
  },
  ui: {
    modals: {},
    loading: boolean
  }
}
```

**Connections**:

- Wraps entire app in Provider
- Used by all components via useSelector/useDispatch

---

### 4. `apps/gully-fame-mobile/src/store/slices/userSlice.ts`

**Purpose**: Redux slice for user state management

**Code**:

```typescript
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
```

**Actions**:

- `setUser(userData)` - Store user data in Redux
- `clearUser()` - Clear user data on logout

**Usage Example**:

```typescript
// In component
const dispatch = useDispatch();
const user = useSelector((state: RootState) => state.user.user);

// Set user after login
dispatch(setUser(userData));

// Clear user on logout
dispatch(clearUser());
```

---

### 5. `apps/gully-fame-mobile/src/store/slices/reelsSlice.ts`

**Purpose**: Redux slice for reels state management

**Code**:

```typescript
interface Reel {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  likes: number;
  comments: number;
  views: number;
  isLiked: boolean;
  createdAt: string;
}

interface ReelsState {
  reels: Reel[];
  currentReel: Reel | null;
  loading: boolean;
  error: string | null;
}

const reelsSlice = createSlice({
  name: "reels",
  initialState,
  reducers: {
    setReels: (state, action) => {
      state.reels = action.payload;
    },
    setCurrentReel: (state, action) => {
      state.currentReel = action.payload;
    },
    addReel: (state, action) => {
      state.reels.unshift(action.payload);
    },
    removeReel: (state, action) => {
      state.reels = state.reels.filter((reel) => reel.id !== action.payload);
    },
    updateReel: (state, action) => {
      const index = state.reels.findIndex((reel) => reel.id === action.payload.id);
      if (index !== -1) {
        state.reels[index] = action.payload;
      }
    },
    likeReel: (state, action) => {
      const reel = state.reels.find((r) => r.id === action.payload);
      if (reel) {
        reel.isLiked = true;
        reel.likes += 1;
      }
    },
    unlikeReel: (state, action) => {
      const reel = state.reels.find((r) => r.id === action.payload);
      if (reel) {
        reel.isLiked = false;
        reel.likes -= 1;
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setReels,
  setCurrentReel,
  addReel,
  removeReel,
  updateReel,
  likeReel,
  unlikeReel,
  setLoading,
  setError,
} = reelsSlice.actions;
```

**Actions Explained**:

- `setReels(reels)` - Set entire reels list
- `addReel(reel)` - Add new reel to beginning
- `removeReel(id)` - Remove reel by ID
- `updateReel(reel)` - Update existing reel
- `likeReel(id)` - Like a reel (increment likes, set isLiked)
- `unlikeReel(id)` - Unlike a reel (decrement likes, unset isLiked)

**Usage Example**:

```typescript
// Fetch reels
const reels = await reelsService.getReelsFeed();
dispatch(setReels(reels.data.items));

// Like a reel
dispatch(likeReel(reelId));
await reelsService.likeReel(reelId);
```

---

### 6. `apps/gully-fame-mobile/src/contexts/AuthContext.tsx`

**Purpose**: Authentication context for managing user tokens and login/logout

**Code**:

```typescript
type AuthContextType = {
  token: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check token on app start
  useEffect(() => {
    AsyncStorage.getItem("authToken").then((t) => {
      setToken(t);
      setIsLoading(false);
    });
  }, []);

  const login = async (newToken: string) => {
    setToken(newToken);
  };

  const logout = async () => {
    // Clear all user data from AsyncStorage
    await AsyncStorage.multiRemove([
      "authToken",
      "isLoggedIn",
      "userRole",
      "userEmail",
      "userFirstName",
      "userLastName",
      "userMobile",
      "profileCompleted",
      "userId",
      "accountCreatedVia",
    ]);
    await setAuthToken(""); // Clear axios header
    setToken(null); // Trigger redirect to login
  };

  return (
    <AuthContext.Provider value={{ token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

**Key Points**:

- Loads token from AsyncStorage on app start
- Provides login/logout functions
- Used by AuthGate to redirect users
- Token automatically added to all API requests

**Usage Example**:

```typescript
const { token, isLoading, login, logout } = useAuth();

// After successful login
await login(responseToken);

// On logout
await logout();
```

---

### 7. `apps/gully-fame-mobile/src/api/services/authService.ts`

**Purpose**: Authentication API service

**Key Functions**:

```typescript
// Register new user
export async function register(data: RegisterRequest): Promise<ApiResponse<RegisterResponse>>;

// Verify OTP
export async function verifyOtp(data: VerifyOtpRequest): Promise<ApiResponse<VerifyOtpResponse>>;

// Login user
export async function login(data: LoginRequest): Promise<ApiResponse<LoginResponse>>;

// Get user profile
export async function getUserProfile(): Promise<ApiResponse<GetUserProfileResponse>>;

// Update user profile
export async function updateProfile(
  data: UpdateProfileRequest
): Promise<ApiResponse<UpdateProfileResponse>>;

// Reset password
export async function resetPassword(
  data: ResetPasswordRequest
): Promise<ApiResponse<ResetPasswordResponse>>;

// Social login (Google/Apple)
export async function socialLogin(
  data: SocialLoginRequest
): Promise<ApiResponse<SocialLoginResponse>>;
```

**Example Usage**:

```typescript
// Register
const result = await authService.register({
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  mobile: "9876543210",
  password: "password123",
  role: "participants",
});

if (result.success) {
  const { token, user } = result.data;
  await login(token);
  dispatch(setUser(user));
}

// Login
const loginResult = await authService.login({
  userId: "email@example.com",
  viaPassword: true,
  password: "password123",
});
```

---

### 8. `apps/gully-fame-mobile/src/api/services/reelsService.ts`

**Purpose**: Reels API service for video operations

**Key Functions**:

```typescript
// Get reels feed
export async function getReelsFeed(params?: any): Promise<ApiResponse<ReelsResponse>>;

// Upload new reel
export async function uploadReel(formData: FormData): Promise<ApiResponse<Reel>>;

// Like a reel
export async function likeReel(reelId: string): Promise<ApiResponse<any>>;

// Unlike a reel
export async function unlikeReel(reelId: string): Promise<ApiResponse<any>>;

// Comment on reel
export async function commentOnReel(reelId: string, comment: string): Promise<ApiResponse<any>>;

// Delete reel
export async function deleteReel(reelId: string): Promise<ApiResponse<any>>;
```

**Example Usage**:

```typescript
// Fetch reels
const result = await reelsService.getReelsFeed({ page: 1, limit: 10 });
if (result.success) {
  dispatch(setReels(result.data.items));
}

// Upload reel
const formData = new FormData();
formData.append("video", videoFile);
formData.append("title", "My Reel");
formData.append("description", "Description");

const uploadResult = await reelsService.uploadReel(formData);
if (uploadResult.success) {
  dispatch(addReel(uploadResult.data));
}

// Like reel
await reelsService.likeReel(reelId);
dispatch(likeReel(reelId));
```

---

## 🖥️ ADMIN PANEL FILES

### 1. `apps/gully-fame-admin/app/layout.tsx`

**Purpose**: Root layout for admin panel

**Code**:

```typescript
import type { Metadata } from 'next'
import './globals.css'
import AuthGuard from '@/components/AuthGuard'

export const metadata: Metadata = {
  title: 'Gully Fame Admin Dashboard',
  description: 'Admin and Sponsor Dashboard for Gully Fame',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  )
}
```

**Key Points**:

- Wraps all pages with AuthGuard
- Sets metadata for SEO
- Imports global CSS

---

### 2. `apps/gully-fame-admin/components/AuthGuard.tsx`

**Purpose**: Authentication wrapper for protected routes

**Code**:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated as hasStoredToken, getCurrentAdmin } from '@/lib/authApi';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      setIsChecking(true);

      // Allow login page without auth
      if (pathname === '/login') {
        if (!cancelled) {
          setIsAuthed(false);
          setIsChecking(false);
        }
        return;
      }

      // Check if token exists
      const hasToken = hasStoredToken();
      if (!hasToken) {
        if (!cancelled) {
          setIsAuthed(false);
          setIsChecking(false);
          router.replace('/login');
        }
        return;
      }

      // Verify token is still valid
      const result = await getCurrentAdmin();
      if (cancelled) return;

      if (result.success) {
        setIsAuthed(true);
        setIsChecking(false);
      } else {
        setIsAuthed(false);
        setIsChecking(false);
        router.replace('/login');
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow login page
  if (pathname === '/login' && !isAuthed) {
    return <>{children}</>;
  }

  // Redirect authenticated users away from login
  if (pathname === '/login' && isAuthed) {
    return null;
  }

  // Block unauthenticated access to protected pages
  if (!isAuthed && pathname !== '/login') {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}
```

**Logic Flow**:

1. Check if user is on login page → allow without auth
2. Check if token exists in localStorage
3. Verify token is valid by calling getCurrentAdmin()
4. If valid → show content
5. If invalid → redirect to login

---

### 3. `apps/gully-fame-admin/components/DashboardLayout.tsx`

**Purpose**: Main layout wrapper with sidebar and header

**Code**:

```typescript
'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { getUserRole, UserRole } from '@/lib/auth';

const MobileMenuContext = createContext<{
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}>({
  mobileMenuOpen: false,
  setMobileMenuOpen: () => {},
});

export const useMobileMenu = () => useContext(MobileMenuContext);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const role = getUserRole();
    if (role) {
      setUserRole(role);
    }
  }, []);

  return (
    <MobileMenuContext.Provider value={{ mobileMenuOpen, setMobileMenuOpen }}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar - hidden on mobile */}
        {isMounted ? (
          <Sidebar userRole={userRole} />
        ) : (
          <div className="hidden md:block w-56 bg-gray-900"></div>
        )}

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </MobileMenuContext.Provider>
  );
}
```

**Key Features**:

- Responsive layout (sidebar hidden on mobile)
- MobileMenuContext for mobile menu state
- Header and Sidebar components
- Main content area with scrolling

---

### 4. `apps/gully-fame-admin/app/page.tsx`

**Purpose**: Dashboard page showing stats and recent activity

**Key Logic**:

```typescript
export default function Dashboard() {
  const [userRole, setUserRole] = useState<'admin' | 'sponsor'>('admin');
  const [quickStats, setQuickStats] = useState<QuickStatsResponse | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityResponse | null>(null);
  const [sponsorCompetitions, setSponsorCompetitions] = useState<Competition[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const role = getUserRole();

      if (role === 'sponsor') {
        // Fetch sponsor's competitions
        const adminData = getStoredAdmin();
        const sponsorId = adminData?._id || adminData?.id;

        if (sponsorId) {
          const result = await getCompetitions({ sponsorId });
          if (result.success) {
            setSponsorCompetitions(result.data.items);
          }
        }
      } else {
        // Fetch platform-wide stats
        const [activityResult, statsResult] = await Promise.all([
          getRecentActivity(),
          getQuickStats(),
        ]);

        if (activityResult.success) {
          setRecentActivity(activityResult.data);
        }
        if (statsResult.success) {
          setQuickStats(statsResult.data);
        }
      }
    };

    fetchDashboardData();
  }, []);

  // Render different views based on role
  return (
    <DashboardLayout>
      {userRole === 'sponsor' ? (
        // Sponsor view - show their competitions
        <SponsorDashboard competitions={sponsorCompetitions} />
      ) : (
        // Admin view - show platform stats
        <AdminDashboard stats={quickStats} activity={recentActivity} />
      )}
    </DashboardLayout>
  );
}
```

---

### 5. `apps/gully-fame-admin/lib/dashboardApi.ts`

**Purpose**: API calls for dashboard data

**Functions**:

```typescript
// Get platform statistics
export async function getQuickStats(): Promise<ApiResponse<QuickStatsResponse>>;

// Get recent activity
export async function getRecentActivity(): Promise<ApiResponse<RecentActivityResponse>>;
```

**Example**:

```typescript
const result = await getQuickStats();
if (result.success) {
  console.log("Total Users:", result.data.totalUsers);
  console.log("Total Reels:", result.data.totalReels);
  console.log("Total Competitions:", result.data.totalCompetitions);
}
```

---

### 6. `apps/gully-fame-admin/lib/competitionApi.ts`

**Purpose**: API calls for competition management

**Functions**:

```typescript
// Get competitions list
export async function getCompetitions(
  params?: any
): Promise<ApiResponse<PaginatedResponse<Competition>>>;

// Get single competition
export async function getCompetitionDetail(id: string): Promise<ApiResponse<Competition>>;

// Create competition
export async function createCompetition(
  data: CreateCompetitionRequest
): Promise<ApiResponse<Competition>>;

// Update competition
export async function updateCompetition(
  id: string,
  data: UpdateCompetitionRequest
): Promise<ApiResponse<Competition>>;

// Delete competition
export async function deleteCompetition(id: string): Promise<ApiResponse<any>>;
```

---

## ⚙️ CONFIGURATION FILES

### 1. `package.json` (Root)

**Purpose**: Workspace configuration and root scripts

**Key Sections**:

```json
{
  "name": "cultre-boat-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "start": "turbo dev",
    "start:admin": "cd apps/gully-fame-admin && npm run dev",
    "start:mobile": "cd apps/gully-fame-mobile && npm start",
    "lint": "turbo lint",
    "clean": "turbo clean"
  }
}
```

---

### 2. `turbo.json`

**Purpose**: Monorepo build orchestration

**Key Config**:

```json
{
  "globalDependencies": ["**/.env.local", "**/.env"],
  "globalEnv": ["NODE_ENV"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": [],
      "cache": false
    }
  }
}
```

---

### 3. `apps/gully-fame-mobile/metro.config.js`

**Purpose**: Metro bundler configuration for React Native

**Key Config**:

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
```

---

### 4. `apps/gully-fame-mobile/babel.config.js`

**Purpose**: Babel configuration for module resolution

**Key Config**:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
          alias: {
            "@": "./src",
            "@api": "./src/api",
            "@components": "./src/components",
            "@contexts": "./src/contexts",
            "@store": "./src/store",
            "@types": "./src/types",
            "@utils": "./src/utils",
          },
        },
      ],
    ],
  };
};
```

---

## 🔄 Data Flow Examples

### Example 1: User Login Flow

```
1. User enters email/password on login screen
2. authService.login() called
3. POST /auth/login sent via axios
4. Backend returns token + user data
5. Token saved to AsyncStorage
6. setAuthToken() updates axios header
7. AuthContext.login() called
8. Redux dispatch(setUser(userData))
9. User redirected to home screen
10. All subsequent requests include token in header
```

### Example 2: Reel Upload Flow

```
1. User selects video from gallery
2. Video sent to video editor
3. User edits and confirms
4. FormData created with video + metadata
5. reelsService.uploadReel(formData) called
6. POST /reels/upload sent
7. Backend processes video with FFmpeg
8. Response returns new reel data
9. Redux dispatch(addReel(newReel))
10. Reel appears in user's profile and feed
```

### Example 3: Admin Dashboard Load Flow

```
1. Admin navigates to dashboard
2. AuthGuard checks token validity
3. Dashboard page loads
4. getUserRole() returns 'admin'
5. getQuickStats() and getRecentActivity() called
6. API returns platform statistics
7. Data set in state
8. StatCards rendered with data
9. Real-time updates via polling
```

---

## 📊 Summary Table

| File                  | Purpose          | Key Functions             |
| --------------------- | ---------------- | ------------------------- |
| `app/_layout.tsx`     | Root layout      | Font loading, providers   |
| `axios.ts`            | API config       | Interceptors, token mgmt  |
| `store/index.tsx`     | Redux store      | Store config              |
| `userSlice.ts`        | User state       | setUser, clearUser        |
| `reelsSlice.ts`       | Reels state      | Like, unlike, add, remove |
| `AuthContext.tsx`     | Auth state       | login, logout, token      |
| `authService.ts`      | Auth API         | register, login, profile  |
| `reelsService.ts`     | Reels API        | Upload, like, comment     |
| `layout.tsx` (admin)  | Admin layout     | AuthGuard wrapper         |
| `AuthGuard.tsx`       | Auth check       | Token validation          |
| `DashboardLayout.tsx` | Dashboard layout | Sidebar, header           |
| `page.tsx` (admin)    | Dashboard        | Stats display             |
| `dashboardApi.ts`     | Dashboard API    | Stats, activity           |
| `competitionApi.ts`   | Competition API  | CRUD operations           |

---

**Document Generated**: May 15, 2026
**Last Updated**: By Kiro AI
