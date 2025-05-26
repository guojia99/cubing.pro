import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { OrganizersAPI } from '@/services/cubing-pro/auth/typings';
import { CompAPI, CompResultAPI, CompsAPI } from '@/services/cubing-pro/comps/typings';
import { PlayersAPI } from '@/services/cubing-pro/players/typings';
import { Request } from '@/services/cubing-pro/request';

export async function apiMeOrganizers(): Promise<OrganizersAPI.MeOrganizersResp> {
  const response = await Request.get<OrganizersAPI.MeOrganizersResp>('/organizers/me', {
    headers: AuthHeader(),
  });
  return response.data;
}

export async function apiOrganizers(orgId: string): Promise<OrganizersAPI.OrganizersResp> {
  const response = await Request.get<OrganizersAPI.OrganizersResp>('/organizers/' + orgId, {
    headers: AuthHeader(),
  });
  return response.data;
}

export async function apiCreateComps(
  orgID: string,
  req: OrganizersAPI.CreateCompReq,
): Promise<any> {
  const response = await Request.post<CompsAPI.CompsResp>('/organizers/' + orgID + '/comp/', req, {
    headers: AuthHeader(),
  });
  return response.data;
}

// 注意路由带orgID

export async function apiGetComps(orgID: number): Promise<CompsAPI.CompsResp> {
  const response = await Request.get<CompsAPI.CompsResp>('/organizers/' + orgID + '/comp/', {
    headers: AuthHeader(),
  });
  return response.data;
}

export async function apiGetOrgComp(orgID: string, compId: string): Promise<CompAPI.CompResp> {
  const response = await Request.get<CompAPI.CompResp>('/organizers/' + orgID + '/comp/' + compId, {
    headers: AuthHeader(),
  });
  return response.data;
}

export async function apiGetGroups(orgID: number): Promise<OrganizersAPI.GetGroupsResp> {
  const response = await Request.get<OrganizersAPI.GetGroupsResp>(
    '/organizers/' + orgID + '/groups',
    {
      headers: AuthHeader(),
    },
  );
  return response.data;
}

export async function apiEndComp(orgId: number, compId: number): Promise<any> {
  const response = await Request.post<any>(
    '/organizers/' + orgId + '/comp/' + compId + '/end',
    {},
    { headers: AuthHeader() },
  );
  return response.data;
}

export async function apiGetAllPlayers(
  orgId: string,
  compId: string,
): Promise<PlayersAPI.PlayersResp> {
  const response = await Request.get<PlayersAPI.PlayersResp>(
    '/organizers/' + orgId + '/comp/' + compId + '/all_players',
    { headers: AuthHeader() },
  );
  return response.data;
}

export async function apiGetCompsResults(
  orgId: string | undefined,
  compId: string | undefined,
  eventId: string,
  eventRoundNum: number,
): Promise<CompResultAPI.CompResultResp> {
  const response = await Request.get<CompResultAPI.CompResultResp>(
    'organizers/' +
      orgId +
      '/comp/' +
      compId +
      '/result' +
      '?event_id=' +
      eventId +
      '&round_num=' +
      eventRoundNum,
    { headers: AuthHeader() },
  );
  return response.data;
}

export async function apiGetCompsResultsWithPlayer(
  orgId: string | undefined,
  compId: string | undefined,
  cubeId: string | undefined,
): Promise<CompResultAPI.CompResultResp> {
  const response = await Request.get<CompResultAPI.CompResultResp>(
    'organizers/' + orgId + '/comp/' + compId + '/result' + '?cube_id=' + cubeId,
    { headers: AuthHeader() },
  );
  return response.data;
}

export async function apiAddCompResults(
  orgId: string | undefined,
  compId: string | undefined,
  eventId: string | undefined,
  eventRoundNum: number | undefined,
  results: number[] | any,
  cubeID: string,
): Promise<any> {
  const response = await Request.post<CompResultAPI.CompResultResp>(
    'organizers/' + orgId + '/comp/' + compId + '/result',
    {
      Results: results,
      CubeID: cubeID,
      eventId: eventId,
      Round: eventRoundNum,
    },
    { headers: AuthHeader() },
  );
  return response.data;
}

export async function apiGetCompsPreResult(
  orgId: string | undefined,
  compId: string | undefined,
  finish: boolean | undefined,
  page: number,
  size: number,
): Promise<OrganizersAPI.GetPreResultResp> {
  let f = '/pre_results?page=' + page + '&size=' + size;
  if (finish !== undefined) {
    f += '&finish=';
    f += finish ? '1' : '0';
  }

  const response = await Request.get<OrganizersAPI.GetPreResultResp>(
    'organizers/' + orgId + '/comp/' + compId + f,
    { headers: AuthHeader() },
  );

  return response.data;
}

export async function apiApprovalCompsPreResult(
  orgId: string | undefined,
  compId: string | undefined,
  ok: boolean,
  result_id: number,
): Promise<any> {
  const response = await Request.post<any>(
    'organizers/' + orgId + '/comp/' + compId + '/pre_results/' + result_id + '/approval',
    {
      FinishDetail: ok ? 'ok' : 'not',
    },
    { headers: AuthHeader() },
  );

  return response.data;
}

export async function apiDeleteCompsResult(
  orgId: string | undefined,
  compId: string | undefined,
  result_id: number,
): Promise<any> {
  const response = await Request.delete<any>(
    'organizers/' + orgId + '/comp/' + compId + '/result/' + result_id,
    { headers: AuthHeader() },
  );

  return response.data;
}

export async function apiUpdateCompName(
  orgId: number | undefined,
  compId: number | undefined,
  newName: string,
): Promise<any> {
  const response = await Request.post<any>(
    'organizers/' + orgId + '/comp/' + compId + '/update_name',
    {
      newName: newName,
    },
    {headers: AuthHeader() },
  )
  return response.data;
}
