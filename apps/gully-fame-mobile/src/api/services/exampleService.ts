import apiClient from '../axios';
import { ApiResponse, PaginatedResponse } from '../types';

export const getPublicData = async () => {
  const response = await apiClient.get<ApiResponse>('/public/data', {
    skipAuth: true,
  });
  return response.data;
};

export const getProfile = async () => {
  const response = await apiClient.get<ApiResponse>('/users/profile');
  return response.data;
};

export const createPost = async (postData: { title: string; content: string }) => {
  const response = await apiClient.post<ApiResponse>('/posts', postData);
  return response.data;
};

export const getCompetitions = async (page: number = 1, limit: number = 10) => {
  const response = await apiClient.get<PaginatedResponse>('/competitions', {
    params: { page, limit },
  });
  return response.data;
};

export const deleteItem = async (id: string) => {
  try {
    const response = await apiClient.delete<ApiResponse>(`/items/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to delete item:', error.message);
    throw error;
  }
};

