/** 群赛计时器外观（本地 + 可选云端 KV） */

export const GROUP_TIMER_UI_STORAGE_KEY = 'cubingPro.groupTimerUi.v1';

export type GroupTimerUiConfig = {
  version: 1;
  /** 成绩录入方式：计时器为按住松手计时，手动为键盘输入时间 */
  inputMode: 'manual' | 'timer';
  /** 打乱区字号 px */
  scrambleFontPx: number;
  /** 全屏背景，空字符串表示使用主题默认 */
  fullscreenBg: string;
  /** 计时大框最小高度（vh） */
  timerTapMinVh: number;
  /** 顶部项目/轮次/第几把 字号 px */
  metaFontPx: number;
};

export function defaultGroupTimerUi(): GroupTimerUiConfig {
  return {
    version: 1,
    inputMode: 'timer',
    scrambleFontPx: 18,
    fullscreenBg: '',
    timerTapMinVh: 42,
    metaFontPx: 16,
  };
}

/** 合并本地/云端片段为合法配置（旧数据无 inputMode 时默认为计时器） */
export function normalizeGroupTimerUi(patch: Partial<GroupTimerUiConfig>): GroupTimerUiConfig {
  const base = defaultGroupTimerUi();
  const j = { ...base, ...patch, version: 1 as const };
  return {
    version: 1,
    inputMode: j.inputMode === 'manual' ? 'manual' : 'timer',
    scrambleFontPx: clampNum(j.scrambleFontPx, 12, 32, base.scrambleFontPx),
    fullscreenBg: typeof j.fullscreenBg === 'string' ? j.fullscreenBg : base.fullscreenBg,
    timerTapMinVh: clampNum(j.timerTapMinVh, 18, 70, base.timerTapMinVh),
    metaFontPx: clampNum(j.metaFontPx, 12, 24, base.metaFontPx),
  };
}

export function loadGroupTimerUiFromStorage(): GroupTimerUiConfig {
  try {
    const raw = localStorage.getItem(GROUP_TIMER_UI_STORAGE_KEY);
    if (!raw) {
      return defaultGroupTimerUi();
    }
    const j = JSON.parse(raw) as Partial<GroupTimerUiConfig>;
    return normalizeGroupTimerUi(j);
  } catch {
    return defaultGroupTimerUi();
  }
}

function clampNum(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (Number.isNaN(n)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, n));
}

export function saveGroupTimerUiToStorage(cfg: GroupTimerUiConfig): void {
  localStorage.setItem(GROUP_TIMER_UI_STORAGE_KEY, JSON.stringify(cfg));
}
