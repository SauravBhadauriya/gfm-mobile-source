// import type { ReelsResponse } from '../../types/reels';

// export interface GetUserReelsParams {
//   page?: number;
//   limit?: number;
// }

// export const getUserReels = async (
//   params: GetUserReelsParams = {}
// ): Promise<ReelsResponse> => {
//   const { page = 1, limit = 10 } = params;

//   throw new Error(
//     `Reels API not ready yet. Expected endpoint: GET /v1/api/user/reels?page=${page}&limit=${limit}`
//   );
// };


// this code given by kiro

import apiClient from '../axios';
import { ApiResponse } from '../types';

export interface Reel {
  _id: string;
  id?: string;
  userId: string;
  title?: string;
  description?: string;
  videoUrl: string;
  thumbnail?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface ReelsResponse {
  items: Reel[];
  total?: number;
}

// Get Reels Feed
export async function getReelsFeed(params?: any): Promise<ApiResponse<ReelsResponse>> {
  try {
    console.log('[reelsService] GET Reels Feed');
    
    const response = await apiClient.get<any>('reels', { params });
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      let reels: Reel[] = [];
      
      if (Array.isArray(responseData.data)) {
        reels = responseData.data;
      } else if (Array.isArray(responseData.data.items)) {
        reels = responseData.data.items;
      } else if (Array.isArray(responseData.data.reels)) {
        reels = responseData.data.reels;
      }

      return {
        success: true,
        data: { items: reels, total: reels.length },
        message: responseData.message || 'Reels fetched successfully',
      };
    }

    return {
      success: false,
      message: responseData.message || 'Failed to fetch reels',
      error: 'API returned unsuccessful response',
      data: { items: [], total: 0 },
    };
  } catch (error: any) {
    console.error('[reelsService] GET Reels Feed error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: { items: [], total: 0 },
    };
  }
}

// Get Reel by ID
export async function getReelById(reelId: string): Promise<ApiResponse<Reel>> {
  try {
    console.log('[reelsService] GET Reel By ID', { reelId });
    
    const response = await apiClient.get<any>(`reels/${reelId}`);
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const reel: Reel = responseData.data.reel || responseData.data;

      return {
        success: true,
        data: reel,
        message: responseData.message || 'Reel fetched successfully',
      };
    }

    return {
      success: false,
      message: responseData.message || 'Failed to fetch reel',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[reelsService] GET Reel By ID error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

// Like Reel
export async function likeReel(reelId: string): Promise<ApiResponse<any>> {
  try {
    console.log('[reelsService] LIKE Reel', { reelId });
    
    const response = await apiClient.post<any>(`reels/${reelId}/like`, {});
    const responseData = response.data as any;

    if (responseData.code === 1) {
      return {
        success: true,
        data: responseData.data,
        message: responseData.message || 'Reel liked successfully',
      };
    }

    return {
      success: false,
      message: responseData.message || 'Failed to like reel',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[reelsService] LIKE Reel error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

// Unlike Reel
export async function unlikeReel(reelId: string): Promise<ApiResponse<any>> {
  try {
    console.log('[reelsService] UNLIKE Reel', { reelId });
    
    const response = await apiClient.post<any>(`reels/${reelId}/unlike`, {});
    const responseData = response.data as any;

    if (responseData.code === 1) {
      return {
        success: true,
        data: responseData.data,
        message: responseData.message || 'Reel unliked successfully',
      };
    }

    return {
      success: false,
      message: responseData.message || 'Failed to unlike reel',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[reelsService] UNLIKE Reel error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

// Comment on Reel
export async function commentReel(reelId: string, comment: string): Promise<ApiResponse<any>> {
  try {
    console.log('[reelsService] COMMENT Reel', { reelId, comment });
    
    const response = await apiClient.post<any>(`reels/${reelId}/comment`, { comment });
    const responseData = response.data as any;

    if (responseData.code === 1) {
      return {
        success: true,
        data: responseData.data,
        message: responseData.message || 'Comment added successfully',
      };
    }

    return {
      success: false,
      message: responseData.message || 'Failed to add comment',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[reelsService] COMMENT Reel error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

// Upload Reel
export async function uploadReel(formData: FormData): Promise<ApiResponse<Reel>> {
  try {
    console.log('[reelsService] UPLOAD Reel');
    
    const response = await apiClient.post<any>('reels/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const reel: Reel = responseData.data.reel || responseData.data;

      return {
        success: true,
        data: reel,
        message: responseData.message || 'Reel uploaded successfully',
      };
    }

    return {
      success: false,
      message: responseData.message || 'Failed to upload reel',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[reelsService] UPLOAD Reel error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export const reelsService = {
  getReelsFeed,
  getReelById,
  likeReel,
  unlikeReel,
  commentReel,
  uploadReel,
};
