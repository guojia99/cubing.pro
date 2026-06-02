import type { AlgorithmClass } from '@/services/cubing-pro/algs/typings';
import { buildFormulaKey } from '@/services/cubing-pro/algs/formulaPracticeSelection';

/** 收集公式库内全部公式 key（set:group:name） */
export function collectAllFormulaKeys(data: AlgorithmClass): string[] {
  const keys: string[] = [];
  (data.sets ?? []).forEach((set) => {
    const groupKeys = set.groups_keys ?? [];
    const groups = set.groups ?? [];
    groupKeys.forEach((gName, gi) => {
      (groups[gi]?.algs ?? []).forEach((alg) => {
        keys.push(buildFormulaKey(set.name, gName, alg.name));
      });
    });
  });
  return keys;
}

/** 当前集合/分组筛选下可见的公式 key */
export function collectVisibleFormulaKeys(
  data: AlgorithmClass,
  selectedSets: string[],
  selectedGroups: string[],
): string[] {
  const keys: string[] = [];
  (data.sets ?? []).forEach((set) => {
    if (!selectedSets.includes(set.name)) return;
    const groupKeys = set.groups_keys ?? [];
    const groups = set.groups ?? [];
    groupKeys.forEach((gName, gi) => {
      const groupKey = `${set.name}:${gName}`;
      if (!selectedGroups.includes(groupKey)) return;
      (groups[gi]?.algs ?? []).forEach((alg) => {
        keys.push(buildFormulaKey(set.name, gName, alg.name));
      });
    });
  });
  return keys;
}
