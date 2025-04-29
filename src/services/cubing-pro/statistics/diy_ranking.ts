import { Request } from '@/services/cubing-pro/request';
import { StaticAPI } from '@/services/cubing-pro/statistics/typings';

export async function apiDiyRanking(
  key: string,
): Promise<StaticAPI.DiyRankWCAResultStaticsResponse> {
  const response = await Request.get<StaticAPI.DiyRankWCAResultStaticsResponse>(
    'diy_static/diy_rankings/' + key,
    {},
  );
  return response.data;
}


export async function apiGetAllDiyRankingKey(): Promise<{data: StaticAPI.DiyRankKeyValue[]}>{
  const response = await Request.get<{data: StaticAPI.DiyRankKeyValue[]}>(
    'diy_static/diy_rankings',
    {},
  );
  return response.data;
}
