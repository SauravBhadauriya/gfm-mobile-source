export { default as apiClient } from './axios';
export { setAuthToken, getAuthToken, removeAuthToken } from './axios';
export type {
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
  CustomApiError,
  RequestConfig,
} from './types';
export { authService } from './services/authService';
export type { 
  RegisterRequest, 
  RegisterResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  LoginRequest,
  LoginResponse,
  SocialLoginRequest,
  SocialLoginResponse,
  GetUserProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from './services/authService';
export { appBrandingService } from './services/appBrandingService';
export type {
  LogoResponse,
  OnboardingScreen,
  SplashOnboardingResponse,
  SplashResponse,
} from './services/appBrandingService';
export { adminService } from './services/adminService';
export type {
  DashboardRecentActivity,
  DashboardQuickStats,
  AdminUser,
  Competition,
  Sponsor,
  Earnings,
  Winner,
  Report,
  Reel,
} from './services/adminService';
export { paymentService } from './services/paymentService';
export type {
  PaymentOrderData,
  PaymentResponse,
  PaymentError,
  InitiatePaymentParams,
  PaymentResult,
  RazorpayOptions,
} from './services/paymentService';
export {
  initiateRazorpayPayment,
  handlePaymentError,
  extractAmountFromString,
  convertRupeesToPaise,
  formatAmount,
} from './services/paymentService';

