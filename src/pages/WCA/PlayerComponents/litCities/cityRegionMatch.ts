/**
 * 城市字符串 → 地图上的地级市/县市级 feature 名。
 * 数据来自 scripts/build-lit-cities-aliases.mjs 生成的 JSON（行政区划 + 拼音），禁止在此硬编码城市列表。
 */

import chinaTable from './data/chinaPrefectureAliasTable.json';
import taiwanTable from './data/taiwanCountyAliasTable.json';
import { safeGeoCount } from './safeCount';

type Pair = { alias: string; target: string };

const CHINA_PAIRS: Pair[] = chinaTable.pairs;
const TAIWAN_PAIRS: Pair[] = taiwanTable.pairs;

function hasHan(s: string): boolean {
  return /[\u4e00-\u9fff]/.test(s);
}

/** 别名命中：中文用包含；拉丁/数字别名用大小写不敏感包含 */
function haystackContainsAlias(haystack: string, alias: string): boolean {
  const a = alias.trim();
  if (!a) return false;
  if (hasHan(a)) {
    return haystack.includes(a);
  }
  return haystack.toLowerCase().includes(a.toLowerCase());
}

export function matchCityToPrefecture(
  city: string,
  prefectureNames: string[],
  opts?: { taiwan?: boolean },
): string | null {
  const set = new Set(prefectureNames);
  const pairs = opts?.taiwan ? TAIWAN_PAIRS : CHINA_PAIRS;

  const trimmed = city.trim();
  if (set.has(trimmed)) return trimmed;

  const headSeg = trimmed.split(/[,，(（]/)[0].trim();

  /** 拼音相同的若干地级市：省级 GeoJSON 内只会出现其中一个市级要素 */
  if (/^taizhou$/i.test(headSeg)) {
    if (set.has('台州市')) return '台州市';
    if (set.has('泰州市')) return '泰州市';
  }
  if (/^yichun$/i.test(headSeg)) {
    if (set.has('宜春市')) return '宜春市';
    if (set.has('伊春市')) return '伊春市';
  }
  if (/^suzhou$/i.test(headSeg)) {
    if (set.has('宿州市')) return '宿州市';
    if (set.has('苏州市')) return '苏州市';
  }
  if (/^fuzhou$/i.test(headSeg)) {
    if (set.has('抚州市')) return '抚州市';
    if (set.has('福州市')) return '福州市';
  }

  for (const n of prefectureNames) {
    if (trimmed.includes(n)) return n;
    if (n.includes(trimmed) && trimmed.length >= 2) return n;
  }

  const tryStrings = headSeg !== trimmed ? [trimmed, headSeg] : [trimmed];

  for (const hay of tryStrings) {
    for (const { alias, target } of pairs) {
      if (!set.has(target)) continue;
      if (haystackContainsAlias(hay, alias)) return target;
    }
  }

  return null;
}

export function aggregatePrefectureCounts(
  rows: { city: string; count: number }[],
  prefectureNames: string[],
  opts?: { taiwan?: boolean },
): { name: string; value: number }[] {
  const m = new Map<string, number>();
  let other = 0;
  for (const n of prefectureNames) m.set(n, 0);
  for (const row of rows) {
    const c = safeGeoCount(row.count);
    const hit = matchCityToPrefecture(row.city, prefectureNames, opts);
    if (hit) m.set(hit, (m.get(hit) || 0) + c);
    else other += c;
  }
  const out: { name: string; value: number }[] = prefectureNames.map(n => ({
    name: n,
    value: m.get(n) || 0,
  }));
  if (other > 0) out.push({ name: '__other__', value: other });
  return out;
}
