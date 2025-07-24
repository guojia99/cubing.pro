import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { PlayersAPI } from '@/services/cubing-pro/players/typings';
import { Request } from '@/services/cubing-pro/request';

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

export async function apiAdminPlayers(
  params: PlayersAPI.PlayersReq,
): Promise<PlayersAPI.PlayersResp> {
  const response = await Request.post<PlayersAPI.PlayersResp>(
    '/admin/users/',
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
    },
  );
  return response.data;
}

export async function apiAdminCreatePlayer(params: PlayersAPI.CreatePlayerReq): Promise<any> {
  const response = await Request.post<PlayersAPI.PlayersResp>('/admin/users/create_user', params, {
    headers: AuthHeader(),
  });
  return response.data;
}

export async function apiAdminUpdatePlayerName(
  params: PlayersAPI.UpdatePlayerNameWCAIDReq,
): Promise<any> {
  const response = await Request.put<PlayersAPI.PlayersResp>(
    '/admin/users/update_user_name',
    params,
    { headers: AuthHeader() },
  );
  return response.data;
}

export async function apiAdminUpdatePlayerWCAID(
  params: PlayersAPI.UpdatePlayerNameWCAIDReq,
): Promise<any> {
  const response = await Request.put<PlayersAPI.PlayersResp>('/admin/users/update_wca_id', params, {
    headers: AuthHeader(),
  });
  return response.data;
}
