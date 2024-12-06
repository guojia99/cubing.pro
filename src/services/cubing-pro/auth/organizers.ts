import { OrganizersAPI} from '@/services/cubing-pro/auth/typings';
import { Request } from '@/services/cubing-pro/request';
import { AuthHeader } from '@/services/cubing-pro/auth/token';
import {CompsAPI} from "@/services/cubing-pro/comps/typings";

export async function apiMeOrganizers(): Promise<OrganizersAPI.MeOrganizersResp> {
  const response = await Request.get<OrganizersAPI.MeOrganizersResp>('/organizers/me', {
    headers: AuthHeader(),
  });
  return response.data;
}


export async function apiCreateComps(orgID: string, req: OrganizersAPI.CreateCompReq): Promise<any> {
  const response = await Request.post<CompsAPI.CompsResp>('/organizers/'+ orgID +'/comp/', req, {
    headers: AuthHeader(),
  })
  return response.data
}
// 注意路由带orgID

export async function apiGetComps(orgID: number): Promise<CompsAPI.CompsResp> {
  const response = await Request.get<CompsAPI.CompsResp>('/organizers/'+ orgID +'/comp/', {
    headers: AuthHeader(),
  })
  return response.data
}
