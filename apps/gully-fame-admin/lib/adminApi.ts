export type { ApiResponse } from "./apiTypes";
export type { Banner } from "./bannerApi";
export type { Category } from "./categoryApi";
export type { LogoResponse, SplashResponse } from "./brandingApi";

export { createBanner, getBanners, getBanner, updateBanner, deleteBanner } from "./bannerApi";

export { createCategory, getCategories, deleteCategory } from "./categoryApi";

export { uploadLogo, uploadSplash as uploadSplashScreen, getLogo, getSplash } from "./brandingApi";

export {
  getRecentActivity,
  getQuickStats,
  dashboardApi,
  type RecentActivityResponse,
  type QuickStatsResponse,
  type NewUser,
  type LatestCompetition,
  type ContestJoined,
  type NewCompetitionHeld,
} from "./dashboardApi";

export {
  getUsers,
  getUserById,
  updateUserStatus,
  resetUserPassword,
  getUserKyc,
  updateUserKyc,
  getUserEarnings,
  userApi,
  type User,
  type UserDetail,
  type UserListParams,
  type UserListResponse,
  type KycStatus,
  type UserEarningsResponse,
} from "./userApi";
