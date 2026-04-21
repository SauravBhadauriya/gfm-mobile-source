import apiClient from '../axios';
import { ApiResponse } from '../types';

export interface LogoResponse {
  logoUrl: string;
}

export interface OnboardingScreen {
  screenNumber: number;
  backgroundImageUrl: string;
  title: string;
  subtitle: string;
}

export interface SplashOnboardingResponse {
  logoUrl: string;
  splashScreens?: OnboardingScreen[];
  onboardingScreens?: OnboardingScreen[];
}

export interface SplashResponse {
  splashScreens?: Array<{
    id: number;
    imageUrl: string;
  }>;
  images?: string[];
  splashImageUrl?: string;
  backgroundImageUrl?: string;
}

export async function getLogo(): Promise<ApiResponse<LogoResponse>> {
  const endpoint = 'public/logo';

  try {
    const response = await apiClient.get<ApiResponse<LogoResponse>>(endpoint, {
      skipAuth: true,
    });

    const responseData = response.data as any;
    
    if (responseData.code === 1 && responseData.data) {
      if (typeof responseData.data === 'string') {
        return {
          success: true,
          data: { logoUrl: responseData.data },
          message: responseData.message || 'Logo fetched successfully',
        };
      }
      if (responseData.data.logoUrl) {
        return {
          success: true,
          data: responseData.data,
          message: responseData.message || 'Logo fetched successfully',
        };
      }
    }
    
    if (responseData.success && responseData.data) {
      if (typeof responseData.data === 'string') {
        return {
          success: true,
          data: { logoUrl: responseData.data },
          message: responseData.message || 'Logo fetched successfully',
        };
      }
      return {
        success: true,
        data: responseData.data,
        message: responseData.message,
      };
    }
    
    if (responseData.logoUrl) {
      return {
        success: true,
        data: { logoUrl: responseData.logoUrl },
        message: 'Logo fetched successfully',
      };
    }
    
    if (responseData.data?.logoUrl) {
      return {
        success: true,
        data: responseData.data,
        message: responseData.message || 'Logo fetched successfully',
      };
    }

    return {
      success: false,
      message: responseData.message || 'Failed to fetch logo',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[appBrandingService] getLogo error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getSplash(): Promise<ApiResponse<SplashResponse>> {
  const endpoint = 'public/splash';

  try {
    const response = await apiClient.get<ApiResponse<SplashResponse>>(endpoint, {
      skipAuth: true,
    });

    const responseData = response.data as any;
    
    if (responseData.code === 1 && responseData.data) {
      if (Array.isArray(responseData.data) && responseData.data.length > 0) {
        return {
          success: true,
          data: {
            splashImageUrl: responseData.data[0],
            images: responseData.data,
          },
          message: responseData.message || 'Splash fetched successfully',
        };
      }
      if (typeof responseData.data === 'string') {
        return {
          success: true,
          data: {
            splashImageUrl: responseData.data,
          },
          message: responseData.message || 'Splash fetched successfully',
        };
      }
      if (responseData.data.splashImageUrl || responseData.data.backgroundImageUrl) {
        return {
          success: true,
          data: responseData.data,
          message: responseData.message || 'Splash fetched successfully',
        };
      }
    }
    
    if (responseData.success && responseData.data) {
      if (Array.isArray(responseData.data) && responseData.data.length > 0) {
        return {
          success: true,
          data: {
            splashImageUrl: responseData.data[0],
            images: responseData.data,
          },
          message: responseData.message || 'Splash fetched successfully',
        };
      }
      return {
        success: true,
        data: responseData.data,
        message: responseData.message,
      };
    }
    
    if (responseData.splashImageUrl || responseData.backgroundImageUrl) {
      return {
        success: true,
        data: {
          splashImageUrl: responseData.splashImageUrl || responseData.backgroundImageUrl,
        },
        message: 'Splash fetched successfully',
      };
    }
    
    if (responseData.data?.splashImageUrl || responseData.data?.backgroundImageUrl) {
      return {
        success: true,
        data: responseData.data,
        message: responseData.message || 'Splash fetched successfully',
      };
    }

    return {
      success: false,
      message: responseData.message || 'Failed to fetch splash images',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[appBrandingService] getSplash error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getSplashOnboarding(): Promise<ApiResponse<SplashOnboardingResponse>> {
  const endpoint = 'app-config/splash-onboarding';

  try {
    const response = await apiClient.get<ApiResponse<SplashOnboardingResponse>>(endpoint);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    }

    return {
      success: false,
      message: response.data.message || 'Failed to fetch splash and onboarding content',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[appBrandingService] getSplashOnboarding error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getOnboarding(): Promise<ApiResponse<OnboardingScreen[]>> {
  const endpoint = 'app-config/onboarding';

  try {
    const response = await apiClient.get<ApiResponse<OnboardingScreen[]>>(endpoint);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    }

    return {
      success: false,
      message: response.data.message || 'Failed to fetch onboarding content',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[appBrandingService] getOnboarding error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export const appBrandingService = {
  getLogo,
  getSplash,
  getSplashOnboarding,
  getOnboarding,
};
