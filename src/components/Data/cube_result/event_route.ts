import { readStoredLocale, type Locale } from '@/i18n/locales';
import { translateDomain, type DomainMessageKey } from '@/i18n/messages/domain';

export const Not = 0;               // 非比赛项目
export const OneRound = 1;          // "1_r" 单轮项目
export const ThreeRoundsBest = 2;   // "3_r_b" 三轮取最佳
export const ThreeRoundsAvgWithInteger = 3; // "3_r_a_i" 三轮取平均 单次取整
export const ThreeRoundsAvg = 4;    // "3_r_a" 三轮取平均
export const FiveRoundsBest = 5;    // "5_r_b" 五轮取最佳
export const FiveRoundsAvg = 6;     // "5_r_a" 五轮取平均
export const FiveRoundsAvgHT = 7;   // "5_r_a_ht" 五轮去头尾取平均
export const Repeatedly = 8;        // "ry" 单轮多次还原项目
export const TwoRepeatedlyBest = 9; // "2ry" 两轮多次尝试取最佳
export const ThreeRepeatedlyBest = 10; // "3ry" 三轮尝试多次还原项目


interface RouteMap {
  name: string;               // 名称
  integer?: boolean;         // 成绩取整数 fmc项目
  repeatedly?: boolean;      // 是否多轮还原项目
  repeatedlyNum?: number;    // 多轮还原项目的轮次
  rounds: number;           // 成绩数
  withBest?: boolean;       // 取最佳
  headToTailNum?: number;   // 去头尾的数量
  notComp?: boolean;        // 是否非比赛项目
}

export const RouteMaps: Map<number, RouteMap> = new Map<number, RouteMap>([
  [Not, {get name() { return eventRouteName(Not); }, notComp: true} as RouteMap],
  [OneRound, {get name() { return eventRouteName(OneRound); }, rounds: 1, withBest: true}],
  [ThreeRoundsBest, {get name() { return eventRouteName(ThreeRoundsBest); }, rounds: 3, withBest: true}],
  [ThreeRoundsAvgWithInteger, {get name() { return eventRouteName(ThreeRoundsAvgWithInteger); }, integer: true, rounds: 3}],
  [ThreeRoundsAvg, {get name() { return eventRouteName(ThreeRoundsAvg); }, rounds: 3}],
  [FiveRoundsBest, {get name() { return eventRouteName(FiveRoundsBest); }, rounds: 5, withBest: true, headToTailNum: 1}],
  [FiveRoundsAvg, {get name() { return eventRouteName(FiveRoundsAvg); }, rounds: 5, headToTailNum: 0}],
  [FiveRoundsAvgHT, {get name() { return eventRouteName(FiveRoundsAvgHT); }, rounds: 5, headToTailNum: 1}],
  [Repeatedly, {get name() { return eventRouteName(Repeatedly); }, repeatedly: true, repeatedlyNum: 1, rounds: 3, withBest: true}],
  [TwoRepeatedlyBest, {get name() { return eventRouteName(TwoRepeatedlyBest); }, repeatedly: true, repeatedlyNum: 2, rounds: 6, withBest: true}],
  [ThreeRepeatedlyBest, {get name() { return eventRouteName(ThreeRepeatedlyBest); }, repeatedly: true, repeatedlyNum: 3, rounds: 9, withBest: true}],
])


export function eventRouteName(route: number, locale: Locale = readStoredLocale()): string {
  return RouteMaps.has(route) ? translateDomain(locale, `domain.route.${route}` as DomainMessageKey) : String(route);
}

export const eventRouteM = (route: number, locale?: Locale):RouteMap => {
  const entry = RouteMaps.get(route) as RouteMap;
  return entry && locale ? { ...entry, name: eventRouteName(route, locale) } : entry;
}
