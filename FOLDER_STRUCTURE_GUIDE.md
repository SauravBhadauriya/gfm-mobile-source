# 📁 Complete Folder Structure & File Guide

## 🎯 Overview

Ye document poore project ka folder structure explain karta hai with har file ka purpose.

---

## 📱 MOBILE APP STRUCTURE

```
apps/gully-fame-mobile/
├── app/                           # Expo Router file-based routing
│   ├── _layout.tsx               # Root layout with providers
│   ├── index.tsx                 # Splash/initial screen
│   ├── auth/
│   │   ├── _layout.tsx           # Auth stack layout
│   │   ├── signin.tsx            # Login screen
│   │   ├── signup.tsx            # Registration screen
│   │   └── otp.tsx               # OTP verification screen
│   ├── onboarding/
│   │   ├── _layout.tsx
│   │   └── index.tsx             # Onboarding screens
│   └── (main)/                   # Main app screens (tab navigation)
│       ├── _layout.tsx           # Bottom tab navigator
│       ├── home/
│       │   ├── _layout.tsx
│       │   └── index.tsx         # Home feed screen
│       ├── reel/
│       │   ├── _layout.tsx
│       │   ├── index.tsx         # Reel viewing screen
│       │   └── [id].tsx          # Individual reel detail
│       ├── search/
│       │   ├── _layout.tsx
│       │   └── index.tsx         # Search screen
│       ├── profile/
│       │   ├── _layout.tsx
│       │   ├── index.tsx         # User profile screen
│       │   └── [id].tsx          # Other user's profile
│       ├── community/
│       │   ├── _layout.tsx
│       │   └── index.tsx         # Community features
│       ├── inbox/
│       │   ├── _layout.tsx
│       │   └── index.tsx         # Messages/notifications
│       ├── settings/
│       │   ├── _layout.tsx
│       │   └── index.tsx         # App settings
│       ├── competitions/
│       │   ├── _layout.tsx
│       │   ├── index.tsx         # Competitions list
│       │   └── [id].tsx          # Competition details
│       ├── camera/
│       │   ├── _layout.tsx
│       │   └── index.tsx         # Camera screen
│       ├── upload/
│       │   ├── _layout.tsx
│       │   └── index.tsx         # Reel upload screen
│       └── [other screens]/
│
├── src/
│   ├── api/                      # API services layer
│   │   ├── axios.ts              # Axios instance with interceptors
│   │   ├── types.ts              # API response types
│   │   ├── index.ts              # Barrel export
│   │   └── services/
│   │       ├── authService.ts    # Authentication API
│   │       ├── reelsService.ts   # Reels API
│   │       ├── competitionService.ts
│   │       ├── userService.ts
│   │       ├── paymentService.ts
│   │       ├── notificationService.ts
│   │       ├── chatService.ts
│   │       ├── categoryService.ts
│   │       ├── bannerService.ts
│   │       ├── commentService.ts
│   │       ├── followService.ts
│   │       ├── searchService.ts
│   │       ├── cameraService.ts
│   │       ├── kycService.ts
│   │       ├── videoEditorService.ts
│   │       └── cmsService.ts
│   │
│   ├── components/               # Reusable components
│   │   ├── ReelCard.tsx          # Reel display card
│   │   ├── CompetitionCard.tsx   # Competition card
│   │   ├── UserCard.tsx          # User profile card
│   │   ├── Button.tsx            # Custom button
│   │   ├── Input.tsx             # Custom input
│   │   ├── Modal.tsx             # Modal component
│   │   ├── Loading.tsx           # Loading spinner
│   │   ├── Error.tsx             # Error display
│   │   ├── Header.tsx            # Header component
│   │   ├── Footer.tsx            # Footer component
│   │   ├── Navigation.tsx        # Navigation component
│   │   └── [other components]/
│   │
│   ├── contexts/                 # React Context providers
│   │   ├── AuthContext.tsx       # Authentication context
│   │   ├── BrandingContext.tsx   # App branding context
│   │   ├── UserRoleContext.tsx   # User role context
│   │   └── [other contexts]/
│   │
│   ├── store/                    # Redux store
│   │   ├── index.tsx             # Store configuration
│   │   └── slices/
│   │       ├── userSlice.ts      # User state
│   │       ├── reelsSlice.ts     # Reels state
│   │       ├── competitionsSlice.ts
│   │       ├── uiSlice.ts        # UI state
│   │       └── [other slices]/
│   │
│   ├── screens/                  # Screen components (deprecated)
│   │   ├── HomeScreen.tsx
│   │   ├── ReelScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── [other screens]/
│   │
│   ├── types/                    # TypeScript interfaces
│   │   ├── index.ts              # Main types export
│   │   ├── user.ts               # User types
│   │   ├── reel.ts               # Reel types
│   │   ├── competition.ts        # Competition types
│   │   ├── api.ts                # API types
│   │   └── [other types]/
│   │
│   ├── utils/                    # Utility functions
│   │   ├── helpers.ts            # Helper functions
│   │   ├── validators.ts         # Validation functions
│   │   ├── formatters.ts         # Data formatting
│   │   ├── constants.ts          # App constants
│   │   ├── storage.ts            # AsyncStorage helpers
│   │   └── [other utils]/
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts            # Auth hook
│   │   ├── useReels.ts           # Reels hook
│   │   ├── useUser.ts            # User hook
│   │   ├── useFetch.ts           # Data fetching hook
│   │   └── [other hooks]/
│   │
│   ├── icons/                    # Icon components
│   │   ├── HomeIcon.tsx
│   │   ├── SearchIcon.tsx
│   │   ├── ProfileIcon.tsx
│   │   └── [other icons]/
│   │
│   ├── styles/                   # Styling files
│   │   ├── colors.ts             # Color constants
│   │   ├── spacing.ts            # Spacing constants
│   │   ├── typography.ts         # Typography styles
│   │   └── [other styles]/
│   │
│   └── modules/                  # Feature modules
│       ├── videoEditor/          # Video editor module
│       │   ├── VideoEditor.tsx
│       │   ├── effects.ts
│       │   └── filters.ts
│       ├── camera/               # Camera module
│       │   ├── Camera.tsx
│       │   └── filters.ts
│       └── [other modules]/
│
├── __tests__/                    # Test files
│   ├── api/
│   ├── components/
│   ├── store/
│   └── [other tests]/
│
├── assets/                       # Static assets
│   ├── images/
│   │   ├── logo.png
│   │   ├── splash.png
│   │   └── [other images]/
│   ├── fonts/
│   ├── videos/
│   └── [other assets]/
│
├── patches/                      # Patch files for dependencies
│   └── [patch files]/
│
├── scripts/                      # Build/setup scripts
│   ├── reset-project.js
│   └── [other scripts]/
│
├── plugins/                      # Expo plugins
│   └── [plugin files]/
│
├── eas-archive-check/            # EAS build artifacts
│
├── .expo/                        # Expo cache
│
├── android/                      # Android native code
│   ├── app/
│   ├── build.gradle
│   └── [other Android files]/
│
├── ios/                          # iOS native code
│   ├── Podfile
│   └── [other iOS files]/
│
├── node_modules/                 # Dependencies
│
├── .env                          # Environment variables
├── .env.example                  # Example env file
├── .gitignore                    # Git ignore rules
├── app.json                      # Expo app config
├── eas.json                      # EAS build config
├── babel.config.js               # Babel configuration
├── metro.config.js               # Metro bundler config
├── jest.config.js                # Jest testing config
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript config
├── tailwind.config.js            # Tailwind CSS config
├── start-mobile.js               # Mobile startup script
└── README.md                     # Project documentation
```

---

## 🖥️ ADMIN PANEL STRUCTURE

```
apps/gully-fame-admin/
├── app/                          # Next.js app directory
│   ├── layout.tsx                # Root layout with AuthGuard
│   ├── page.tsx                  # Dashboard page
│   ├── globals.css               # Global styles
│   │
│   ├── login/
│   │   └── page.tsx              # Login page
│   │
│   ├── competitions/
│   │   ├── page.tsx              # Competitions list
│   │   ├── create/
│   │   │   └── page.tsx          # Create competition
│   │   └── [id]/
│   │       ├── page.tsx          # Competition details
│   │       ├── edit/
│   │       │   └── page.tsx      # Edit competition
│   │       ├── leaderboard/
│   │       │   └── page.tsx      # Leaderboard view
│   │       └── participants/
│   │           └── page.tsx      # Participants list
│   │
│   ├── users/
│   │   ├── page.tsx              # Users list
│   │   └── [id]/
│   │       ├── page.tsx          # User details
│   │       └── edit/
│   │           └── page.tsx      # Edit user
│   │
│   ├── analytics/
│   │   └── page.tsx              # Analytics dashboard
│   │
│   ├── moderation/
│   │   └── page.tsx              # Content moderation
│   │
│   ├── monetization/
│   │   └── page.tsx              # Monetization settings
│   │
│   ├── reports/
│   │   └── page.tsx              # Reports page
│   │
│   ├── reels/
│   │   ├── page.tsx              # Reels management
│   │   └── [id]/
│   │       └── page.tsx          # Reel details
│   │
│   ├── settings/
│   │   └── page.tsx              # Settings page
│   │
│   └── app-content/
│       ├── page.tsx              # App content management
│       ├── components/
│       │   ├── AboutUs.tsx
│       │   ├── AppLogo.tsx
│       │   ├── Branding.tsx
│       │   ├── Categories.tsx
│       │   ├── CompetitionRules.tsx
│       │   ├── HomeBanners.tsx
│       │   ├── PrivacyPolicy.tsx
│       │   ├── SplashScreen.tsx
│       │   └── TermsConditions.tsx
│       └── home-sections/
│           └── page.tsx
│
├── components/                   # React components
│   ├── DashboardLayout.tsx       # Main layout wrapper
│   ├── Sidebar.tsx               # Sidebar navigation
│   ├── Header.tsx                # Header component
│   ├── AuthGuard.tsx             # Authentication wrapper
│   ├── StatCard.tsx              # Statistics card
│   ├── Button.tsx                # Custom button
│   ├── Input.tsx                 # Custom input
│   ├── Modal.tsx                 # Modal component
│   ├── Table.tsx                 # Data table
│   ├── Form.tsx                  # Form component
│   ├── Loading.tsx               # Loading spinner
│   ├── Error.tsx                 # Error display
│   └── [other components]/
│
├── lib/                          # API clients & utilities
│   ├── adminApi.ts               # Barrel export for all APIs
│   ├── dashboardApi.ts           # Dashboard API calls
│   ├── userApi.ts                # User management API
│   ├── competitionApi.ts         # Competition API
│   ├── bannerApi.ts              # Banner management API
│   ├── categoryApi.ts            # Category API
│   ├── brandingApi.ts            # Branding API
│   ├── authApi.ts                # Authentication API
│   ├── auth.ts                   # Auth utilities
│   ├── utils.ts                  # Utility functions
│   ├── constants.ts              # Constants
│   └── [other APIs]/
│
├── public/                       # Static assets
│   ├── images/
│   │   ├── logo.png
│   │   └── [other images]/
│   ├── icons/
│   └── [other assets]/
│
├── .next/                        # Next.js build output
│
├── node_modules/                 # Dependencies
│
├── .env.local                    # Local environment variables
├── .env.example                  # Example env file
├── .gitignore                    # Git ignore rules
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript config
├── tailwind.config.js            # Tailwind CSS config
├── postcss.config.js             # PostCSS config
├── package.json                  # Dependencies & scripts
└── README.md                     # Project documentation
```

---

## 🎬 VIDEO EDITOR STRUCTURE

```
apps/videoeditor/
├── app/                          # Expo Router routing
│   ├── _layout.tsx               # Root layout
│   ├── index.tsx                 # Main editor screen
│   ├── effects/
│   │   └── index.tsx             # Effects selection
│   ├── filters/
│   │   └── index.tsx             # Filters selection
│   └── export/
│       └── index.tsx             # Export screen
│
├── src/
│   ├── components/               # Editor components
│   ├── utils/                    # Utility functions
│   ├── types/                    # TypeScript types
│   └── styles/                   # Styling
│
├── node_modules/                 # Dependencies
├── app.json                      # Expo config
├── package.json                  # Dependencies
└── README.md                     # Documentation
```

---

## 📦 ROOT LEVEL STRUCTURE

```
gully-fame-monorepo/
├── apps/                         # All applications
│   ├── gully-fame-mobile/
│   ├── gully-fame-admin/
│   └── videoeditor/
│
├── packages/                     # Shared packages (if any)
│
├── node_modules/                 # Root dependencies
│
├── .git/                         # Git repository
├── .github/                      # GitHub workflows
│   ├── workflows/
│   ├── CODEOWNERS
│   ├── dependabot.yml
│   ├── issue_template/
│   └── pull_request_template.md
│
├── .husky/                       # Git hooks
│   ├── commit-msg
│   └── pre-commit
│
├── .vscode/                      # VS Code settings
│
├── .babelrc                      # Babel config
├── .browserslistrc               # Browser support config
├── .commitlintrc                 # Commit lint config
├── .dockerignore                 # Docker ignore
├── .easignore                    # EAS ignore
├── .editorconfig                 # Editor config
├── .env.development              # Development env
├── .env.example                  # Example env
├── .env.local                    # Local env
├── .env.production               # Production env
├── .eslintignore                 # ESLint ignore
├── .gitattributes                # Git attributes
├── .gitignore                    # Git ignore
├── .node-version                 # Node version
├── .npmrc                        # NPM config
├── .nvmrc                        # NVM config
├── .prettierignore                # Prettier ignore
├── .prettierrc                   # Prettier config
├── .tool-versions                # Tool versions
│
├── .turbo/                       # Turbo cache
│   └── cache/
│
├── turbo.json                    # Turbo configuration
├── package.json                  # Root package.json
├── package-lock.json             # Dependency lock
├── tsconfig.json                 # TypeScript config
├── app.json                      # Expo config
├── eas.json                      # EAS build config
│
├── CODEBASE_ANALYSIS.md          # Codebase overview
├── DETAILED_FILE_BREAKDOWN.md    # File-by-file guide
├── API_ENDPOINTS_AND_TYPES.md    # API reference
├── FOLDER_STRUCTURE_GUIDE.md     # This file
├── README.md                     # Main documentation
└── LICENSE                       # License file
```

---

## 🔑 Key Files Explained

### Root Level

**package.json**

- Workspace configuration
- Root scripts (build, dev, start, lint, clean)
- Shared dependencies
- Node version requirement

**turbo.json**

- Monorepo build orchestration
- Task definitions (build, dev, lint, test)
- Caching configuration
- Global dependencies

**tsconfig.json**

- TypeScript configuration for entire monorepo
- Path aliases
- Compiler options

**app.json**

- Expo configuration
- App name, version, icon
- Plugins and experiments

**eas.json**

- EAS build configuration
- Build profiles (development, preview, production)
- Submission settings

### Mobile App

**app/\_layout.tsx**

- Root layout component
- Font loading
- Provider setup (BrandingProvider, UserRoleProvider)
- Splash screen management

**src/api/axios.ts**

- Axios instance creation
- Request/response interceptors
- Token management
- Error handling

**src/store/index.tsx**

- Redux store configuration
- Reducer combination
- Type exports

**src/contexts/AuthContext.tsx**

- Authentication state management
- Token persistence
- Login/logout functions

**metro.config.js**

- Metro bundler configuration
- Watch folders for monorepo
- Node modules paths

**babel.config.js**

- Babel configuration
- Module resolver setup
- Plugin configuration

### Admin Panel

**app/layout.tsx**

- Root layout with AuthGuard
- Metadata setup
- Global styles

**components/AuthGuard.tsx**

- Authentication check
- Token validation
- Route protection

**components/DashboardLayout.tsx**

- Main layout wrapper
- Sidebar and header
- Mobile menu context

**lib/dashboardApi.ts**

- Dashboard API calls
- Statistics fetching
- Activity fetching

**lib/competitionApi.ts**

- Competition CRUD operations
- API endpoints

---

## 📊 File Organization Principles

### Mobile App

- **app/** - Routing (Expo Router)
- **src/api/** - API layer
- **src/store/** - State management
- **src/contexts/** - Context providers
- **src/components/** - Reusable components
- **src/screens/** - Screen components (deprecated)
- **src/types/** - TypeScript types
- **src/utils/** - Helper functions
- **src/hooks/** - Custom hooks

### Admin Panel

- **app/** - Pages (Next.js)
- **components/** - React components
- **lib/** - API clients & utilities
- **public/** - Static assets

### Configuration

- **Root level** - Monorepo config
- **App level** - App-specific config
- **Environment files** - Environment variables

---

## 🔄 File Dependencies

### Mobile App Flow

```
app/_layout.tsx
  ├── Providers (BrandingProvider, UserRoleProvider)
  ├── app/auth/ (Authentication screens)
  ├── app/(main)/ (Main app screens)
  └── src/api/ (API services)
      ├── axios.ts (HTTP client)
      ├── services/ (API endpoints)
      └── types.ts (Response types)

src/store/
  ├── slices/ (Redux slices)
  └── Used by components via useSelector/useDispatch

src/contexts/
  ├── AuthContext (Token management)
  ├── BrandingContext (App branding)
  └── UserRoleContext (User role)
```

### Admin Panel Flow

```
app/layout.tsx
  └── AuthGuard (Authentication check)
      └── DashboardLayout (Main layout)
          ├── Sidebar (Navigation)
          ├── Header (Top bar)
          └── app/page.tsx (Dashboard)
              └── lib/ (API clients)
```

---

## 📝 Summary

| Folder                | Purpose             | Key Files                  |
| --------------------- | ------------------- | -------------------------- |
| `app/`                | Routing             | `_layout.tsx`, `index.tsx` |
| `src/api/`            | API services        | `axios.ts`, `services/`    |
| `src/store/`          | Redux state         | `index.tsx`, `slices/`     |
| `src/contexts/`       | Context providers   | `AuthContext.tsx`          |
| `src/components/`     | Reusable components | `*.tsx`                    |
| `src/types/`          | TypeScript types    | `*.ts`                     |
| `src/utils/`          | Helper functions    | `*.ts`                     |
| `src/hooks/`          | Custom hooks        | `*.ts`                     |
| `lib/` (admin)        | API clients         | `*Api.ts`                  |
| `components/` (admin) | React components    | `*.tsx`                    |
| `public/`             | Static assets       | Images, icons              |

---

**Document Generated**: May 15, 2026
**Last Updated**: By Kiro AI
