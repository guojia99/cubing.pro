import type { ExperimentalStickering } from 'cubing/twisty';

/**
 * cubing.js 支持的 experimentalStickering 名称（与 PuzzleLoader 中 experimentalStickerings 一致）。
 * 匹配时按字符串长度降序，避免「OLL」误匹配「COLL」「ZBLL」等。
 */
const STICKERING_NAMES_UNSORTED: readonly ExperimentalStickering[] = [
  'OLL',
  'PLL',
  'LL',
  'EOLL',
  'COLL',
  'OCLL',
  'CPLL',
  'CLL',
  'EPLL',
  'ELL',
  'ZBLL',
  'ZBLS',
  'LS',
  'LSOLL',
  'LSOCLL',
  'ELS',
  'CLS',
  'VLS',
  'WVLS',
  'F2L',
  'Daisy',
  'Cross',
  'EO',
  'EOline',
  'EOcross',
  'FirstBlock',
  'SecondBlock',
  'CMLL',
  'L10P',
  'L6E',
  'L6EO',
  '2x2x2',
  '2x2x3',
  'EODF',
  'G1',
  'full',
];

const STICKERING_MATCH_ORDER: readonly ExperimentalStickering[] = [...STICKERING_NAMES_UNSORTED].sort(
  (a, b) => b.length - a.length || a.localeCompare(b),
);

/** 整魔方训练阶段：不使用 experimentalSetupAnchor: end（OLL/PLL/CMLL 等扩展贴纸仍用 end） */
const STICKERING_NO_END_ANCHOR = new Set<ExperimentalStickering>([
  'F2L',
  'Cross',
  'Daisy',
  'EO',
  'EOline',
  'EOcross',
  'FirstBlock',
  'SecondBlock',
  'EODF',
  '2x2x2',
  '2x2x3',
  'G1',
  'full',
]);

function haystackContainsStickeringToken(haystack: string, token: string): boolean {
  const upper = haystack.toUpperCase();
  const t = token.toUpperCase();
  let from = 0;
  while (from <= upper.length) {
    const i = upper.indexOf(t, from);
    if (i < 0) return false;
    const beforeOk = i === 0 || !/[A-Z0-9]/.test(upper[i - 1]!);
    const afterOk = i + t.length >= upper.length || !/[A-Z0-9]/.test(upper[i + t.length]!);
    if (beforeOk && afterOk) return true;
    from = i + 1;
  }
  return false;
}

/**
 * 根据公式库层级名称解析 Twisty 的 experimentalStickering（如 OLL / PLL / CMLL / ZBLL）。
 * 优先精确匹配分组名，再在「classId + setName + groupName」中按最长关键词匹配。
 */
export function resolveTwistyStickering(
  classId: string,
  setName: string,
  groupName: string,
): ExperimentalStickering | null {
  const g = groupName.trim();
  if (g) {
    for (const token of STICKERING_MATCH_ORDER) {
      if (g.toUpperCase() === token.toUpperCase()) {
        return token;
      }
    }
  }
  const haystack = `${classId} ${setName} ${groupName}`;
  for (const token of STICKERING_MATCH_ORDER) {
    if (haystackContainsStickeringToken(haystack, token)) {
      return token;
    }
  }
  return null;
}

/** 与 cubing 文档中「末态展示」一致：非 Cross/F2L/EO 等整魔方阶段时使用 end 锚点 */
export function twistyStickeringUsesSetupAnchorEnd(stickering: ExperimentalStickering | null): boolean {
  return stickering !== null && !STICKERING_NO_END_ANCHOR.has(stickering);
}
