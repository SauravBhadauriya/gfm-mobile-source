import apiClient from '../axios';
import { ApiResponse } from '../types';

// ==================== Type Definitions ====================

export interface CompetitionSponsor {
  _id: string;
  email: string;
  sponsorCode?: string;
  [key: string]: any;
}

export interface CompetitionWinner {
  userId: string;
  rank: number;
  prize: number;
  _id: string;
  [key: string]: any;
}

export interface Competition {
  _id: string;
  title: string;
  description: string;
  sponsorId?: CompetitionSponsor;
  entryFee: number;
  prizePool: number;
  startDate: string;
  endDate: string;
  status: 'CREATED' | 'APPROVED' | 'CANCELLED' | 'COMPLETED' | 'live';
  participants: any[];
  isActive: boolean;
  isDeleted: boolean;
  winners: CompetitionWinner[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
  [key: string]: any;
}

export interface CompetitionsResponse {
  items: Competition[];
  total?: number;
}

// ==================== API Functions ====================

/**
 * Get all competitions
 */
export async function getCompetitions(): Promise<ApiResponse<CompetitionsResponse>> {
  try {
    console.log('[competitionService] GET Competitions');
    
    const response = await apiClient.get<any>('user/competitions');
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      let competitions: Competition[] = [];
      
      if (Array.isArray(responseData.data)) {
        competitions = responseData.data;
      } else if (Array.isArray(responseData.data.items)) {
        competitions = responseData.data.items;
      } else if (Array.isArray(responseData.data.competitions)) {
        competitions = responseData.data.competitions;
      }

      const result: CompetitionsResponse = {
        items: competitions,
        total: competitions.length,
      };

      console.log('[competitionService] GET Competitions - Success:', competitions.length, 'competitions');
      return {
        success: true,
        data: result,
        message: responseData.message || 'Competitions fetched successfully',
      };
    }

    return {
      success: false,
      message: responseData.message || 'Failed to fetch competitions',
      error: 'API returned unsuccessful response',
      data: {
        items: [],
        total: 0,
      },
    };
  } catch (error: any) {
    console.error('[competitionService] GET Competitions error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: {
        items: [],
        total: 0,
      },
    };
  }
}

/**
 * Get competition by ID
 */
export async function getCompetitionById(competitionId: string): Promise<ApiResponse<Competition>> {
  try {
    console.log('[competitionService] GET Competition By ID', { competitionId });
    
    // First get all competitions, then find the one with matching ID
    const competitionsResponse = await getCompetitions();
    
    if (competitionsResponse.success && competitionsResponse.data) {
      const competition = competitionsResponse.data.items.find(
        (comp) => comp._id === competitionId || comp.id === competitionId
      );
      
      if (competition) {
        return {
          success: true,
          data: competition,
          message: 'Competition fetched successfully',
        };
      }
    }

    return {
      success: false,
      message: 'Competition not found',
      error: 'NOT_FOUND',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[competitionService] GET Competition By ID error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

/**
 * Get competitions by status
 */
export async function getCompetitionsByStatus(
  status: 'CREATED' | 'APPROVED' | 'CANCELLED' | 'COMPLETED' | 'live'
): Promise<ApiResponse<CompetitionsResponse>> {
  try {
    console.log('[competitionService] GET Competitions By Status', { status });
    
    const competitionsResponse = await getCompetitions();
    
    if (competitionsResponse.success && competitionsResponse.data) {
      const filteredCompetitions = competitionsResponse.data.items.filter(
        (comp) => comp.status === status
      );
      
      return {
        success: true,
        data: {
          items: filteredCompetitions,
          total: filteredCompetitions.length,
        },
        message: 'Competitions fetched successfully',
      };
    }

    return competitionsResponse;
  } catch (error: any) {
    console.error('[competitionService] GET Competitions By Status error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: {
        items: [],
        total: 0,
      },
    };
  }
}

// ==================== Service Export ====================

export const competitionService = {
  getCompetitions,
  getCompetitionById,
  getCompetitionsByStatus,
};

