import {AuthHeader} from "@/services/cubing-pro/auth/token";
import { Request } from '@/services/cubing-pro/request';
import {
  CreateSportEventReq,
  CreateSportResultReq,
  SportEvent,
  SportResult,
  SportResultQuery
} from '@/services/cubing-pro/sports/types';



export async function apiGetSportResults(query?: SportResultQuery): Promise<{data: {items: SportResult[]}}> {
  const response = await Request.get<{data: {items: SportResult[]}}>(
    '/sports/admin/results',
    {
      headers: AuthHeader(),
      params: query,
    },
  );
  return response.data;
}

export async function apiCreateSportResult(params: CreateSportResultReq): Promise<SportResult> {
  const response = await Request.post<SportResult>(
    '/sports/admin/results',
    params,
    { headers: AuthHeader() },
  );
  return response.data;
}

export async function apiDeleteSportResult(id: string): Promise<any> {
  const response = await Request.delete<any>(
    `/sports/admin/results/${id}`,
    { headers: AuthHeader() },
  );
  return response.data;
}


export async function apiGetSportEvents(): Promise<{data: {events: SportEvent[]}}> {
  const response = await Request.get<{data: {events: SportEvent[]}}>(
    '/sports/admin/events',
    { headers: AuthHeader() },
  );
  return response.data
}

export async function apiCreateSportEvent(params: CreateSportEventReq): Promise<SportEvent> {
  const response = await Request.post<SportEvent>(
    '/sports/admin/events',
    params,
    { headers: AuthHeader() },
  );
  return response.data;
}

export async function apiDeleteSportEvent(id: string): Promise<any> {
  const response = await Request.delete<any>(
    `/sports/admin/events/${id}`,
    { headers: AuthHeader() },
  );
  return response.data;
}
