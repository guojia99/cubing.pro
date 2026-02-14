/**
 * 公式练习器配置
 */

const LS_KEY_PREFIX = 'algs:formula_practice_config:';

export interface FormulaPracticeConfig {
  /** 去头尾比例 0-50，表示去掉最大和最小各 trimRatio% 的数据 */
  trimRatio: number;
  /** 权重模式下，练习完成后是否提醒标记熟练度 */
  remindProficiency: boolean;
}

const DEFAULT_CONFIG: FormulaPracticeConfig = {
  trimRatio: 5,
  remindProficiency: true,
};

function getStorageKey(cube: string, classId: string): string {
  return `${LS_KEY_PREFIX}${encodeURIComponent(cube)}-${encodeURIComponent(classId)}`;
}

export function getFormulaPracticeConfig(
  cube: string,
  classId: string,
): FormulaPracticeConfig {
  try {
    const raw = localStorage.getItem(getStorageKey(cube, classId));
    if (!raw) return { ...DEFAULT_CONFIG };
    const data = JSON.parse(raw) as Partial<FormulaPracticeConfig>;
    return {
      trimRatio: typeof data.trimRatio === 'number' ? Math.max(0, Math.min(50, data.trimRatio)) : DEFAULT_CONFIG.trimRatio,
      remindProficiency: typeof data.remindProficiency === 'boolean' ? data.remindProficiency : DEFAULT_CONFIG.remindProficiency,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveFormulaPracticeConfig(
  cube: string,
  classId: string,
  config: Partial<FormulaPracticeConfig>,
): void {
  if (!cube || !classId) return;
  try {
    const current = getFormulaPracticeConfig(cube, classId);
    const next = { ...current, ...config };
    localStorage.setItem(getStorageKey(cube, classId), JSON.stringify(next));
  } catch {
    // ignore
  }
}
