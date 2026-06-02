/**
 * 用户自定义公式 - 存储
 *
 * 存储 key: algs_custom_formulas
 * 结构: Record<string, string[]>  其中 key 为 buildAlgsKey 生成的复合键
 */

const LS_KEY = 'algs_custom_formulas';

export function getCustomAlgs(algsKey: string): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Record<string, unknown>;
    const val = data[algsKey];
    if (!Array.isArray(val)) return [];
    return val.filter((v): v is string => typeof v === 'string');
  } catch {
    return [];
  }
}

export function saveCustomAlgs(algsKey: string, formulas: string[]): void {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const data: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    data[algsKey] = formulas;
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function addCustomAlg(algsKey: string, formula: string): void {
  const algs = getCustomAlgs(algsKey);
  algs.push(formula);
  saveCustomAlgs(algsKey, algs);
}

export function removeCustomAlg(algsKey: string, index: number): void {
  const algs = getCustomAlgs(algsKey);
  algs.splice(index, 1);
  saveCustomAlgs(algsKey, algs);
}
