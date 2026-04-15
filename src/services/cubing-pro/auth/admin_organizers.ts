import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { Request } from '@/services/cubing-pro/request';

/** 后端 ResponseOK 通用包壳 */
type CubeApiEnvelope<T> = { code?: string; data: T; msg?: string };

/** 管理端主办团队（与后端 user.Organizers JSON 一致） */
export type AdminOrganizer = {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  Name: string;
  Introduction?: string;
  Email?: string;
  LeaderID?: string;
  AssOrganizerUsers?: string;
  Status: string;
  LeaderRemark?: string;
  AdminMessage?: string;
};

export type AdminCreateOrganizerReq = {
  name: string;
  introduction?: string;
  email?: string;
  leader_cube_id?: string;
  status: string;
  leader_remark?: string;
  admin_message?: string;
  ass_cube_ids?: string[];
};

export type AdminUpdateOrganizerReq = {
  name?: string;
  introduction?: string;
  email?: string;
  leader_cube_id?: string;
  status?: string;
  leader_remark?: string;
  admin_message?: string;
  ass_cube_ids?: string[];
};

/** 比赛群组（多值字段可能为 JSON 字符串或已解析数组） */
export type AdminCompetitionGroup = {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  OrganizersID?: number;
  qq_groups?: string | string[];
  qq_group_uid?: string | string[];
  wechat_groups?: string | string[];
};

export type AdminCreateGroupReq = {
  name: string;
  qq_groups?: string[];
  qq_group_uid?: string[];
  wechat_groups?: string[];
};

export type AdminUpdateGroupReq = {
  name?: string;
  qq_groups?: string[];
  qq_group_uid?: string[];
  wechat_groups?: string[];
};

export type AdminAddMemberReq = {
  cube_id: string;
  grant_auth: boolean;
};

export async function apiAdminOrganizersList(params: {
  page?: number;
  size?: number;
  Status?: string;
}): Promise<{ items: AdminOrganizer[]; total: number }> {
  const response = await Request.get<CubeApiEnvelope<{ items: AdminOrganizer[]; total: number }>>(
    '/admin/competition/organizers',
    {
      params,
      headers: AuthHeader(),
    },
  );
  return response.data.data;
}

export async function apiAdminCreateOrganizer(
  body: AdminCreateOrganizerReq,
): Promise<AdminOrganizer> {
  const response = await Request.post<CubeApiEnvelope<AdminOrganizer>>(
    '/admin/competition/organizers',
    body,
    { headers: AuthHeader() },
  );
  return response.data.data;
}

export async function apiAdminGetOrganizer(orgId: number): Promise<{
  organizer: AdminOrganizer;
  groups: AdminCompetitionGroup[];
}> {
  const response = await Request.get<
    CubeApiEnvelope<{ organizer: AdminOrganizer; groups: AdminCompetitionGroup[] }>
  >(`/admin/competition/organizers/${orgId}`, { headers: AuthHeader() });
  return response.data.data;
}

export async function apiAdminUpdateOrganizer(
  orgId: number,
  body: AdminUpdateOrganizerReq,
): Promise<AdminOrganizer> {
  const response = await Request.put<CubeApiEnvelope<AdminOrganizer>>(
    `/admin/competition/organizers/${orgId}`,
    body,
    { headers: AuthHeader() },
  );
  return response.data.data;
}

export async function apiAdminDeleteOrganizer(orgId: number): Promise<void> {
  await Request.delete(`/admin/competition/organizers/${orgId}`, { headers: AuthHeader() });
}

export async function apiAdminOrganizerGroups(
  orgId: number,
  params?: { page?: number; size?: number },
): Promise<{ items: AdminCompetitionGroup[]; total: number }> {
  const response = await Request.get<
    CubeApiEnvelope<{ items: AdminCompetitionGroup[]; total: number }>
  >(`/admin/competition/organizers/${orgId}/groups`, { params, headers: AuthHeader() });
  return response.data.data;
}

export async function apiAdminCreateGroup(
  orgId: number,
  body: AdminCreateGroupReq,
): Promise<AdminCompetitionGroup> {
  const response = await Request.post<CubeApiEnvelope<AdminCompetitionGroup>>(
    `/admin/competition/organizers/${orgId}/groups`,
    body,
    { headers: AuthHeader() },
  );
  return response.data.data;
}

export async function apiAdminUpdateGroup(
  groupId: number,
  body: AdminUpdateGroupReq,
): Promise<AdminCompetitionGroup> {
  const response = await Request.put<CubeApiEnvelope<AdminCompetitionGroup>>(
    `/admin/competition/groups/${groupId}`,
    body,
    { headers: AuthHeader() },
  );
  return response.data.data;
}

export async function apiAdminDeleteGroup(groupId: number): Promise<void> {
  await Request.delete(`/admin/competition/groups/${groupId}`, { headers: AuthHeader() });
}

export async function apiAdminAddOrganizerMember(
  orgId: number,
  body: AdminAddMemberReq,
): Promise<AdminOrganizer> {
  const response = await Request.post<CubeApiEnvelope<AdminOrganizer>>(
    `/admin/competition/organizers/${orgId}/members`,
    body,
    { headers: AuthHeader() },
  );
  return response.data.data;
}

export async function apiAdminRemoveOrganizerMember(
  orgId: number,
  cubeId: string,
): Promise<AdminOrganizer> {
  const response = await Request.delete<CubeApiEnvelope<AdminOrganizer>>(
    `/admin/competition/organizers/${orgId}/members`,
    { params: { cube_id: cubeId }, headers: AuthHeader() },
  );
  return response.data.data;
}
