import type { CompAPI } from "@/services/cubing-pro/comps/typings";

export type BatchItem = { key: number; event: string; round: number; values: number[]; error: string; line: string };

export function roundNoRestrictions(schedule: Pick<CompAPI.Schedule, "NoRestrictions">, index: number): boolean {
  // Preserve explicit imported/server choices; only fill absent values.
  return schedule.NoRestrictions ?? index === 0;
}

// Calendar dates from DatePicker are explicitly interpreted in Beijing time.
export function beijingDateStart(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("日期格式应为 YYYY-MM-DD");
  const iso = `${date}T00:00:00+08:00`;
  const value = Date.parse(iso);
  if (!Number.isFinite(value) || beijingDate(iso) !== date) throw new Error("日期无效");
  return iso;
}

export function beijingDate(value: string): string {
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time + 8 * 3600_000).toISOString().slice(0, 10) : "";
}

export function competitionWindow(comp: { CompStartTime: string; CompEndTime: string }) {
  const start = beijingDate(comp.CompStartTime);
  const end = beijingDate(comp.CompEndTime);
  return { start: start ? Date.parse(beijingDateStart(start)) : NaN, end: end ? Date.parse(beijingDateStart(end)) + 86400_000 : NaN };
}

export function canEnterResults(comp: { Status: string; Genre?: number; GroupId?: number }): boolean {
  return !isGroupCompetition(comp) || comp.Status === "Running";
}

export function competitionEditTimes(comp: { Genre?: number; GroupId?: number; CompStartTime: string; CompEndTime: string }, startDate: string, endDate: string) {
  if (!isGroupCompetition(comp)) return { CompStartTime: comp.CompStartTime, CompEndTime: comp.CompEndTime };
  const start = beijingDateStart(startDate), end = beijingDateStart(endDate);
  if (endDate < startDate) throw new Error("结束日期不能早于开始日期");
  return { CompStartTime: start, CompEndTime: end };
}

export function canReviewResults(comp: { Status: string }): boolean {
  // Approval, identity and result eligibility are still validated server-side.
  return comp.Status === "Running";
}

export function preResultReviewFilter(value: string): { finish: "false" | "true" | "all"; review_status?: "passed" | "rejected"; finishDetail?: "timeout" } {
  if (value === "ok") return { finish: "true", review_status: "passed" };
  if (value === "not") return { finish: "true", review_status: "rejected" };
  if (value === "timeout") return { finish: "true", finishDetail: "timeout" };
  if (value === "false" || value === "true" || value === "all") return { finish: value };
  throw new Error("无效的成绩审批筛选状态");
}

export function competitionStatus(comp: { Status: string; IsDone: boolean; CompStartTime: string; CompEndTime: string }, now = Date.now()): string {
  if (comp.Status !== "Running") return ({ Reviewing: "待审批", Reject: "已驳回", Temporary: "草稿", Ban: "已封禁" } as Record<string, string>)[comp.Status] ?? comp.Status;
  if (comp.IsDone) return "已结束";
  const window = competitionWindow(comp);
  if (!Number.isFinite(window.start) || !Number.isFinite(window.end)) return "日期无效";
  if (now < window.start) return "已批准 / 未开始";
  if (now >= window.end) return "赛期结束";
  return "运行中";
}

type PublicCompetition = { GroupId?: number; Genre?: number; Status: string; IsDone: boolean; CompStartTime: string; CompEndTime: string };

export function isGroupCompetition(comp: { GroupId?: number; Genre?: number }): boolean {
  return comp.Genre === 5 && Number(comp.GroupId) > 0;
}

export function publicCompetitionStatus(comp: PublicCompetition, now = Date.now()): string {
  if (isGroupCompetition(comp)) {
    if (comp.Status === "Running") {
      if (comp.IsDone || now >= competitionWindow(comp).end) return "已结束";
      return now < competitionWindow(comp).start ? "未开始" : "进行中";
    }
  } else if (comp.Status === "Running") {
    // Keep the original timestamp behavior for every non-group competition.
    if (comp.IsDone) return "已结束";
    const start = Date.parse(comp.CompStartTime), end = Date.parse(comp.CompEndTime);
    if (now < start) return "未开始";
    return now > start && now < end ? "进行中" : "待结束";
  }
  return ({ Reviewing: "审批中", Reject: "驳回", Temporary: "编辑中", Ban: "禁用" } as Record<string, string>)[comp.Status] ?? "";
}

export function attemptCount(route: number): number {
  return [0, 1, 3, 3, 3, 5, 5, 5, 1, 2, 3][route] ?? 0;
}

export function parseScore(value: string): number {
  const text = value.trim().replaceAll("：", ":").replaceAll("。", ".").toUpperCase();
  if (text === "DNF" || text === "D") return -10000;
  if (text === "DNS") return -10001;
  if (!/^\d+(?:\.\d{1,3})?$/.test(text) && !/^\d+:\d{2}(?:\.\d{1,3})?$/.test(text) && !/^\d+:\d{2}:\d{2}(?:\.\d{1,3})?$/.test(text)) throw new Error(`成绩格式错误：${value}`);
  const parts = text.split(":").map(Number);
  if (parts.slice(1).some((part) => part >= 60)) throw new Error(`分秒必须小于 60：${value}`);
  const seconds = parts.reduce((total, part) => total * 60 + part, 0);
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error(`成绩必须大于 0：${value}`);
  return seconds;
}

export function parseAttempts(value: string, route: number): number[] {
  const count = attemptCount(route);
  if (!count) throw new Error("项目成绩类型无效");
  const text = value.trim().replaceAll("：", ":").replaceAll("。", ".").replace(/\s*\/\s*/g, "/").replace(/[,，]/g, " ");
  const tokens = text.split(/\s+/).filter(Boolean);
  if (route >= 8 && route <= 10) {
    if (tokens.length !== count * 2) throw new Error(`需要 ${count} 组 a/b 时间`);
    const results: number[] = [];
    for (let i = 0; i < tokens.length; i += 2) {
      const match = tokens[i].match(/^(\d+)\/(\d+)$/);
      if (!match) throw new Error("多盲格式为 a/b 时间");
      const solved = Number(match[1]), attempted = Number(match[2]);
      if (!Number.isSafeInteger(solved) || !Number.isSafeInteger(attempted) || solved > attempted) throw new Error("多盲复原数和尝试数必须为非负整数，复原数不能超过尝试数");
      const special: Record<string, number> = { DNF: -10000, DNS: -10001, DNP: -10002, DNT: -10003 };
      const token = tokens[i + 1].toUpperCase();
      const numericSpecial = /^-1000[0-3]$/.test(token) ? Number(token) : undefined;
      const time = special[token] ?? numericSpecial ?? parseScore(token);
      if (attempted === 0 && time !== -10001) throw new Error("0 次尝试仅允许 0/0 DNS");
      results.push(solved, attempted, time);
    }
    return results;
  }
  if (tokens.length !== count) throw new Error(`需要 ${count} 个成绩，当前 ${tokens.length} 个`);
  return tokens.map(parseScore);
}

export function positiveInteger(value: string | null, fallback = 1, max = Number.MAX_SAFE_INTEGER): number {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? Math.min(number, max) : fallback;
}

export function competitionReturnPath(value: string | null, admin: boolean): string {
  const fallback = admin ? "/admin/competition/approvals" : "/admin/organizers/comps";
  return value && /^\/admin\/(?:competition\/approvals|organizers\/comps)\/?(?:\?[^#]*)?$/.test(value) ? value : fallback;
}

export function parseBatchResults(text: string, events: CompAPI.Event[], requireOpen = false): BatchItem[] {
  // A slash starts another entry only when followed by a configured event.
  // This preserves a spaced multi-blind ratio such as 3 / 4 10:00.
  const names = events.flatMap((event) => [event.EventID, event.EventName]).filter(Boolean).map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const separator = names.length ? new RegExp(`\\n|\\s+\\/\\s+(?=(?:${names.join("|")})(?:\\[\\d+\\]|【\\d+】)?\\s)`, "g") : /\n/;
  const lines = text.split(separator).map((line) => line.trim()).filter(Boolean);
  const seen = new Set<string>();
  return lines.map((line, key) => {
    const row: BatchItem = { key, line, event: "", round: 1, values: [], error: "" };
    try {
      const match = line.replaceAll("【", "[").replaceAll("】", "]").match(/^([^\s\[\]]+)(?:\[(\d+)\])?\s+(.+)$/);
      if (!match) throw new Error("格式：333[1] 1 2 3 4 5");
      const event = events.find((ev) => ev.EventID === match[1] || ev.EventName === match[1]);
      if (!event) throw new Error("本场比赛无此项目，请使用项目 ID");
      row.event = event.EventID; row.round = Number(match[2] || 1);
      const schedule = event.Schedule.find((s) => s.RoundNum === row.round);
      if (!schedule) throw new Error(`${row.event} 第 ${row.round} 轮不存在`);
      if (requireOpen && !schedule.IsRunning) throw new Error(`${row.event} 第 ${row.round} 轮未开放`);
      const identity = `${row.event}:${row.round}`;
      if (seen.has(identity)) throw new Error("同一选手的项目轮次重复，请合并为一行");
      seen.add(identity);
      row.values = parseAttempts(match[3], event.EventRoute);
    } catch (e) { row.error = e instanceof Error ? e.message : "格式错误"; }
    return row;
  });
}

export function validateEvents(events: CompAPI.Event[]) {
  if (!Array.isArray(events) || !events.length) throw new Error("至少配置一个比赛项目");
  const ids = new Set<string>();
  for (const event of events) {
    if (!event.EventID || ids.has(event.EventID) || !Array.isArray(event.Schedule) || !event.Schedule.length) throw new Error("项目不可重复，每个项目至少配置一轮");
    ids.add(event.EventID);
    if (!attemptCount(event.EventRoute)) throw new Error(`${event.EventID} 的成绩类型无效`);
    event.Schedule.forEach((round, index) => {
      if (round.RoundNum !== index + 1) throw new Error(`${event.EventID} 轮次编号必须从 1 连续递增`);
      for (const key of ["Competitors", "TimeLimit", "Cutoff", "CutoffNumber"] as const) {
        // Go omitempty omits valid zero-valued round settings.
        const value = round[key] ?? 0;
        if (!Number.isFinite(value) || value < 0) throw new Error(`${event.EventID} 的晋级人数、时限和及格配置不能为负数或空值`);
      }
      if (!Number.isInteger(round.Competitors ?? 0) || !Number.isInteger(round.CutoffNumber ?? 0)) throw new Error("人数与尝试次数必须为整数");
    });
  }
}
