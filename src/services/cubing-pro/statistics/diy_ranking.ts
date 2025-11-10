import { Request } from '@/services/cubing-pro/request';
import {StaticAPI } from '@/services/cubing-pro/statistics/typings';
import { AuthHeader } from '@/services/cubing-pro/auth/token';

export async function apiDiyRanking(
  key: string,
): Promise<StaticAPI.DiyRankWCAResultStaticsResponse> {
  const response = await Request.get<StaticAPI.DiyRankWCAResultStaticsResponse>(
    'diy_static/diy_rankings/' + key,
    {},
  );
  return response.data;
}

export async function apiDiyRankingKinch (
  key: string,
  req: StaticAPI.KinchReq,
): Promise<StaticAPI.KinchResp> {
  const response = await Request.post<StaticAPI.KinchResp>('diy_static/diy_rankings/' + key + "/kinch", {
    ...req,
  });
  return response.data;
}

export async function apiGetAllDiyRankingKey(): Promise<{data: StaticAPI.DiyRankKeyValue[]}>{
  const response = await Request.get<{data: StaticAPI.DiyRankKeyValue[]}>(
    'diy_static/diy_rankings',
    {},
  );
  return response.data;
}


export async function apiUpdateRankingWithKey(key: string, description: string, persons: string[] ) :Promise<any>{
  const response = await Request.post(
    `diy_static/diy_rankings/${key}`,
    {
      description: description,
      persons: persons,
    },
    { headers: AuthHeader() },
  )
  return response.data
}


export async function apiCreateRanking(key:string, description:string) :Promise<any>{
  const response = await Request.post(
    `diy_static/diy_rankings`,
    {
      description: description,
      key: key,
    },
    { headers: AuthHeader() },
  )
  return response.data
}


