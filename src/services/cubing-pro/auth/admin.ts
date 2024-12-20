import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { Request } from '@/services/cubing-pro/request';
import {PlayersAPI} from "@/services/cubing-pro/players/typings";

export async function apiApprovalComp(compId: number): Promise<any> {
  const response = await Request.post<any>(
    '/admin/competition/approvals/' + compId + '/approval',
    {
      Ok: true,
    },
    {
      headers: AuthHeader(),
    },
  );

  return response.data;
}


export async function apiAdminPlayers(params: PlayersAPI.PlayersReq): Promise<PlayersAPI.PlayersResp> {
  const response = await Request.post<PlayersAPI.PlayersResp>(
    "/admin/users/",
    {
      like: {
        name: params.name,
        cube_id: params.name,
      },
      page: params.page,
      size: params.size,
    },
    {
      headers: AuthHeader(),
    }
  )
  return response.data
}
