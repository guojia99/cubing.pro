const KEY_PREFIX = "algs_custom_";

export function getCustomAlgs(algsKey: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${algsKey}`);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function saveCustomAlgs(algsKey: string, formulas: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${KEY_PREFIX}${algsKey}`, JSON.stringify(formulas));
}

export function addCustomAlg(algsKey: string, formula: string) {
  const current = getCustomAlgs(algsKey);
  current.push(formula);
  saveCustomAlgs(algsKey, current);
}

export function removeCustomAlg(algsKey: string, index: number) {
  const current = getCustomAlgs(algsKey);
  current.splice(index, 1);
  saveCustomAlgs(algsKey, current);
}
