import type { ReelsResponse } from '../../types/reels';

export interface GetUserReelsParams {
  page?: number;
  limit?: number;
}

export const getUserReels = async (
  params: GetUserReelsParams = {}
): Promise<ReelsResponse> => {
  const { page = 1, limit = 10 } = params;

  throw new Error(
    `Reels API not ready yet. Expected endpoint: GET /v1/api/user/reels?page=${page}&limit=${limit}`
  );
};