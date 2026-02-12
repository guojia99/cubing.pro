import { Request } from '@/services/cubing-pro/request';

export interface PkTimerPlayer {
  userName: string;
  userId: number;
  results: number[];
  best: number;
  average: number;
}

export interface PkTimerEvent {
  id: string;
  createdAt: string; // ISO 8601 格式字符串
  updatedAt: string;
  deletedAt: string | null;
  idx: number;
  name: string;
  otherNames: string;
  cn: string;
  class: string;
  isComp: boolean;
  isWCA: boolean;
  base_route_typ: number;
  puzzleId: string;
}

export interface PkTimerPKResults {
  players: PkTimerPlayer[];
  event: PkTimerEvent;
  count: number;
  curCount: number;
  firstMessage: Record<string, unknown>; // 空对象，可能后续有内容
}

export interface PkTimerGroupRecord {
  id: number;
  createdAt: string; // ISO 8601
  updatedAt: string;
  deletedAt: string | null;
  Start: boolean;
  lastRunning: string;
  startPerson: string;
  pkResults: PkTimerPKResults;
  eps: number;
  groupName: string;
}

export type PkTimerGroupRecordReq = {
  page: number;
  size: number;
};

export interface PkTimerGroupRecordResponse {
  items: PkTimerGroupRecord[]
  total: number
}


export async function GetPKTimer(params: PkTimerGroupRecordReq): Promise<{data: PkTimerGroupRecordResponse}> {
  const response = await Request.get<{data: PkTimerGroupRecordResponse}>(
    '/public/pkTimers', {params}
  );
  return response.data;
}

