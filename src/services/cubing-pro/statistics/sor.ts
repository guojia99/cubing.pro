import { Request } from '@/services/cubing-pro/request';
import { StaticAPI } from '@/services/cubing-pro/statistics/typings';

export async function apiKinch(req: StaticAPI.KinchReq): Promise<StaticAPI.KinchResp> {
  const response = await Request.post<StaticAPI.KinchResp>('public/statistics/kinch', {
    ...req,
  });
  return response.data;
}


export async function apiSeniorKinch(req: StaticAPI.KinchReq): Promise<StaticAPI.KinchResp> {
  const response = await Request.post<StaticAPI.KinchResp>('public/statistics/kinch/senior', {
    ...req,
  });
  return response.data;
}
