import { AuthHeader } from "@/services/cubing-pro/auth/token";
import type { PlayersAPI } from "@/services/cubing-pro/players/typings";
import { Request } from "@/services/cubing-pro/request";

export async function apiApprovalComp(compId: number): Promise<unknown> {
  const response = await Request.post<unknown>(
    `/admin/competition/approvals/${compId}/approval`,
    {
      Ok: true,
    },
    {
      headers: AuthHeader(),
    },
  );

  return response.data;
}

/** 管理员删除比赛（含成绩、报名等），需管理员或超级管理员权限 */
export async function apiAdminDeleteComp(compId: number): Promise<unknown> {
  const response = await Request.delete<unknown>(`/admin/competition/comps/${compId}`, {
    headers: AuthHeader(),
  });
  return response.data;
}

export async function apiAdminPlayers(
  params: PlayersAPI.PlayersReq,
): Promise<PlayersAPI.PlayersResp> {
  const like: Record<string, string> = {};
  const search: Record<string, string> = {};
  const q = params.name.trim();
  if (q) {
    if (/^\d+$/.test(q)) {
      search.id = q;
    }
    like.name = q;
    like.cube_id = q;
  }
  const response = await Request.post<PlayersAPI.PlayersResp>(
    "/admin/users/",
    {
      like,
      search,
      page: params.page,
      size: params.size,
      include_deleted: params.includeDeleted ?? true,
      only_deleted: params.onlyDeleted ?? false,
    },
    {
      headers: AuthHeader(),
    },
  );
  return response.data;
}

export async function apiAdminCreatePlayer(params: PlayersAPI.CreatePlayerReq): Promise<unknown> {
  const response = await Request.post<PlayersAPI.PlayersResp>(
    "/admin/users/create_user",
    params,
    {
      headers: AuthHeader(),
    },
  );
  return response.data;
}

export async function apiAdminUpdatePlayerQQ(
  params: PlayersAPI.UpdatePlayerQQReq,
): Promise<unknown> {
  const response = await Request.put<PlayersAPI.PlayersResp>(
    "/admin/users/update_qq",
    params,
    { headers: AuthHeader() },
  );
  return response.data;
}

export async function apiAdminSoftDeleteUser(
  params: PlayersAPI.AdminUserRefReq,
): Promise<unknown> {
  const response = await Request.post<unknown>("/admin/users/soft_delete", params, {
    headers: AuthHeader(),
  });
  return response.data;
}

export async function apiAdminPurgeUser(
  params: PlayersAPI.AdminUserRefReq,
): Promise<unknown> {
  const response = await Request.post<unknown>("/admin/users/purge", params, {
    headers: AuthHeader(),
  });
  return response.data;
}

export async function apiAdminUpdatePlayerCubeID(
  params: PlayersAPI.UpdatePlayerCubeIDReq,
): Promise<unknown> {
  const response = await Request.put<PlayersAPI.PlayersResp>(
    "/admin/users/update_cube_id",
    params,
    { headers: AuthHeader() },
  );
  return response.data;
}

export async function apiAdminUpdatePlayerName(
  params: PlayersAPI.UpdatePlayerNameWCAIDReq,
): Promise<unknown> {
  const response = await Request.put<PlayersAPI.PlayersResp>(
    "/admin/users/update_user_name",
    params,
    { headers: AuthHeader() },
  );
  return response.data;
}

export async function apiAdminUpdatePlayerWCAID(
  params: PlayersAPI.UpdatePlayerNameWCAIDReq,
): Promise<unknown> {
  const response = await Request.put<PlayersAPI.PlayersResp>(
    "/admin/users/update_wca_id",
    params,
    {
      headers: AuthHeader(),
    },
  );
  return response.data;
}

export async function apiUpdatePlayerAuth(
  params: PlayersAPI.UpdatePlayerAuthReq,
): Promise<unknown> {
  const response = await Request.post<unknown>("/admin/users/update_auth", params, {
    headers: AuthHeader(),
  });
  return response.data;
}

export async function apiMergePlayers(params: PlayersAPI.MergePlayerReq): Promise<unknown> {
  const response = await Request.post<unknown>("/admin/users/merge_user", params, {
    headers: AuthHeader(),
  });
  return response.data;
}
