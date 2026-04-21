import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Get base URL from env, with fallback to localhost
export let BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// If BASE_URL is pointing to the old server or not set, use localhost
if (!BASE_URL) {
  BASE_URL = "http://localhost:3552/v1/api/";
  console.warn(
    "[axios] Using localhost as base URL. To change, set EXPO_PUBLIC_API_BASE_URL in .env",
  );
}

const TOKEN_STORAGE_KEY = "authToken";

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      if (!config.skipAuth) {
        const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    } catch (error) {
      console.warn("[axios] Failed to retrieve token:", error);
      return config;
    }
  },
  (error: AxiosError) => {
    console.error("[axios] Request error:", error.message);
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only remove auth tokens on 401 if this was an authenticated request
    // Public endpoints (skipAuth: true) should not trigger logout
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.skipAuth
    ) {
      originalRequest._retry = true;
      try {
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        await AsyncStorage.removeItem("isLoggedIn");
        console.warn("[axios] Unauthorized: Token expired, user logged out");
      } catch (storageError) {
        console.error("[axios] Failed to clear storage:", storageError);
      }
    } else if (error.response?.status === 401 && originalRequest.skipAuth) {
      // Public endpoint returned 401 - don't log out, just log a warning
      if (__DEV__) {
        console.warn(
          "[axios] Public endpoint returned 401, but not logging out user",
        );
      }
    }

    if (error.response?.status === 403) {
      console.warn("[axios] Forbidden: Access denied");
    }

    if (error.response?.status === 404) {
      console.warn("[axios] Not Found:", error.config?.url);
    }

    if (error.response?.status === 500) {
      console.error("[axios] Server Error");
    }

    if (!error.response) {
      // Network errors are expected when API server is down - use warning instead of error
      // Only log once per session to avoid spam
      if (__DEV__) {
        console.warn(
          "[axios] Network Error (using fallback data):",
          error.message || "Unable to connect to server",
        );
      }

      let networkErrorMessage = "Network error: Unable to connect to server.";
      if (error.code === "ECONNREFUSED") {
        networkErrorMessage =
          "Cannot connect to server. The backend server may be down.";
      } else if (
        error.code === "ETIMEDOUT" ||
        error.message?.includes("timeout")
      ) {
        networkErrorMessage =
          "Connection timeout. The backend server is not responding.";
      } else if (error.message?.includes("Network request failed")) {
        networkErrorMessage =
          "Network request failed. Please check your internet connection.";
      } else if (error.code === "ENOTFOUND") {
        networkErrorMessage =
          "Server not found. Please verify the backend URL is correct.";
      }

      return Promise.reject({
        message: networkErrorMessage,
        status: null,
        data: null,
        originalError: error,
        isNetworkError: true,
      });
    }

    const errorData = error.response?.data as any;
    return Promise.reject({
      message: errorData?.message || error.message || "An error occurred",
      status: error.response?.status || null,
      data: errorData || null,
      originalError: error,
      isNetworkError: false,
    });
  },
);

export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    console.error("[axios] Failed to store auth token:", error);
    throw error;
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    return token;
  } catch (error) {
    console.error("[axios] Failed to retrieve auth token:", error);
    return null;
  }
};

export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error("[axios] Failed to remove auth token:", error);
    throw error;
  }
};

export default apiClient;
