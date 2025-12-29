import { CubesCn } from '@/components/CubeIcon/cube';
import { eventOrder } from '@/pages/WCA/utils/events';
import { resultsTimeFormat } from '@/pages/WCA/utils/wca_results';
import { findCubingCompetitionByIdentifier } from '@/services/cubing-pro/cubing_china/cubing';
import { WCACompetition, WcaProfile, WCAResult } from '@/services/cubing-pro/wca/types';


export type MilestoneType =
  | 'first_competition'
  | 'comeback'
  | 'nth_competition'
  | 'grand_slam'
  | 'record_breaker'
  | 'first_podium'
  | 'first_blindfolded_success'
  | 'significant_improvement'


export  const MILESTONE_TYPE_PRIORITY: Record<MilestoneType, number> = {
  first_competition: 0,
  comeback: 1,
  nth_competition: 2,
  grand_slam: 3,
  record_breaker: 4,
  first_podium: 5,
  first_blindfolded_success: 6,
  significant_improvement: 7,
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

export function getCompName(name: string): string {
  const findName = findCubingCompetitionByIdentifier(name);
  if (findName) {
    return findName.name;
  }
  return name;
}

// createFirstCompetitionMilestone 首次参赛里程碑
export function createFirstCompetitionMilestone(firstComp: WCACompetition): Milestone {
  const year = parseInt(firstComp.start_date.substring(0, 4), 10);

  return {
    type: 'first_competition',
    description: `第一次参加比赛！`,
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
    const history = results.reverse()


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
        if (entry.event_id === '222'){
          console.log(entry.best, currentBestSingle);
        }

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
      description = `${CubesCn(eventId)} 同时刷新了单次(${single.percent.toFixed(2)}%)和平均(${average.percent.toFixed(2)}%)历史最佳成绩`;
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
      description = `${CubesCn(eventId)} 刷新(${single.percent.toFixed(2)}%)了自己的历史单次`;
      old_best_time = single.old;
      new_best_time = single.new;
      percentage_improved = single.percent;
      best_is_average = false;
      best_is_single = true
    } else if (average) {
      description = `${CubesCn(eventId)} 刷新(${average.percent.toFixed(2)}%)了自己的历史平均`;
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

export function createNthCompetitionMilestones(sortedComps: WCACompetition[]): Milestone[] {
  const milestones: Milestone[] = [];
  const total = sortedComps.length;

  // 从 100 开始，每 100 场检查一次
  for (let n = 100; n <= total; n += 100) {
    const comp = sortedComps[n - 1]; // 第 n 场（索引 n-1）
    if (!comp) continue;

    milestones.push({
      type: 'nth_competition',
      description: `第 ${n} 场 WCA 比赛！`,
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
): Milestone[] {
  // 记录每个 event 的 single/average 首次达成信息
  const firstAchieved: Record<
    string,
    { single?: { date: string; compId: string }; average?: { date: string; compId: string } }
  > = {};

  // 初始化
  for (const eventId of eventOrder) {
    firstAchieved[eventId] = {};
  }

  // 按时间顺序处理成绩（确保“首次”正确）
  const sortedResults = [...results].sort((a, b) => {
    const compA = compMap.get(a.competition_id);
    const compB = compMap.get(b.competition_id);
    if (!compA || !compB) return 0;
    return compA.start_date.localeCompare(compB.start_date);
  });

  for (const res of sortedResults) {
    if (!eventOrder.includes(res.event_id)) continue;
    const comp = compMap.get(res.competition_id);
    if (!comp) continue;

    const record = firstAchieved[res.event_id];

    // 记录首次有效 single
    if (res.best > 0 && !record.single) {
      record.single = { date: comp.start_date, compId: comp.id };
    }

    // 记录首次有效 average（333mbf 无 average）
    if (res.average > 0 && !record.average && res.event_id !== '333mbf') {
      record.average = { date: comp.start_date, compId: comp.id };
    }
  }

  // 检查是否全部达成
  const allCompleted = eventOrder.every((eventId) => {
    const rec = firstAchieved[eventId];
    if (eventId === '333mbf') return !!rec.single;
    return !!rec.single && !!rec.average;
  });

  if (!allCompleted) return [];

  // 收集所有“首次达成”的时间点
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

  // 找出最晚的那个（即真正完成大满贯的时刻）
  let latestPoint = achievePoints[0];
  for (const point of achievePoints) {
    if (point.date > latestPoint.date) {
      latestPoint = point;
    }
  }

  const finalComp = compMap.get(latestPoint.compId);
  if (!finalComp) return []; // 安全兜底

  return [
    {
      type: 'grand_slam',
      description: '达成了大满贯！',
      achieved_on: latestPoint.date,
      competition_id: latestPoint.compId,
      competition_name: finalComp.name,
      date: latestPoint.date,
    },
  ];
}

const BLIND_EVENTS = new Set(['333bf', '444bf', '555bf', '333mbf']);

export function createFirstBlindfoldedSuccessMilestones(
  results: WCAResult[],
  compMap: Map<string, WCACompetition>,
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
        description: ` ${CubesCn(eventId)} 首次获得有效单次成绩 ${resultsTimeFormat(
          single.result,
          eventId,
          false,
        )}`,
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
        description: ` ${CubesCn(eventId)} 首次获得有效平均成绩 ${resultsTimeFormat(
          average.result,
          eventId,
          true,
        )}`,
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
        description: ` ${CubesCn(eventId)} 首次同时获得有效单次和平均成绩 ${resultsTimeFormat(
          single.result,
          eventId,
          false,
        )} / ${resultsTimeFormat(average.result, eventId, true)}`,
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

export function createComebackMilestone(sortedComps: WCACompetition[]): Milestone[] {
  if (sortedComps.length < 2) return [];

  for (let i = 1; i < sortedComps.length; i++) {
    const prev = new Date(sortedComps[i - 1].start_date);
    const curr = new Date(sortedComps[i].start_date);
    const gapYears = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (gapYears >= 3) {
      return [
        {
          type: 'comeback',
          description: `在时隔${gapYears.toFixed(0)}年重新复出比赛`,
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
        description: `首次以成绩 (${resultStr}) 在 ${CubesCn(eventId)} 项目获得金牌`,
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
        description: `首次以成绩 (${resultStr}) 在  ${CubesCn(eventId)} 项目获得领奖台`,
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
): Milestone[] {
  const milestones: Milestone[] = [];

  for (const res of results) {
    const comp = compMap.get(res.competition_id);
    if (!comp) continue;

    if (res.regional_single_record) {
      milestones.push({
        type: 'record_breaker',
        description: `${CubesCn(res.event_id)} 以单次成绩${resultsTimeFormat(
          res.best,
          res.event_id,
          false,
        )}打破 ${res.regional_single_record} 记录`,
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
        description: `${CubesCn(res.event_id)} 以平均成绩${resultsTimeFormat(
          res.average,
          res.event_id,
          false,
        )}打破 ${res.regional_average_record} 记录`,
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
  improvementNumber: number = 33
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
  milestones.push(createFirstCompetitionMilestone(sortedComps[0]));

  // 2. 百次参赛
  milestones.push(...createNthCompetitionMilestones(sortedComps));

  // 3. 成绩突破
  milestones.push(...createSignificantImprovementMilestones(wcaResultMap, compMap, improvementNumber));

  // 4. 大满贯
  milestones.push(...createGrandSlamMilestone(wcaResults, compMap));

  // 5. 盲拧有效成绩
  milestones.push(...createFirstBlindfoldedSuccessMilestones(wcaResults, compMap));

  // 6. 回归
  milestones.push(...createComebackMilestone(sortedComps));

  // 7. 首次领奖台
  milestones.push(...createFirstPodiumMilestones(sortedResults, compMap));

  // 8. 记录
  milestones.push(...createRecordBreakerMilestones(sortedResults, compMap));

  return milestones;
}
