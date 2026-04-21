import apiClient from '../axios';
import { ApiResponse, PaginatedResponse } from '../types';

export interface DashboardRecentActivity {
  newUsersRegistered: number;
  contestsJoined: number;
  latestCompetition: any;
  totalCompleted: number;
  newCompetitionHeld: number;
}

export interface DashboardQuickStats {
  totalUsers: number;
  activeCompetition: number;
  totalReels: number;
  totalCompetition: number;
  activeSponsors: number;
  tipsGiven: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  kycStatus?: string;
  earnings?: number;
  createdAt?: string;
}

export interface Competition {
  id: string;
  title: string;
  description: string;
  status: string;
  sponsorId?: string;
  startDate?: string;
  endDate?: string;
  entryFee?: number;
  prizePool?: number;
}

export interface Sponsor {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  logo?: string;
  status?: string;
}

export interface Earnings {
  id: string;
  userId: string;
  userName?: string;
  competitionId: string;
  competitionName?: string;
  coinsWon: number;
  date: string;
}

export interface Winner {
  id: string;
  userId: string;
  userName?: string;
  competitionId: string;
  competitionName?: string;
  position: number;
  prize: number;
  date: string;
}

export interface Report {
  id: string;
  type: string;
  status: string;
  reportedBy?: string;
  reportedItemId?: string;
  reason?: string;
  createdAt?: string;
}

export interface Reel {
  id: string;
  userId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  status: string;
  moderationScore?: number;
  moderationReason?: string;
  createdAt?: string;
}

export async function getDashboardRecentActivity(): Promise<ApiResponse<DashboardRecentActivity>> {
  const endpoint = 'admin/dashboard/recent-activity';
  
  try {
    console.log('[adminService] GET dashboard recent activity');
    const response = await apiClient.get<ApiResponse<DashboardRecentActivity>>(endpoint);
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Recent activity fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch recent activity',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getDashboardRecentActivity error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getDashboardQuickStats(): Promise<ApiResponse<DashboardQuickStats>> {
  const endpoint = 'admin/dashboard/quick-stats';
  
  try {
    console.log('[adminService] GET dashboard quick stats');
    const response = await apiClient.get<ApiResponse<DashboardQuickStats>>(endpoint);
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Quick stats fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch quick stats',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getDashboardQuickStats error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getUsers(params?: {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<AdminUser>>> {
  const endpoint = 'admin/users';
  
  try {
    console.log('[adminService] GET users', params);
    const response = await apiClient.get<ApiResponse<PaginatedResponse<AdminUser>>>(endpoint, { params });
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Users fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch users',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getUsers error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getUserById(userId: string): Promise<ApiResponse<AdminUser>> {
  const endpoint = `admin/users/${userId}`;
  
  try {
    console.log('[adminService] GET user by id:', userId);
    const response = await apiClient.get<ApiResponse<AdminUser>>(endpoint);
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'User fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch user',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getUserById error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getUserKYC(userId: string): Promise<ApiResponse<any>> {
  const endpoint = `admin/users/${userId}/kyc`;
  
  try {
    console.log('[adminService] GET user KYC:', userId);
    const response = await apiClient.get<ApiResponse<any>>(endpoint);
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'KYC data fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch KYC data',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getUserKYC error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getUserEarnings(userId: string): Promise<ApiResponse<Earnings[]>> {
  const endpoint = `admin/users/${userId}/earnings`;
  
  try {
    console.log('[adminService] GET user earnings:', userId);
    const response = await apiClient.get<ApiResponse<Earnings[]>>(endpoint);
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Earnings fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch earnings',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getUserEarnings error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getCompetitions(params?: {
  status?: string;
  sponsor?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<Competition>>> {
  const endpoint = 'admin/competitions';
  
  try {
    console.log('[adminService] GET competitions', params);
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Competition>>>(endpoint, { params });
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Competitions fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch competitions',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getCompetitions error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getCompetitionById(competitionId: string): Promise<ApiResponse<Competition>> {
  const endpoint = `admin/competitions/${competitionId}`;
  
  try {
    console.log('[adminService] GET competition by id:', competitionId);
    const response = await apiClient.get<ApiResponse<Competition>>(endpoint);
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Competition fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch competition',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getCompetitionById error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getCompetitionParticipants(competitionId: string): Promise<ApiResponse<any[]>> {
  const endpoint = `admin/competitions/${competitionId}/participants`;
  
  try {
    console.log('[adminService] GET competition participants:', competitionId);
    const response = await apiClient.get<ApiResponse<any[]>>(endpoint);
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Participants fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch participants',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getCompetitionParticipants error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getCompetitionLeaderboard(competitionId: string): Promise<ApiResponse<any[]>> {
  const endpoint = `admin/competitions/${competitionId}/leaderboard`;
  
  try {
    console.log('[adminService] GET competition leaderboard:', competitionId);
    const response = await apiClient.get<ApiResponse<any[]>>(endpoint);
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Leaderboard fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch leaderboard',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getCompetitionLeaderboard error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getSponsors(params?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<Sponsor>>> {
  const endpoint = 'admin/sponsors';
  
  try {
    console.log('[adminService] GET sponsors', params);
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Sponsor>>>(endpoint, { params });
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Sponsors fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch sponsors',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getSponsors error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getSponsorById(sponsorId: string): Promise<ApiResponse<Sponsor>> {
  const endpoint = `admin/sponsors/${sponsorId}`;
  
  try {
    console.log('[adminService] GET sponsor by id:', sponsorId);
    const response = await apiClient.get<ApiResponse<Sponsor>>(endpoint);
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Sponsor fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch sponsor',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getSponsorById error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getEarnings(params?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<Earnings>>> {
  const endpoint = 'admin/earnings';
  
  try {
    console.log('[adminService] GET earnings', params);
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Earnings>>>(endpoint, { params });
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Earnings fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch earnings',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getEarnings error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getUserEarningsFromAdmin(userId: string): Promise<ApiResponse<Earnings[]>> {
  const endpoint = `admin/earnings/${userId}`;
  
  try {
    console.log('[adminService] GET user earnings from admin:', userId);
    const response = await apiClient.get<ApiResponse<Earnings[]>>(endpoint);
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'User earnings fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch user earnings',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getUserEarningsFromAdmin error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getWinners(params?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<Winner>>> {
  const endpoint = 'admin/winners';
  
  try {
    console.log('[adminService] GET winners', params);
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Winner>>>(endpoint, { params });
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Winners fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch winners',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getWinners error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getTopEarners(): Promise<ApiResponse<Winner[]>> {
  const endpoint = 'admin/winners/top-earners';
  
  try {
    console.log('[adminService] GET top earners');
    const response = await apiClient.get<ApiResponse<Winner[]>>(endpoint);
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Top earners fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch top earners',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getTopEarners error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getReports(params?: {
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<Report>>> {
  const endpoint = 'admin/reports';
  
  try {
    console.log('[adminService] GET reports', params);
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Report>>>(endpoint, { params });
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Reports fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch reports',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getReports error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getReels(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<Reel>>> {
  const endpoint = 'admin/reels';
  
  try {
    console.log('[adminService] GET reels', params);
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Reel>>>(endpoint, { params });
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Reels fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch reels',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getReels error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export async function getReelById(reelId: string): Promise<ApiResponse<Reel>> {
  const endpoint = `admin/reels/${reelId}`;
  
  try {
    console.log('[adminService] GET reel by id:', reelId);
    const response = await apiClient.get<ApiResponse<Reel>>(endpoint);
    
    if (response.data.code === 1 && response.data.data) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Reel fetched successfully',
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch reel',
      error: 'API returned unsuccessful response',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[adminService] getReelById error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

export const adminService = {
  getDashboardRecentActivity,
  getDashboardQuickStats,
  getUsers,
  getUserById,
  getUserKYC,
  getUserEarnings,
  getCompetitions,
  getCompetitionById,
  getCompetitionParticipants,
  getCompetitionLeaderboard,
  getSponsors,
  getSponsorById,
  getEarnings,
  getUserEarningsFromAdmin,
  getWinners,
  getTopEarners,
  getReports,
  getReels,
  getReelById,
};

