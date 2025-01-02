import { Request } from '@/services/cubing-pro/request';
import { StaticAPI } from '@/services/cubing-pro/statistics/typings';

export async function apiDiyRanking(
  key: string,
): Promise<StaticAPI.DiyRankWCAResultStaticsResponse> {
  const response = await Request.get<StaticAPI.DiyRankWCAResultStaticsResponse>(
    'public/statistics/diy_rankings/' + key,
    {},
  );
  return response.data;
}
