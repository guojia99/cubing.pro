import type { PreResult, Result } from "@/components/Data/types/result";
import type { CompAPI } from "@/services/cubing-pro/comps/typings";
import { AuthHeader } from "./token";
import { getApiErrorDisplayMessage, Request } from "../request";
import { beijingDate, isGroupCompetition } from "@/lib/groupCompetition";

export type CompetitionMode = "admin" | "organizer";
export type CompetitionItem = Pick<CompAPI.Data, "id" | "Name" | "Status" | "IsDone" | "OrganizersID" | "CompStartTime" | "CompEndTime" | "EventMin" | "CanPreResult" | "Count" | "Genre"> & {
  OrganizersName: string;
  GroupId: number;
  GroupName: string;
  RejectMsg: string;
  PendingCount: number;
};
export type Registration = {
  id: number;
  UserID: number;
  UserName: string;
  Status: string;
  Events: string;
};
export type PageData<T> = { items: T[]; total: number; next: boolean };
export type Query = Record<string, string | number | boolean | undefined>;
export type CompetitionFilters = {
  organizers: { id: number; Name: string }[];
  groups: { id: number; Name: string; OrganizersID: number }[];
};
export type CompetitionFiltersPage = CompetitionFilters & {
  page: number; size: number; organizersTotal: number; groupsTotal: number;
  organizersNext: boolean; groupsNext: boolean;
};
type Envelope<T> = { code: string | number; data: T; error?: string; msg?: string };

export function competitionError(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    return getApiErrorDisplayMessage(response?.data) ?? (typeof response?.data === "object" && response.data !== null && "msg" in response.data && typeof response.data.msg === "string" ? response.data.msg : "请求失败，请稍后重试");
  }
  return error instanceof Error ? error.message : "请求失败，请稍后重试";
}

async function call<T>(method: "get" | "post" | "put" | "delete", url: string, data?: unknown, params?: Query, signal?: AbortSignal): Promise<T> {
  let response;
  try {
    response = await Request.request<Envelope<T>>({ method, url, data, params, signal, headers: AuthHeader() });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(competitionError(error));
  }
  const body = response.data;
  if (String(body.code) !== "200") throw new Error(getApiErrorDisplayMessage(body) ?? body.msg ?? "请求失败");
  return body.data;
}

export function competitionService(mode: CompetitionMode, orgId: string, compId: string) {
  const base = mode === "admin" ? `/admin/competition/comps/${compId}` : `/organizers/${orgId}/comp/${compId}`;
  return {
    detail: (signal?: AbortSignal) => call<CompAPI.Data>("get", base, undefined, undefined, signal),
    update: (data: CompAPI.Data) => call<CompAPI.Data>("post", base, data),
    rename: (newName: string) => call<null>("post", `${base}/update_name`, { newName }),
    apply: () => call<null>("post", `${base}/apply`, {}),
    end: () => call<null>("post", `${base}/end`, {}),
    remove: () => call<null>("delete", base),
    players: (signal?: AbortSignal) => call<Registration[]>("get", `${base}/players`, undefined, undefined, signal),
    approvePlayer: (id: number, pass: boolean) => call<null>("post", `${base}/players/approval/${id}`, { pass }),
    results: (params: Query, signal?: AbortSignal) => call<Result[]>("get", `${base}/result`, undefined, params, signal),
    addResult: (EventId: string, Round: number, Results: number[], CubeID: string) => call<null>("post", `${base}/result`, { EventId, Round, Results, CubeID, Penalty: [] }),
    deleteResult: (id: number) => call<null>("delete", `${base}/result/${id}`),
    preResults: (params: Query, signal?: AbortSignal) => call<PageData<PreResult>>("get", `${base}/pre_results`, undefined, params, signal),
    approveResult: (id: number, FinishDetail: string) => call<null>("post", `${base}/pre_results/${id}/approval`, { FinishDetail }),
    confirmHistoricalResult: (id: number, reason: string) => {
      if (mode !== "admin") return Promise.reject(new Error("人工核查确认仅限管理员专用接口"));
      if (!reason.trim()) return Promise.reject(new Error("人工核查理由不能为空"));
      return call<null>("post", `${base}/pre_results/${id}/approval`, { FinishDetail: "ok", HistoricalConfirmed: true, ReviewReason: reason.trim() });
    },
    round: (EventID: string, RoundNumber: number, Open: boolean) => call<null>("put", `${base}/refresh_event`, { EventID, RoundNumber, Open }),
    openAllRounds: () => call<null>("put", `${base}/refresh_event`, { All: true, Open: true }),
  };
}

export async function getCompetitionFilters(signal?: AbortSignal): Promise<CompetitionFilters> {
  const options: CompetitionFilters = { organizers: [], groups: [] };
  let page = 1, next = true;
  while (next) {
    const data = await call<CompetitionFiltersPage>("get", "/admin/competition/filters", undefined, { page, size: 500 }, signal);
    options.organizers.push(...data.organizers);
    options.groups.push(...data.groups);
    next = data.organizersNext || data.groupsNext;
    page++;
  }
  return options;
}

export async function listGroupCompetitions(mode: CompetitionMode, orgId: string, params: Query, signal?: AbortSignal) {
  if (mode === "admin") return call<PageData<CompetitionItem>>("get", "/admin/competition/approvals/comps", undefined, params, signal);
  // The existing organizer endpoint returns the whole team's legacy list and
  // ignores these filters. Apply them locally rather than changing that API.
  const data = await call<PageData<CompetitionItem>>("get", `/organizers/${orgId}/comp/`, undefined, undefined, signal);
  const items = [...(data.items ?? [])];
  // Legacy list projection omits GroupId. Resolve only possible group events,
  // with bounded requests; the authorized detail also supplies display names.
  let index = 0;
  await Promise.all(Array.from({ length: Math.min(4, items.length) }, async () => {
    while (index < items.length) {
      const i = index++;
      if (items[i].Genre !== 5 || items[i].GroupId !== undefined) continue;
      const detail = await competitionService(mode, orgId, String(items[i].id)).detail(signal);
      items[i] = { ...items[i], GroupId: detail.GroupId ?? 0, OrganizersName: detail.OrganizersName ?? detail.Org?.Name ?? "", GroupName: detail.GroupName ?? detail.Group?.name ?? "" };
    }
  }));
  const filtered = items.filter((item) => {
    if (params.id && item.id !== Number(params.id)) return false;
    if (params.name && !item.Name.toLocaleLowerCase().includes(String(params.name).toLocaleLowerCase())) return false;
    if (params.status && params.status !== "all" && item.Status !== params.status) return false;
    if (params.orgId && item.OrganizersID !== Number(params.orgId)) return false;
    if (params.groupId && item.GroupId !== Number(params.groupId)) return false;
    if (params.isDone !== undefined && String(params.isDone) !== "" && Boolean(item.IsDone) !== (String(params.isDone) === "true")) return false;
    if (params.date) {
      const date = String(params.date);
      if (isGroupCompetition(item)) return beijingDate(item.CompStartTime) <= date && beijingDate(item.CompEndTime) >= date;
      return item.CompStartTime.slice(0, 10) <= date && item.CompEndTime.slice(0, 10) >= date;
    }
    return true;
  });
  const page = Math.max(1, Number(params.page) || 1), size = Math.min(100, Math.max(1, Number(params.size) || 20));
  return { items: filtered.slice((page - 1) * size, page * size), total: filtered.length, next: page * size < filtered.length };
}

export function approveGroupCompetition(compId: number, Ok: boolean, RejectMsg?: string) {
  return call<null>("post", `/admin/competition/approvals/${compId}/approval`, { Ok, ...(Ok ? {} : { RejectMsg }) });
}
