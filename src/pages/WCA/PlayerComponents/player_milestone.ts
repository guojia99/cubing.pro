import { CubesCn } from '@/components/CubeIcon/cube';
import { eventOrder, roundNameMap } from '@/pages/WCA/utils/events';
import { resultsTimeFormat } from '@/pages/WCA/utils/wca_results';
import { findCubingCompetitionByIdentifier } from '@/services/cubing-pro/cubing_china/cubing';
import { WCACompetition, WcaProfile, WCAResult } from '@/services/cubing-pro/wca/types';

export type FormatMessageFn = (
  descriptor: { id: string; defaultMessage?: string },
  values?: Record<string, string | number>,
) => string;


export type MilestoneType =
  | 'first_competition'
  | 'first_overseas_competition'
  | 'competing_anniversary'
  | 'comeback'
  | 'nth_competition'
  | 'grand_slam'
  | 'record_breaker'
  | 'first_podium'
  | 'first_blindfolded_success'
  | 'significant_improvement'
  | 'first_333_average_sub10'
  | 'first_triple_podium_competition'
  | 'busy_competition_year'
  | 'multi_gold_single_comp';


export const MILESTONE_TYPE_PRIORITY: Record<MilestoneType, number> = {
  first_competition: 0,
  first_overseas_competition: 1,
  competing_anniversary: 2,
  comeback: 3,
  nth_competition: 4,
  grand_slam: 5,
  record_breaker: 6,
  first_podium: 7,
  first_blindfolded_success: 8,
  significant_improvement: 9,
  first_333_average_sub10: 10,
  first_triple_podium_competition: 11,
  busy_competition_year: 12,
  multi_gold_single_comp: 13,
};

export interface Milestone {
  type: MilestoneType;
  description: string;
  date?: string; // ISO 8601 或 YYYY-MM-DD
  year?: number;
  event_id?: string;
  competition_id?: string;
  competition_name?: string;
  old_best_time?: number;
  new_best_time?: number;
  old_best_avg_time?: number;
  new_best_avg_time?: number;
  best_is_average?: boolean;
  best_is_single?: boolean;

  percentage_improved?: number;
  achieved_on?: string;
  last_competition_date?: string;

  new_competition_date?: string;
  date_achieved?: string;
  result?: number;
  round_type_id?: string;
  position?: number;
  record_type?: 'NR' | 'AsR' | 'WR' | 'CR';
  record_value?: number;
  nth_competition_count?: number; // e.g., 100, 200, 300
  /** 参赛 N 周年（如 10、15、20） */
  anniversary_years?: number;
  /** 首次出国赛：比赛举办地国家/地区（用于标签展示） */
  overseas_country_iso2?: string;
  overseas_country_id?: string;
  /** 首次三阶平均 sub-10 之前，按时间线排列的各轮三阶成绩说明（多行） */
  prior_333_round_lines?: string[];
  /** 单届领奖台项目数（≥3） */
  podium_count?: number;
  /** 单届金牌项目数（≥2） */
  gold_count?: number;
  /** 高频参赛自然年 */
  busy_calendar_year?: number;
  /** 该自然年参赛场数（>15 即至少 16 场） */
  busy_year_comp_count?: number;
}

export function isValidTime(time: number): boolean {
  return time > 0;
}

export function getCompById(comps: WCACompetition[], id: string): WCACompetition | undefined {
  return comps.find((c) => c.id === id);
}

export function sortCompsByDate(comps: WCACompetition[]): WCACompetition[] {
  return [...comps].sort((a, b) => a.start_date.localeCompare(b.start_date));
}

export function sortResultsByCompDate(
  results: WCAResult[],
  compMap: Map<string, WCACompetition>,
): WCAResult[] {
  return [...results].sort((a, b) => {
    const compA = compMap.get(a.competition_id);
    const compB = compMap.get(b.competition_id);
    if (!compA || !compB) return 0;
    return compA.start_date.localeCompare(compB.start_date) || a.event_id.localeCompare(b.event_id);
  });
}

/** 同一比赛内轮次先后（数值小 = 时间更早） */
const ROUND_CHRONOLOGICAL: Record<string, number> = {
  '0': 1,
  h: 1,
  '1': 2,
  d: 2,
  '2': 3,
  e: 3,
  '3': 4,
  g: 4,
  f: 6,
  c: 6,
  b: 6,
};

function compare333ResultChronological(
  a: WCAResult,
  b: WCAResult,
  compMap: Map<string, WCACompetition>,
): number {
  const ca = compMap.get(a.competition_id);
  const cb = compMap.get(b.competition_id);
  const da = ca?.start_date ?? '';
  const db = cb?.start_date ?? '';
  if (da !== db) return da.localeCompare(db);
  const oa = ROUND_CHRONOLOGICAL[a.round_type_id] ?? 99;
  const ob = ROUND_CHRONOLOGICAL[b.round_type_id] ?? 99;
  if (oa !== ob) return oa - ob;
  return a.round_id - b.round_id;
}

function isFinalRoundForPodium(roundTypeId: string): boolean {
  return roundTypeId === 'f' || roundTypeId === 'c' || roundTypeId === 'b';
}

/** 三阶平均 sub-10：WCA 存百分之一秒，严格小于 10.00s → average < 1000 */
const SUB10_333_AVERAGE_THRESHOLD_CS = 1000;

/**
 * 首次三阶平均 sub-10；列出此前按时间线排序的各场三阶轮次（含平均 DNF 的轮次）。
 */
export function createFirst333AverageSub10Milestone(
  results: WCAResult[],
  compMap: Map<string, WCACompetition>,
  formatMessage: FormatMessageFn,
): Milestone[] {
  const r333 = results.filter((r) => r.event_id === '333');
  if (r333.length === 0) return [];

  const sorted = [...r333].sort((a, b) => compare333ResultChronological(a, b, compMap));
  const idx = sorted.findIndex(
    (r) => r.average > 0 && r.average < SUB10_333_AVERAGE_THRESHOLD_CS,
  );
  if (idx < 0) return [];

  const hit = sorted[idx];
  const comp = compMap.get(hit.competition_id);
  if (!comp) return [];

  const priorLines: string[] = [];
  for (let i = 0; i < idx; i++) {
    const res = sorted[i];
    const c = compMap.get(res.competition_id);
    if (!c) continue;
    const roundLabel = roundNameMap[res.round_type_id] ?? res.round_type_id;
    const avgStr =
      res.average > 0
        ? resultsTimeFormat(res.average, '333', true)
        : formatMessage({ id: 'wca.milestone.roundAvgMissing' });
    priorLines.push(
      formatMessage(
        { id: 'wca.milestone.line333Round' },
        {
          date: c.start_date,
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          comp: getCompName(c.name),
          round: roundLabel,
          avg: avgStr,
        },
      ),
    );
  }

  return [
    {
      type: 'first_333_average_sub10',
      description: formatMessage(
        { id: 'wca.milestone.desc.first_333_average_sub10' },
        { time: resultsTimeFormat(hit.average, '333', true) },
      ),
      date: comp.start_date,
      competition_id: comp.id,
      competition_name: comp.name,
      event_id: '333',
      result: hit.average,
      best_is_average: true,
      round_type_id: hit.round_type_id,
      prior_333_round_lines: priorLines,
    },
  ];
}

/**
 * 按参赛顺序，首场「单届决赛类轮次中 ≥3 个不同项目领奖台」的比赛。
 */
export function createFirstTriplePodiumCompetitionMilestone(
  results: WCAResult[],
  sortedComps: WCACompetition[],
  formatMessage: FormatMessageFn,
): Milestone[] {
  for (const comp of sortedComps) {
    const eventsPodium = new Set<string>();
    for (const res of results) {
      if (res.competition_id !== comp.id) continue;
      if (!isFinalRoundForPodium(res.round_type_id)) continue;
      if (res.best <= 0) continue;
      if (res.pos < 1 || res.pos > 3) continue;
      eventsPodium.add(res.event_id);
    }
    const count = eventsPodium.size;
    if (count >= 3) {
      return [
        {
          type: 'first_triple_podium_competition',
          description: formatMessage(
            { id: 'wca.milestone.desc.first_triple_podium_competition' },
            { count },
          ),
          date: comp.start_date,
          competition_id: comp.id,
          competition_name: comp.name,
          podium_count: count,
        },
      ];
    }
  }
  return [];
}

/**
 * 单自然年参赛超过 15 场（至少 16 场）：每年在当年最后一场（按 start_date）输出一条，带当年场数。
 */
export function createBusyYearMilestones(
  sortedComps: WCACompetition[],
  formatMessage: FormatMessageFn,
): Milestone[] {
  const byYear = new Map<number, WCACompetition[]>();
  for (const c of sortedComps) {
    const y = parseInt(c.start_date.slice(0, 4), 10);
    if (!Number.isFinite(y)) continue;
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(c);
  }

  const milestones: Milestone[] = [];
  for (const [year, list] of byYear) {
    if (list.length <= 15) continue;
    const last = list.reduce((a, b) => (a.start_date > b.start_date ? a : b));
    milestones.push({
      type: 'busy_competition_year',
      description: formatMessage(
        { id: 'wca.milestone.desc.busy_competition_year' },
        { year, count: list.length },
      ),
      date: last.start_date,
      competition_id: last.id,
      competition_name: last.name,
      busy_calendar_year: year,
      busy_year_comp_count: list.length,
    });
  }
  milestones.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  return milestones;
}

/**
 * 单届决赛类轮次获得两枚及以上金牌（不同项目）：每场符合条件各输出一条。
 */
export function createMultiGoldCompetitionMilestones(
  results: WCAResult[],
  sortedComps: WCACompetition[],
  formatMessage: FormatMessageFn,
): Milestone[] {
  const goldByComp = new Map<string, Set<string>>();
  for (const res of results) {
    if (!isFinalRoundForPodium(res.round_type_id)) continue;
    if (res.pos !== 1) continue;
    if (res.best <= 0) continue;
    if (!goldByComp.has(res.competition_id)) goldByComp.set(res.competition_id, new Set());
    goldByComp.get(res.competition_id)!.add(res.event_id);
  }

  const milestones: Milestone[] = [];
  for (const comp of sortedComps) {
    const goldEvents = goldByComp.get(comp.id);
    if (!goldEvents) continue;
    const n = goldEvents.size;
    if (n < 2) continue;
    milestones.push({
      type: 'multi_gold_single_comp',
      description: formatMessage({ id: 'wca.milestone.desc.multi_gold_single_comp' }, { count: n }),
      date: comp.start_date,
      competition_id: comp.id,
      competition_name: comp.name,
      gold_count: n,
    });
  }
  return milestones;
}

/**
 * 从比赛映射和成绩记录中安全获取比赛开始日期
 *
 * @param compMap - 比赛 ID 到 WCACompetition 的映射
 * @param result - WCA 比赛成绩记录
 * @returns 比赛的 start_date（格式 YYYY-MM-DD），若找不到则返回 undefined
 */
export function getCompetitionDateFromResult(
  compMap: Map<string, WCACompetition>,
  result: WCAResult,
): string | undefined {
  const comp = compMap.get(result.competition_id);
  return comp?.start_date;
}

/** 首秀日 YYYY-MM-DD 起算 + N 个日历年（UTC，避免本地时区偏移一天） */
export function addCalendarYears(startDate: string, years: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(startDate);
  if (!m) return startDate;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const base = new Date(Date.UTC(y, mo - 1, d));
  base.setUTCFullYear(base.getUTCFullYear() + years);
  return base.toISOString().slice(0, 10);
}

/** 中国大陆、香港、澳门、台湾在「是否出国赛」判定中视为同一地区（iso2 / WCA country_id） */
const GREATER_CHINA_ISO2 = new Set(['CN', 'HK', 'MO', 'TW']);

function regionKeyForOverseasCompare(countryId: string, iso2: string): string | null {
  const iso = (iso2 || '').trim().toUpperCase();
  if (GREATER_CHINA_ISO2.has(iso)) return '__GREATER_CHINA__';

  const raw = (countryId || '').trim();
  if (!raw && !iso) return null;

  const firstSeg = raw.split(',')[0]?.trim() ?? raw;
  const compact = firstSeg.toLowerCase().replace(/[\s_-]+/g, '');
  if (
    compact === 'china' ||
    compact === 'hongkong' ||
    compact === 'macau' ||
    compact === 'macao' ||
    compact === 'taiwan' ||
    compact === 'chinesetaipei'
  ) {
    return '__GREATER_CHINA__';
  }

  if (iso) return `iso:${iso}`;
  if (raw) return `id:${raw}`;
  return null;
}

/**
 * 比赛举办地与选手 WCA 注册地是否一致（优先 country_id，缺失时比 country_iso2）。
 * 中国内地、香港、澳门、台湾之间互不算「出国」；文案仍沿用现有里程碑描述。
 */
export function competitionCountryMatchesProfile(
  comp: WCACompetition,
  profile: WcaProfile,
): boolean {
  const keyC = regionKeyForOverseasCompare(comp.country_id || '', comp.country_iso2 || '');
  const keyP = regionKeyForOverseasCompare(profile.countryId || '', profile.country_iso2 || '');

  if (keyP !== null && keyC !== null) {
    return keyP === keyC;
  }

  const pid = (profile.countryId || '').trim();
  const cid = (comp.country_id || '').trim();
  if (pid && cid) return cid === pid;
  const isoP = (profile.country_iso2 || '').toUpperCase();
  const isoC = (comp.country_iso2 || '').toUpperCase();
  if (!isoP || !isoC) return true;
  return isoC === isoP;
}

/** 按成绩时间线首次出现的比赛 ID 顺序（与 sortResultsByCompDate 一致时需传入已排序成绩） */
export function createFirstOverseasCompetitionMilestone(
  sortedResults: WCAResult[],
  compMap: Map<string, WCACompetition>,
  wcaProfile: WcaProfile,
  formatMessage: FormatMessageFn,
): Milestone[] {
  const visitOrder: string[] = [];
  const seen = new Set<string>();
  for (const r of sortedResults) {
    if (seen.has(r.competition_id)) continue;
    seen.add(r.competition_id);
    visitOrder.push(r.competition_id);
  }

  let firstCompId: string | undefined;
  for (const compId of visitOrder) {
    const comp = compMap.get(compId);
    if (!comp) continue;
    if (firstCompId === undefined) firstCompId = compId;
    if (competitionCountryMatchesProfile(comp, wcaProfile)) continue;

    if (compId === firstCompId) return [];

    return [
      {
        type: 'first_overseas_competition',
        description: formatMessage({ id: 'wca.milestone.desc.first_overseas_competition' }),
        date: comp.start_date,
        competition_id: comp.id,
        competition_name: comp.name,
        overseas_country_iso2: comp.country_iso2,
        overseas_country_id: comp.country_id,
      },
    ];
  }
  return [];
}

/**
 * 参赛满 10 / 15 / 20… 周年：首秀日起满 N 年后的「首场」比赛（start_date 严格晚于 N 周年日），
 * 若与上一档周年落在同一场比赛则不重复生成。
 */
export function createCompetingAnniversaryMilestones(
  sortedComps: WCACompetition[],
  formatMessage: FormatMessageFn,
): Milestone[] {
  if (sortedComps.length === 0) return [];

  const firstDate = sortedComps[0].start_date;
  const milestones: Milestone[] = [];
  let lastEmittedCompId: string | null = null;

  for (let n = 10; n <= 100; n += 5) {
    const threshold = addCalendarYears(firstDate, n);
    const hit = sortedComps.find((c) => c.start_date > threshold);
    if (!hit) break;
    if (lastEmittedCompId !== null && hit.id === lastEmittedCompId) continue;

    milestones.push({
      type: 'competing_anniversary',
      description: formatMessage({ id: 'wca.milestone.desc.competing_anniversary' }, { years: n }),
      anniversary_years: n,
      date: hit.start_date,
      competition_id: hit.id,
      competition_name: hit.name,
    });
    lastEmittedCompId = hit.id;
  }

  return milestones;
}

export function getCompName(name: string): string {
  const findName = findCubingCompetitionByIdentifier(name);
  if (findName) {
    return findName.name;
  }
  return name;
}

// createFirstCompetitionMilestone 首次参赛里程碑
export function createFirstCompetitionMilestone(
  firstComp: WCACompetition,
  formatMessage: FormatMessageFn,
): Milestone {
  const year = parseInt(firstComp.start_date.substring(0, 4), 10);

  return {
    type: 'first_competition',
    description: formatMessage({ id: 'wca.milestone.desc.first_competition' }),
    year,
    competition_id: firstComp.id,
    competition_name: firstComp.name,
    date: firstComp.start_date,
  };
}

export function createSignificantImprovementMilestones(
  wcaResultMap: Record<string, WCAResult[]>,
  compMap: Map<string, WCACompetition>,
  improvementNumber: number = 33,
  formatMessage: FormatMessageFn,
): Milestone[] {
  // 临时存储：key = `${competition_id}-${event_id}`
  const tempMap = new Map<string, {
    eventId: string;
    competitionId: string;
    date: string | undefined;
    single: { old: number; new: number; percent: number } | null;
    average: { old: number; new: number; percent: number } | null;
  }>();

  for (const [eventId, results] of Object.entries(wcaResultMap)) {
    if (results.length < 2 || eventId === '333mbf') {
      continue;
    }
    const history = [...results].reverse();


    let currentBestSingle = history[0].best;
    let currentBestAvg = history[0].average;



    for (let i = 1; i < history.length; i++) {
      const entry = history[i];
      const compId = entry.competition_id;
      const key = `${compId}-${eventId}`;
      const date = getCompetitionDateFromResult(compMap, entry);

      let record = tempMap.get(key);
      if (!record) {
        record = {
          eventId,
          competitionId: compId,
          date,
          single: null,
          average: null,
        };
      }

      // Check single
      if (entry.best > 0 && entry.best < currentBestSingle) {
        const improvementPercent = ((currentBestSingle - entry.best) / currentBestSingle) * 100;
        if (improvementPercent >= improvementNumber) {
          record.single = {
            old: currentBestSingle,
            new: entry.best,
            percent: improvementPercent,
          };
        }
        currentBestSingle = entry.best; // update best even if not milestone
      }

      // Check average
      if (entry.average > 0 && entry.average < currentBestAvg) {
        const improvementPercent = ((currentBestAvg - entry.average) / currentBestAvg) * 100;
        if (improvementPercent >= improvementNumber) {
          record.average = {
            old: currentBestAvg,
            new: entry.average,
            percent: improvementPercent,
          };
        }
        currentBestAvg = entry.average; // update best even if not milestone
      }

      // Only store if at least one qualifies
      if (record.single || record.average) {
        tempMap.set(key, record);
      }
    }
  }

  // Now convert tempMap to final Milestone[]
  const milestones: Milestone[] = [];
  for (const record of tempMap.values()) {
    const { eventId, competitionId, date, single, average } = record;

    let description = '';
    let best_is_average: boolean | undefined = undefined;
    let best_is_single: boolean | undefined = undefined;
    let old_best_time: number | undefined = undefined;
    let new_best_time: number | undefined = undefined;

    let old_best_avg_time : number | undefined = undefined;
    let new_best_avg_time: number | undefined = undefined;


    let percentage_improved: number | undefined = undefined;

    if (single && average) {
      // 双刷：合并描述
      description = formatMessage(
        { id: 'wca.milestone.desc.improvement_both' },
        {
          event: CubesCn(eventId),
          singlePercent: single.percent.toFixed(2),
          avgPercent: average.percent.toFixed(2),
        },
      );
      // 注意：此时无法用单一 old/new time 表示，但根据原结构可能仍需保留字段
      // 可选：扩展 Milestone 类型支持 dual improvement，但若不能改类型，可优先展示单次或设为 null
      // 这里按你的原始结构，我们保留单次为主（或根据需求调整）
      old_best_time = single.old;
      new_best_time = single.new;
      old_best_avg_time = average.old;
      new_best_avg_time = average.new;
      percentage_improved = single.percent;
      best_is_average = true
      best_is_single = true
    } else if (single) {
      description = formatMessage(
        { id: 'wca.milestone.desc.improvement_single' },
        { event: CubesCn(eventId), percent: single.percent.toFixed(2) },
      );
      old_best_time = single.old;
      new_best_time = single.new;
      percentage_improved = single.percent;
      best_is_average = false;
      best_is_single = true
    } else if (average) {
      description = formatMessage(
        { id: 'wca.milestone.desc.improvement_avg' },
        { event: CubesCn(eventId), percent: average.percent.toFixed(2) },
      );
      old_best_time = average.old;
      new_best_time = average.new;
      old_best_avg_time = average.old;
      new_best_avg_time = average.new;
      percentage_improved = average.percent;
      best_is_average = true;
      best_is_single = false
    } else {
      continue; // should not happen
    }

    milestones.push({
      type: 'significant_improvement',
      description,
      competition_id: competitionId,
      event_id: eventId,
      old_best_time,
      new_best_time,
      old_best_avg_time,
      new_best_avg_time,
      best_is_average,
      best_is_single,
      percentage_improved,
      date,
    });
  }

  return milestones;
}

export function createNthCompetitionMilestones(
  sortedComps: WCACompetition[],
  formatMessage: FormatMessageFn,
): Milestone[] {
  const milestones: Milestone[] = [];
  const total = sortedComps.length;

  // 从 100 开始，每 100 场检查一次
  for (let n = 100; n <= total; n += 100) {
    const comp = sortedComps[n - 1]; // 第 n 场（索引 n-1）
    if (!comp) continue;

    milestones.push({
      type: 'nth_competition',
      description: formatMessage({ id: 'wca.milestone.desc.nth_competition' }, { n }),
      nth_competition_count: n,
      competition_id: comp.id,
      competition_name: comp.name,
      date: comp.start_date,
    });
  }

  return milestones;
}
export function createGrandSlamMilestone(
  results: WCAResult[],
  compMap: Map<string, WCACompetition>,
  formatMessage: FormatMessageFn,
): Milestone[] {
  const firstAchieved: Record<
    string,
    { single?: { date: string; compId: string }; average?: { date: string; compId: string } }
  > = {};

  for (const eventId of eventOrder) {
    firstAchieved[eventId] = {};
  }

  const sortedResults = [...results].sort((a, b) => {
    const compA = compMap.get(a.competition_id);
    const compB = compMap.get(b.competition_id);
    if (!compA || !compB) return 0;
    return compA.start_date.localeCompare(compB.start_date);
  });

  let earliestDate: string | null = null;

  for (const res of sortedResults) {
    if (!eventOrder.includes(res.event_id)) continue;
    const comp = compMap.get(res.competition_id);
    if (!comp) continue;

    // 更新最早有效成绩日期（只要 best > 0 或 average > 0）
    if ((res.best > 0 || (res.average > 0 && res.event_id !== '333mbf'))) {
      if (!earliestDate || comp.start_date < earliestDate) {
        earliestDate = comp.start_date;
      }
    }

    const record = firstAchieved[res.event_id];

    if (res.best > 0 && !record.single) {
      record.single = { date: comp.start_date, compId: comp.id };
    }

    if (res.average > 0 && !record.average && res.event_id !== '333mbf') {
      record.average = { date: comp.start_date, compId: comp.id };
    }
  }

  const allCompleted = eventOrder.every((eventId) => {
    if (eventId === '333ft'){
      return true;
    }
    const rec = firstAchieved[eventId];
    if (eventId === '333mbf') return !!rec.single;
    return !!rec.single && !!rec.average;
  });

  if (!allCompleted || !earliestDate) return [];

  const achievePoints: { date: string; compId: string }[] = [];
  for (const eventId of eventOrder) {
    const rec = firstAchieved[eventId];
    if (eventId === '333mbf') {
      if (rec.single) achievePoints.push(rec.single);
    } else {
      if (rec.single) achievePoints.push(rec.single);
      if (rec.average) achievePoints.push(rec.average);
    }
  }

  let latestPoint = achievePoints[0];
  for (const point of achievePoints) {
    if (point.date > latestPoint.date) {
      latestPoint = point;
    }
  }

  const finalComp = compMap.get(latestPoint.compId);
  // === 计算天数 ===
  const start = new Date(earliestDate);
  const end = new Date(latestPoint.date);
  const timeDiff = end.getTime() - start.getTime();
  const daysUsed = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1; // 包含首尾日

  return [
    {
      type: 'grand_slam',
      description: formatMessage({ id: 'wca.milestone.desc.grand_slam' }, { days: daysUsed }),
      achieved_on: latestPoint.date,
      competition_id: latestPoint.compId,
      competition_name: finalComp?.name,
      date: latestPoint.date,
    },
  ];
}
const BLIND_EVENTS = new Set(['333bf', '444bf', '555bf', '333mbf']);

export function createFirstBlindfoldedSuccessMilestones(
  results: WCAResult[],
  compMap: Map<string, WCACompetition>,
  formatMessage: FormatMessageFn,
): Milestone[] {
  // 记录每个 event 的首次 single/average 信息
  const firstRecords: Record<
    string,
    {
      single?: { result: number; compId: string; date: string };
      average?: { result: number; compId: string; date: string };
    }
  > = {};

  // 初始化
  for (const eventId of BLIND_EVENTS) {
    firstRecords[eventId] = {};
  }

  // 按比赛时间排序
  const sortedResults = [...results].sort((a, b) => {
    const compA = compMap.get(a.competition_id);
    const compB = compMap.get(b.competition_id);
    if (!compA || !compB) return 0;
    return compA.start_date.localeCompare(compB.start_date);
  });

  // 第一遍：记录首次有效成绩
  for (const res of sortedResults) {
    if (!BLIND_EVENTS.has(res.event_id)) continue;
    const comp = compMap.get(res.competition_id);
    if (!comp) continue;

    const record = firstRecords[res.event_id];

    // 首次有效单次
    if (res.best > 0 && !record.single) {
      record.single = {
        result: res.best,
        compId: comp.id,
        date: comp.start_date,
      };
    }

    // 首次有效平均（333mbf 无 average）
    if (res.average > 0 && res.event_id !== '333mbf' && !record.average) {
      record.average = {
        result: res.average,
        compId: comp.id,
        date: comp.start_date,
      };
    }
  }

  const milestones: Milestone[] = [];

  // 第二遍：生成里程碑
  for (const [eventId, { single, average }] of Object.entries(firstRecords)) {
    const compSingle = single ? compMap.get(single.compId) : null;
    const compAverage = average ? compMap.get(average.compId) : null;

    // 单独处理单次
    if (single && (!average || single.compId !== average.compId)) {
      milestones.push({
        type: 'first_blindfolded_success',
        description: formatMessage(
          { id: 'wca.milestone.desc.bld_single' },
          {
            event: CubesCn(eventId),
            time: resultsTimeFormat(single.result, eventId, false),
          },
        ),
        event_id: eventId,
        result: single.result,
        date_achieved: single.date,
        competition_id: single.compId,
        competition_name: compSingle?.name ?? '',
      });
    }

    // 单独处理平均
    if (average && (!single || single.compId !== average.compId)) {
      milestones.push({
        type: 'first_blindfolded_success',
        description: formatMessage(
          { id: 'wca.milestone.desc.bld_avg' },
          {
            event: CubesCn(eventId),
            time: resultsTimeFormat(average.result, eventId, true),
          },
        ),
        event_id: eventId,
        result: average.result,
        best_is_average: true,
        date_achieved: average.date,
        competition_id: average.compId,
        competition_name: compAverage?.name ?? '',
      });
    }

    // 合并：单次和平均在同一场比赛完成
    if (single && average && single.compId === average.compId) {
      milestones.push({
        type: 'first_blindfolded_success',
        description: formatMessage(
          { id: 'wca.milestone.desc.bld_both' },
          {
            event: CubesCn(eventId),
            singleTime: resultsTimeFormat(single.result, eventId, false),
            avgTime: resultsTimeFormat(average.result, eventId, true),
          },
        ),
        event_id: eventId,
        result: single.result,
        // average_result: average.result,
        best_is_average: false, // 主 result 是单次，但可额外传 average_result
        date_achieved: single.date, // 两者日期相同
        competition_id: single.compId,
        competition_name: compSingle?.name ?? '',
      });
    }
  }

  return milestones;
}

// createFirstPodiumMilestones

export function createComebackMilestone(
  sortedComps: WCACompetition[],
  formatMessage: FormatMessageFn,
): Milestone[] {
  if (sortedComps.length < 2) return [];

  for (let i = 1; i < sortedComps.length; i++) {
    const prev = new Date(sortedComps[i - 1].start_date);
    const curr = new Date(sortedComps[i].start_date);
    const gapYears = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (gapYears >= 5) {
      return [
        {
          type: 'comeback',
          description: formatMessage(
            { id: 'wca.milestone.desc.comeback' },
            { years: gapYears.toFixed(0) },
          ),
          competition_id: sortedComps[i].id,
          last_competition_date: sortedComps[i - 1].start_date,
          new_competition_date: sortedComps[i].start_date,
        },
      ];
    }
  }
  return [];
}

export function createFirstPodiumMilestones(
  results: WCAResult[],
  compMap: Map<string, WCACompetition>,
  formatMessage: FormatMessageFn,
): Milestone[] {
  const milestones: Milestone[] = [];
  const firstPodiumAchieved = new Set<string>(); // 首次领奖台成就
  const firstGoldAchieved = new Set<string>(); // 首次金牌成就

  for (const res of results) {
    if (res.round_type_id !== 'f' && res.round_type_id !== 'c' && res.round_type_id !== 'b')
      continue; // 只考虑决赛轮次

    if (res.best <= 0){ // DNF
      continue
    }

    if (res.pos < 1 || res.pos > 3) continue; // 只考虑前三名

    const comp = compMap.get(res.competition_id);
    if (!comp) continue;

    const eventId = res.event_id;
    const isGold = res.pos === 1;

    let resultStr = `${resultsTimeFormat(res.best, res.event_id, false)}`
    if (res.average > 0){
      resultStr += ` / ${resultsTimeFormat(res.average, res.event_id, true)}`;
    }




    // 如果是首次获得金牌
    if (isGold && !firstGoldAchieved.has(eventId)) {
      firstGoldAchieved.add(eventId);
      milestones.push({
        type: 'first_podium',
        description: formatMessage(
          { id: 'wca.milestone.desc.podium_gold' },
          { result: resultStr, event: CubesCn(eventId) },
        ),
        event_id: eventId,
        competition_id: res.competition_id,
        round_type_id: res.round_type_id,
        position: res.pos,
        date: comp.start_date,
      });
    }

    // 如果是首次登上领奖台（但不是首次金牌）
    if (!firstPodiumAchieved.has(eventId) && !isGold) {
      firstPodiumAchieved.add(eventId);
      milestones.push({
        type: 'first_podium',
        description: formatMessage(
          { id: 'wca.milestone.desc.podium_other' },
          { result: resultStr, event: CubesCn(eventId) },
        ),
        event_id: eventId,
        competition_id: res.competition_id,
        round_type_id: res.round_type_id,
        position: res.pos,
        date: comp.start_date,
      });
    }
  }

  return milestones;
}

export function createRecordBreakerMilestones(
  results: WCAResult[],
  compMap: Map<string, WCACompetition>,
  formatMessage: FormatMessageFn,
): Milestone[] {
  const milestones: Milestone[] = [];

  for (const res of results) {
    const comp = compMap.get(res.competition_id);
    if (!comp) continue;

    if (res.regional_single_record) {
      milestones.push({
        type: 'record_breaker',
        description: formatMessage(
          { id: 'wca.milestone.desc.record_single' },
          {
            event: CubesCn(res.event_id),
            time: resultsTimeFormat(res.best, res.event_id, false),
            record: res.regional_single_record,
          },
        ),
        event_id: res.event_id,
        competition_id: res.competition_id,
        record_type: res.regional_single_record,
        record_value: res.best,
        date: comp.start_date,
      });
    }
    if (res.regional_average_record) {
      milestones.push({
        type: 'record_breaker',
        description: formatMessage(
          { id: 'wca.milestone.desc.record_avg' },
          {
            event: CubesCn(res.event_id),
            time: resultsTimeFormat(res.average, res.event_id, false),
            record: res.regional_average_record,
          },
        ),
        event_id: res.event_id,
        record_type: res.regional_average_record,
        competition_id: res.competition_id,
        record_value: res.average,
        date: comp.start_date,
      });
    }
  }

  return milestones;
}

export function GetMilestones(
  wcaProfile: WcaProfile,
  wcaResults: WCAResult[],
  comps: WCACompetition[],
  improvementNumber: number = 33,
  formatMessage: FormatMessageFn,
): Milestone[] {
  if (comps.length === 0) return [];

  const sortedComps = sortCompsByDate(comps);
  const compMap = new Map(comps.map((c) => [c.id, c]));
  const sortedResults = [...wcaResults].sort((a, b) => {
    const compA = compMap.get(a.competition_id);
    const compB = compMap.get(b.competition_id);
    if (!compA || !compB) return 0;
    return compA.start_date.localeCompare(compB.start_date) || a.event_id.localeCompare(b.event_id);
  });

  const wcaResultMap: Record<string, WCAResult[]> = {};
  for (const result of wcaResults) {
    if (!wcaResultMap[result.event_id]) {
      wcaResultMap[result.event_id] = [];
    }
    wcaResultMap[result.event_id].push(result);
  }

  const milestones: Milestone[] = [];
  // 1. 首次参赛
  milestones.push(createFirstCompetitionMilestone(sortedComps[0], formatMessage));

  // 1b. 首次出国参赛（按成绩中比赛出现顺序；首秀即境外则不单独展示）
  milestones.push(
    ...createFirstOverseasCompetitionMilestone(sortedResults, compMap, wcaProfile, formatMessage),
  );

  // 1c. 参赛 10 / 15 / 20… 周年
  milestones.push(...createCompetingAnniversaryMilestones(sortedComps, formatMessage));

  // 2. 百次参赛
  milestones.push(...createNthCompetitionMilestones(sortedComps, formatMessage));

  // 3. 成绩突破
  milestones.push(
    ...createSignificantImprovementMilestones(wcaResultMap, compMap, improvementNumber, formatMessage),
  );

  // 4. 全项目达成（原大满贯：全官方项目序列内按要求集齐首次成绩）
  milestones.push(...createGrandSlamMilestone(wcaResults, compMap, formatMessage));

  // 5. 盲拧有效成绩
  milestones.push(...createFirstBlindfoldedSuccessMilestones(wcaResults, compMap, formatMessage));

  // 6. 回归
  milestones.push(...createComebackMilestone(sortedComps, formatMessage));

  // 7. 首次领奖台
  milestones.push(...createFirstPodiumMilestones(sortedResults, compMap, formatMessage));

  // 8. 记录
  milestones.push(...createRecordBreakerMilestones(sortedResults, compMap, formatMessage));

  // 9. 首次三阶平均 sub-10（附此前各轮次）
  milestones.push(...createFirst333AverageSub10Milestone(wcaResults, compMap, formatMessage));

  // 10. 首次单届 ≥3 领奖台
  milestones.push(
    ...createFirstTriplePodiumCompetitionMilestone(wcaResults, sortedComps, formatMessage),
  );

  // 11. 单年高频参赛（>15 场，当年最后一场）
  milestones.push(...createBusyYearMilestones(sortedComps, formatMessage));

  // 12. 单届多金（每场符合各一条）
  milestones.push(
    ...createMultiGoldCompetitionMilestones(wcaResults, sortedComps, formatMessage),
  );

  return milestones;
}
