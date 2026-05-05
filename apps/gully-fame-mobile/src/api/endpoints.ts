/**
 * API Endpoint Constants
 * Centralized location for all API endpoints
 */

export const API_ENDPOINTS = {
  // Auth Endpoints
  AUTH: {
    LOGIN: "auth/login",
    REGISTER: "auth/register",
    VERIFY_OTP: "auth/verify-otp",
    REFRESH_TOKEN: "auth/refresh-token",
    LOGOUT: "auth/logout",
    SOCIAL_LOGIN: "auth/social-login",
  },

  // User Endpoints
  USER: {
    PROFILE: "user/profile",
    UPDATE_PROFILE: "user/profile/update",
    CHANGE_PASSWORD: "user/change-password",
    GET_COMPETITIONS: "user/competitions",
    GET_REELS: "user/reels",
    GET_FOLLOWERS: "user/followers",
    GET_FOLLOWING: "user/following",
  },

  // Competition Endpoints
  COMPETITION: {
    GET_ALL: "competitions",
    GET_BY_ID: "competitions/:id",
    GET_BY_STATUS: "competitions/status/:status",
    JOIN: "competitions/:id/join",
    LEAVE: "competitions/:id/leave",
    GET_LEADERBOARD: "competitions/:id/leaderboard",
    GET_PARTICIPANTS: "competitions/:id/participants",
  },

  // Reels Endpoints
  REELS: {
    GET_ALL: "reels",
    GET_BY_ID: "reels/:id",
    CREATE: "reels/create",
    UPDATE: "reels/:id/update",
    DELETE: "reels/:id/delete",
    LIKE: "reels/:id/like",
    UNLIKE: "reels/:id/unlike",
    GET_COMMENTS: "reels/:id/comments",
    ADD_COMMENT: "reels/:id/comments/add",
    DELETE_COMMENT: "reels/:id/comments/:commentId/delete",
  },

  // Banner Endpoints
  BANNER: {
    GET_ALL: "banners",
    GET_ACTIVE: "banners/active",
  },

  // Category Endpoints
  CATEGORY: {
    GET_ALL: "categories",
  },

  // KYC Endpoints
  KYC: {
    SUBMIT: "kyc/submit",
    GET_STATUS: "kyc/status",
    UPDATE: "kyc/update",
  },

  // Payment Endpoints
  PAYMENT: {
    INITIATE: "payment/initiate",
    VERIFY: "payment/verify",
    GET_HISTORY: "payment/history",
  },

  // Follow Endpoints
  FOLLOW: {
    FOLLOW_USER: "follow/:userId",
    UNFOLLOW_USER: "unfollow/:userId",
  },

  // Comment Endpoints
  COMMENT: {
    CREATE: "comments/create",
    DELETE: "comments/:id/delete",
    UPDATE: "comments/:id/update",
  },

  // Search Endpoints
  SEARCH: {
    SEARCH_REELS: "search/reels",
    SEARCH_USERS: "search/users",
    SEARCH_COMPETITIONS: "search/competitions",
  },

  // Notification Endpoints
  NOTIFICATION: {
    GET_ALL: "notifications",
    MARK_READ: "notifications/:id/read",
    DELETE: "notifications/:id/delete",
  },

  // Chat Endpoints
  CHAT: {
    GET_CONVERSATIONS: "chat/conversations",
    GET_MESSAGES: "chat/conversations/:id/messages",
    SEND_MESSAGE: "chat/messages/send",
  },

  // Branding Endpoints
  BRANDING: {
    GET_LOGO: "branding/logo",
    GET_SPLASH: "branding/splash",
    GET_ONBOARDING: "branding/onboarding",
  },

  // Admin Endpoints
  ADMIN: {
    DASHBOARD: "admin/dashboard",
    GET_USERS: "admin/users",
    GET_REELS: "admin/reels",
    GET_REPORTS: "admin/reports",
    GET_EARNINGS: "admin/earnings",
  },

  // Video Editor Endpoints
  VIDEO_EDITOR: {
    UPLOAD: "video-editor/upload",
    PROCESS: "video-editor/process",
    GET_STATUS: "video-editor/status/:id",
  },

  // CMS Endpoints
  CMS: {
    GET_PAGES: "cms/pages",
    GET_PAGE: "cms/pages/:slug",
  },
} as const;

export default API_ENDPOINTS;
