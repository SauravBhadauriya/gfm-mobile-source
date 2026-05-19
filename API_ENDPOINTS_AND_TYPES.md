# 🔌 API Endpoints & Data Types Reference

## 📋 Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Reels Endpoints](#reels-endpoints)
3. [Competition Endpoints](#competition-endpoints)
4. [User Endpoints](#user-endpoints)
5. [Payment Endpoints](#payment-endpoints)
6. [Data Types & Interfaces](#data-types--interfaces)

---

## 🔐 Authentication Endpoints

### Base URL

```
http://103.194.228.68:3552/v1/api/
```

### 1. Register User

**Endpoint**: `POST /auth/register`

**Request**:

```typescript
{
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  password: string;
  role: "participants" | "fan";
}
```

**Response**:

```typescript
{
  success: true,
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      mobile: string;
      role: string;
    },
    token: string;
    txnId?: string;
  },
  message: "User registered successfully"
}
```

**Code Usage**:

```typescript
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
  await setAuthToken(token);
  dispatch(setUser(user));
}
```

---

### 2. Verify OTP

**Endpoint**: `POST /auth/verify-otp`

**Request**:

```typescript
{
  txnId?: string;
  mobile?: string;
  otp: number | string;
}
```

**Response**:

```typescript
{
  success: true,
  data: {
    message: string;
    token: string;
    userId: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      mobile: string;
      role: string;
    }
  }
}
```

---

### 3. Login User

**Endpoint**: `POST /auth/login`

**Request**:

```typescript
{
  userId: string;        // email or mobile
  viaPassword: boolean;
  password?: string;
}
```

**Response**:

```typescript
{
  success: true,
  data: {
    message: string;
    token: string;
    txnId?: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      mobile: string;
      role: string;
    }
  }
}
```

**Code Usage**:

```typescript
const result = await authService.login({
  userId: "john@example.com",
  viaPassword: true,
  password: "password123",
});

if (result.success) {
  const { token, user } = result.data;
  await login(token);
  dispatch(setUser(user));
}
```

---

### 4. Get User Profile

**Endpoint**: `GET /auth/profile`

**Headers**:

```
Authorization: Bearer {token}
```

**Response**:

```typescript
{
  success: true,
  data: {
    id: string;
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    mobile: string;
    role: string;
    profileImage?: string;
    gender?: string;
    dob?: string;
    isActive: boolean;
    isDeleted: boolean;
    notificationAllowed: boolean;
    googleId?: string;
    appleId?: string;
    device_token?: string;
    device_type?: string;
    createdAt: string;
    updatedAt: string;
  }
}
```

---

### 5. Update User Profile

**Endpoint**: `PUT /auth/profile`

**Headers**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:

```typescript
{
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  bio?: string;
  profileImage?: string;
  gender?: string;
  dob?: string;
  role?: string;
}
```

**Response**:

```typescript
{
  success: true,
  data: {
    message: string;
    data: UserProfile;
  }
}
```

---

### 6. Refresh Token

**Endpoint**: `POST /auth/refresh-token`

**Headers**:

```
Authorization: Bearer {token}
```

**Response**:

```typescript
{
  success: true,
  data: {
    token: string;
  }
}
```

---

## 🎬 Reels Endpoints

### 1. Get Reels Feed

**Endpoint**: `GET /feed/matrix`

**Query Parameters**:

```typescript
{
  page?: number;        // default: 1
  limit?: number;       // default: 10
  category?: string;
  userId?: string;
}
```

**Response**:

```typescript
{
  success: true,
  data: {
    items: [
      {
        _id: string;
        id?: string;
        userId: string;
        title?: string;
        description?: string;
        videoUrl: string;
        thumbnail?: string;
        likes: number;
        comments: number;
        shares: number;
        views: number;
        isLiked: boolean;
        createdAt: string;
        updatedAt: string;
      }
    ],
    total: number;
  }
}
```

**Code Usage**:

```typescript
const result = await reelsService.getReelsFeed({ page: 1, limit: 10 });
if (result.success) {
  dispatch(setReels(result.data.items));
}
```

---

### 2. Upload Reel

**Endpoint**: `POST /reels/upload`

**Headers**:

```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request** (FormData):

```typescript
{
  video: File;           // Video file
  title: string;
  description: string;
  category: string;
  thumbnail?: File;
}
```

**Response**:

```typescript
{
  success: true,
  data: {
    _id: string;
    userId: string;
    title: string;
    description: string;
    videoUrl: string;
    thumbnail: string;
    likes: 0;
    comments: 0;
    shares: 0;
    views: 0;
    isLiked: false;
    createdAt: string;
    updatedAt: string;
  }
}
```

**Code Usage**:

```typescript
const formData = new FormData();
formData.append("video", videoFile);
formData.append("title", "My Awesome Reel");
formData.append("description", "Check this out!");
formData.append("category", "dance");

const result = await reelsService.uploadReel(formData);
if (result.success) {
  dispatch(addReel(result.data));
}
```

---

### 3. Like Reel

**Endpoint**: `POST /reels/{reelId}/like`

**Headers**:

```
Authorization: Bearer {token}
```

**Response**:

```typescript
{
  success: true,
  data: {
    message: "Reel liked successfully";
    likes: number;
  }
}
```

**Code Usage**:

```typescript
await reelsService.likeReel(reelId);
dispatch(likeReel(reelId));
```

---

### 4. Unlike Reel

**Endpoint**: `DELETE /reels/{reelId}/like`

**Headers**:

```
Authorization: Bearer {token}
```

**Response**:

```typescript
{
  success: true,
  data: {
    message: "Reel unliked successfully";
    likes: number;
  }
}
```

---

### 5. Comment on Reel

**Endpoint**: `POST /reels/{reelId}/comments`

**Headers**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:

```typescript
{
  text: string;
}
```

**Response**:

```typescript
{
  success: true,
  data: {
    _id: string;
    reelId: string;
    userId: string;
    text: string;
    likes: 0;
    createdAt: string;
    updatedAt: string;
  }
}
```

---

### 6. Delete Reel

**Endpoint**: `DELETE /reels/{reelId}`

**Headers**:

```
Authorization: Bearer {token}
```

**Response**:

```typescript
{
  success: true,
  data: {
    message: "Reel deleted successfully";
  }
}
```

---

## 🏆 Competition Endpoints

### 1. Get Competitions List

**Endpoint**: `GET /competitions`

**Query Parameters**:

```typescript
{
  page?: number;
  limit?: number;
  status?: "LIVE" | "UPCOMING" | "COMPLETED";
  sponsorId?: string;
  category?: string;
}
```

**Response**:

```typescript
{
  success: true,
  data: {
    items: [
      {
        _id: string;
        id?: string;
        title: string;
        description: string;
        category: string;
        status: "LIVE" | "UPCOMING" | "COMPLETED";
        startDate: string;
        endDate: string;
        prizePool: number;
        participants: number;
        entries: number;
        sponsorId: string;
        rules?: string;
        createdAt: string;
        updatedAt: string;
      }
    ],
    total: number;
  }
}
```

**Code Usage**:

```typescript
const result = await competitionService.getCompetitions({
  status: "LIVE",
  page: 1,
});
if (result.success) {
  dispatch(setCompetitions(result.data.items));
}
```

---

### 2. Get Competition Details

**Endpoint**: `GET /competitions/{competitionId}`

**Response**:

```typescript
{
  success: true,
  data: {
    _id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    startDate: string;
    endDate: string;
    prizePool: number;
    participants: number;
    entries: number;
    sponsorId: string;
    rules: string;
    leaderboard: [
      {
        rank: number;
        userId: string;
        userName: string;
        score: number;
        entries: number;
      }
    ],
    createdAt: string;
    updatedAt: string;
  }
}
```

---

### 3. Join Competition

**Endpoint**: `POST /competitions/{competitionId}/join`

**Headers**:

```
Authorization: Bearer {token}
```

**Response**:

```typescript
{
  success: true,
  data: {
    message: "Successfully joined competition";
    competitionId: string;
    userId: string;
  }
}
```

---

### 4. Submit Entry

**Endpoint**: `POST /competitions/{competitionId}/entries`

**Headers**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:

```typescript
{
  reelId: string;
  title?: string;
  description?: string;
}
```

**Response**:

```typescript
{
  success: true,
  data: {
    _id: string;
    competitionId: string;
    userId: string;
    reelId: string;
    score: number;
    status: "SUBMITTED" | "APPROVED" | "REJECTED";
    createdAt: string;
  }
}
```

---

## 👤 User Endpoints

### 1. Get User Profile

**Endpoint**: `GET /users/{userId}`

**Response**:

```typescript
{
  success: true,
  data: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    profileImage: string;
    bio: string;
    followers: number;
    following: number;
    totalReels: number;
    totalLikes: number;
    isFollowing: boolean;
    createdAt: string;
  }
}
```

---

### 2. Follow User

**Endpoint**: `POST /users/{userId}/follow`

**Headers**:

```
Authorization: Bearer {token}
```

**Response**:

```typescript
{
  success: true,
  data: {
    message: "User followed successfully";
    followers: number;
  }
}
```

---

### 3. Unfollow User

**Endpoint**: `DELETE /users/{userId}/follow`

**Headers**:

```
Authorization: Bearer {token}
```

**Response**:

```typescript
{
  success: true,
  data: {
    message: "User unfollowed successfully";
    followers: number;
  }
}
```

---

## 💳 Payment Endpoints

### 1. Create Payment Order

**Endpoint**: `POST /payments/create-order`

**Headers**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:

```typescript
{
  amount: number; // in paise (e.g., 10000 = ₹100)
  currency: "INR";
  description: string;
  userId: string;
}
```

**Response**:

```typescript
{
  success: true,
  data: {
    orderId: string;
    amount: number;
    currency: string;
    key: string;           // Razorpay key
    email: string;
    contact: string;
  }
}
```

---

### 2. Verify Payment

**Endpoint**: `POST /payments/verify`

**Headers**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:

```typescript
{
  orderId: string;
  paymentId: string;
  signature: string;
}
```

**Response**:

```typescript
{
  success: true,
  data: {
    message: "Payment verified successfully";
    transactionId: string;
    amount: number;
    status: "SUCCESS";
  }
}
```

---

## 📊 Data Types & Interfaces

### User Type

```typescript
interface User {
  id: string;
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile: string;
  role: "participants" | "fan" | "admin" | "sponsor";
  profileImage?: string;
  gender?: string;
  dob?: string;
  isActive: boolean;
  isDeleted: boolean;
  notificationAllowed: boolean;
  googleId?: string;
  appleId?: string;
  device_token?: string;
  device_type?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Reel Type

```typescript
interface Reel {
  _id: string;
  id?: string;
  userId: string;
  title?: string;
  description?: string;
  videoUrl: string;
  thumbnail?: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}
```

### Competition Type

```typescript
interface Competition {
  _id: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  status: "LIVE" | "UPCOMING" | "COMPLETED";
  startDate: string;
  endDate: string;
  prizePool: number;
  participants: number;
  entries: number;
  sponsorId: string;
  rules?: string;
  leaderboard?: LeaderboardEntry[];
  createdAt: string;
  updatedAt: string;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  score: number;
  entries: number;
}
```

### API Response Type

```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  code?: number;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}
```

---

## 🔄 Common Error Responses

### 400 Bad Request

```typescript
{
  success: false,
  error: "Invalid request parameters",
  errors: {
    email: ["Email is required"],
    password: ["Password must be at least 8 characters"]
  }
}
```

### 401 Unauthorized

```typescript
{
  success: false,
  error: "Unauthorized",
  message: "Token expired or invalid"
}
```

### 403 Forbidden

```typescript
{
  success: false,
  error: "Forbidden",
  message: "You don't have permission to access this resource"
}
```

### 404 Not Found

```typescript
{
  success: false,
  error: "Not found",
  message: "Resource not found"
}
```

### 500 Server Error

```typescript
{
  success: false,
  error: "Internal server error",
  message: "Something went wrong on the server"
}
```

---

## 📝 Example API Calls

### Complete Login Flow

```typescript
// 1. Login
const loginResult = await authService.login({
  userId: "john@example.com",
  viaPassword: true,
  password: "password123",
});

if (!loginResult.success) {
  console.error("Login failed:", loginResult.error);
  return;
}

// 2. Save token
const { token, user } = loginResult.data;
await setAuthToken(token);

// 3. Update Redux
dispatch(setUser(user));

// 4. Save to AsyncStorage
await AsyncStorage.setItem("authToken", token);
await AsyncStorage.setItem("userId", user.id);

// 5. Update AuthContext
await login(token);
```

### Complete Reel Upload Flow

```typescript
// 1. Create FormData
const formData = new FormData();
formData.append("video", videoFile);
formData.append("title", "My Reel");
formData.append("description", "Check this out!");
formData.append("category", "dance");

// 2. Upload
dispatch(setLoading(true));
const result = await reelsService.uploadReel(formData);
dispatch(setLoading(false));

if (!result.success) {
  dispatch(setError(result.error));
  return;
}

// 3. Update Redux
dispatch(addReel(result.data));

// 4. Show success
Alert.alert("Success", "Reel uploaded successfully!");
```

---

**Document Generated**: May 15, 2026
**Last Updated**: By Kiro AI
