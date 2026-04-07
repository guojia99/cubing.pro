import { wcaCentisecondsToSeconds } from '@/pages/Tools/TeamMatch/wcaSeeding';

/** One 平台 `e_id` → 与组队赛/WCA 一致的项目 id（如 333、pyram） */
export const ONE_EID_TO_WCA_EVENT: Record<number, string> = {
  1: '333',
  2: '222',
  3: '444',
  4: '555',
  5: '666',
  6: '777',
  7: '333oh',
  8: 'pyram',
  9: 'skewb',
  10: 'minx',
  11: '333bf',
  12: '444bf',
  13: '555bf',
  /** 多项盲拧；One 文档常写作 444mbf，与 WCA 项目 id `333mbf` 对应 */
  14: '333mbf',
  15: 'sq1',
  16: '333fm',
  17: 'clock',
  19: 'fto',
};

/** `/api/grade/user` 单条成绩（节选拉取所需字段） */
export type OneGradeUserRow = {
  e_id: number;
  t_single: string;
  t_avg: string;
};

type OneGradeUserResponse = {
  code: number;
  data?: OneGradeUserRow[];
};

function getOneGradeApiOrigin(): string {
  if (process.env.REACT_APP_ENV === 'dev' && typeof window !== 'undefined') {
    return `${window.location.origin}/one-ss-api`;
  }
  return 'https://ss.sxmfxh.com';
}

/** 数字 uid（字符串，仅数字） */
export async function fetchOneUserGrades(uid: string): Promise<OneGradeUserRow[]> {
  const id = uid.trim();
  if (!/^\d+$/.test(id)) throw new Error('invalid one uid');
  const url = `${getOneGradeApiOrigin()}/api/grade/user?u_id=${encodeURIComponent(id)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`http ${res.status}`);
  const json = (await res.json()) as OneGradeUserResponse;
  if (json.code !== 10000 || !Array.isArray(json.data)) {
    throw new Error('one api');
  }
  return json.data;
}

export function wcaEventIdToOneEid(eventId: string): number | null {
  const e = Object.entries(ONE_EID_TO_WCA_EVENT).find(([, v]) => v === eventId);
  return e ? Number(e[0]) : null;
}

function parseCenti(s: string): number | null {
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** 在 One 成绩列表中取当前 WCA 项目下最优单次与平均（百分之一秒 → 秒） */
export function pickBestOneGradeForEvent(
  rows: OneGradeUserRow[],
  eventId: string,
): { single: number | null; average: number | null } {
  const eid = wcaEventIdToOneEid(eventId);
  if (eid === null) return { single: null, average: null };
  const filtered = rows.filter((r) => r.e_id === eid);
  if (!filtered.length) return { single: null, average: null };
  let bestS = Infinity;
  let bestA = Infinity;
  for (const row of filtered) {
    const s = parseCenti(row.t_single);
    const a = parseCenti(row.t_avg);
    if (s !== null && s < bestS) bestS = s;
    if (a !== null && a < bestA) bestA = a;
  }
  return {
    single: bestS === Infinity ? null : wcaCentisecondsToSeconds(bestS),
    average: bestA === Infinity ? null : wcaCentisecondsToSeconds(bestA),
  };
}

/** 最近比赛列表项（`/api/comp`） */
export type OneCompItem = {
  c_id: number;
  c_name: string;
  c_date?: string;
};

/** 某场比赛某项目某轮成绩（与 user 接口行结构一致，含 u_id；成绩归属选手为 u_id / u_name） */
export type OneCompGradeRow = OneGradeUserRow & {
  u_id: number;
  c_id: number;
  e_round: number;
  u_name?: string;
  input_u_id?: number;
  input_u_name?: string;
};

type OneCompListResponse = {
  code: number;
  data?: OneCompItem[];
};

type OneCompGradeResponse = {
  code: number;
  data?: OneCompGradeRow[];
};

/** 最近 common 比赛（默认 100 条） */
export async function fetchOneCommonCompList(page = 1, size = 100): Promise<OneCompItem[]> {
  const url = `${getOneGradeApiOrigin()}/api/comp?page=${page}&size=${size}&type=common`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`http ${res.status}`);
  const json = (await res.json()) as OneCompListResponse;
  if (json.code !== 10000 || !Array.isArray(json.data)) {
    throw new Error('one comp list');
  }
  return json.data;
}

/** 指定比赛、项目、轮次的成绩表（按 u_id 匹配选手 One ID） */
export async function fetchOneCompGrades(cId: number, eId: number, eRound: number): Promise<OneCompGradeRow[]> {
  const url = `${getOneGradeApiOrigin()}/api/grade/comp?c_id=${cId}&e_id=${eId}&e_round=${eRound}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`http ${res.status}`);
  const json = (await res.json()) as OneCompGradeResponse;
  if (json.code !== 10000 || !Array.isArray(json.data)) {
    throw new Error('one comp grades');
  }
  return json.data;
}
