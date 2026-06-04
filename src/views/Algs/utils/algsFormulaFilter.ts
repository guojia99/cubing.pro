import { buildFormulaKey } from '@/services/cubing-pro/algs/formulaPracticeSelection';
import type { AlgClassDetail } from '@/services/cubing-pro/algs/algs';

export function collectAllFormulaKeys(data: AlgClassDetail): string[] {
  const keys: string[] = [];
  (data.sets ?? []).forEach((set) => {
    const gKeys = set.groups_keys ?? set.groups?.map((g) => g.name) ?? [];
    const groups = set.groups ?? [];
    gKeys.forEach((gName, gi) => {
      (groups[gi]?.algs ?? []).forEach((alg) => {
        keys.push(buildFormulaKey(set.name, gName, alg.name));
      });
    });
  });
  return keys;
}

export function collectVisibleFormulaKeys(
  data: AlgClassDetail,
  selectedSets: string[],
  selectedGroups: string[],
): string[] {
  const keys: string[] = [];
  (data.sets ?? []).forEach((set) => {
    if (!selectedSets.includes(set.name)) return;
    const gKeys = set.groups_keys ?? set.groups?.map((g) => g.name) ?? [];
    const groups = set.groups ?? [];
    gKeys.forEach((gName, gi) => {
      const gKey = `${set.name}:${gName}`;
      if (!selectedGroups.includes(gKey)) return;
      (groups[gi]?.algs ?? []).forEach((alg) => {
        keys.push(buildFormulaKey(set.name, gName, alg.name));
      });
    });
  });
  return keys;
}
