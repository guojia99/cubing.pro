import { WCAResult } from '@/services/wca/types';


export const eventOrder = [
  '333',
  '222',
  '444',
  '555',
  '666',
  '777',
  '333bf',
  '333fm',
  '333oh',
  'clock',
  'minx',
  'pyram',
  'skewb',
  'sq1',
  '444bf',
  '555bf',
  '333mbf',
];

export function getCompsEvents(wcaResults: WCAResult[]): Map<string, string[]> {
  const competitionEventMap = new Map<string, string[]>();
  const tempMap = new Map<string, Set<string>>();
  if (!wcaResults) {
    return competitionEventMap;
  }
  wcaResults.forEach((result) => {
    const { competition_id, event_id } = result;

    if (!tempMap.has(competition_id)) {
      tempMap.set(competition_id, new Set<string>());
    }

    tempMap.get(competition_id)!.add(event_id);
  });
  tempMap.forEach((eventSet, compId) => {
    competitionEventMap.set(compId, Array.from(eventSet).sort());
  });
  console.log(competitionEventMap);
  return competitionEventMap;
}

// https://github.com/thewca/worldcubeassociation.org/blob/d865d73de590e330a4500fb8881607953c35efe7/config/locales/zh-CN.yml#L168
// 轮次类型中文映射
export const roundNameMap: Record<string, string> = {
  '0': '资格赛',
  '1': '初赛',
  '2': '复赛',
  '3': '半决赛',
  b: 'B组决赛',
  c: '组合制决赛',
  d: '组合制初赛',
  e: '组合制复赛',
  f: '决赛',
  g: '组合制半决赛',
  h: '组合制资格赛',
};

// 轮次排序优先级：从早到晚
// 轮次排序优先级：从 高 到 低（决赛在最前）
export const roundSortOrder: Record<string, number> = {
  f: 1, // 决赛
  c: 1, // 组合制决赛
  b: 1, // B组决赛
  '3': 3, // 半决赛
  g: 3, // 组合制半决赛
  '2': 5, // 复赛
  e: 5, // 组合制复赛
  '1': 7, // 初赛
  d: 7, // 组合制初赛
  h: 9, // 组合制资格赛
  '0': 9, // 资格赛
};
// 轮次颜色映射（按阶段区分）
export const roundColorMap: Record<string, string> = {
  // 资格/预选阶段
  '0': 'default',
  h: 'default', // 灰色

  // 常规晋级阶段
  '1': 'blue',
  '2': 'geekblue',
  '3': 'purple',

  // 组合制阶段
  d: 'orange',
  e: 'gold',
  g: 'magenta',
  b: 'volcano',

  // 决赛阶段
  c: 'red',
  f: 'green',
};

export const getRecordColor = (type: string) => {
  if (type.includes('WR')) return 'red';
  if (type.includes('NR')) return 'green';
  if (type.includes('AsR')) return 'orange';
  return 'gold';
};
