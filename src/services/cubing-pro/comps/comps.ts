import { Request } from '@/services/cubing-pro/request';
import { CompsAPI } from './typings';

export async function apiComps(params: CompsAPI.CompsReq): Promise<CompsAPI.CompsResp> {
  const response = await Request.post<CompsAPI.CompsResp>('/public/comps/', {
    like: {
      name: params.name,
    },
    page: params.page,
    size: params.size,
  });
  return response.data;
}
