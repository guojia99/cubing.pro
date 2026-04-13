const STORAGE_KEY = 'algs_user_selection';
const FONT_SIZE_KEY = 'algs_formula_font_size';
const DEFAULT_FONT_SIZE = 12;

export function getFormulaFontSize(): number {
  try {
    const raw = localStorage.getItem(FONT_SIZE_KEY);
    if (!raw) return DEFAULT_FONT_SIZE;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? DEFAULT_FONT_SIZE : Math.max(8, Math.min(24, n));
  } catch {
    return DEFAULT_FONT_SIZE;
  }
}

export function setFormulaFontSize(size: number): void {
  try {
    const n = Math.max(8, Math.min(24, Math.round(size)));
    localStorage.setItem(FONT_SIZE_KEY, String(n));
  } catch {
    // ignore
  }
}

export type AlgsSelectionKey = string;

export function buildAlgsKey(
  cube: string,
  classId: string,
  set: string,
  group: string,
  algName: string,
): AlgsSelectionKey {
  return `${cube}-${classId}-${set}-${group}-${algName}`.replace(/\s+/g, '_');
}

export function getAlgsSelection(key: AlgsSelectionKey): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: Record<string, number> = JSON.parse(raw);
    const val = data[key];
    return typeof val === 'number' ? val : null;
  } catch {
    return null;
  }
}

export function setAlgsSelection(key: AlgsSelectionKey, index: number): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data: Record<string, number> = raw ? JSON.parse(raw) : {};
    data[key] = index;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

const CUBE333_VIEW_MODE_KEY = 'algs_cube333_view_mode';

export type Cube333ViewMode = '2d' | '3d';

export function getCube333ViewMode(): Cube333ViewMode {
  try {
    const v = localStorage.getItem(CUBE333_VIEW_MODE_KEY);
    if (v === '3d' || v === '2d') return v;
  } catch {
    // ignore
  }
  return '2d';
}

export function setCube333ViewMode(mode: Cube333ViewMode): void {
  try {
    localStorage.setItem(CUBE333_VIEW_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

const TWISTY_PANEL_TONE_KEY = 'algs_twisty_panel_tone';

/**
 * 全局：公式演示区「背景颜色」（外层容器 CSS，非魔方贴纸）。
 * 默认淡黄色（cream）。
 */
export type TwistyPanelTone = 'cream' | 'lightBlue' | 'white' | 'neutral';

export function getTwistyPanelTone(): TwistyPanelTone {
  try {
    const v = localStorage.getItem(TWISTY_PANEL_TONE_KEY);
    if (v === 'cream' || v === 'lightBlue' || v === 'white' || v === 'neutral') return v;
    // 旧版 default / yellow → 淡黄色
    if (v === 'default' || v === 'yellow') return 'cream';
    if (v === 'blue') return 'lightBlue';
  } catch {
    // ignore
  }
  return 'cream';
}

export function setTwistyPanelTone(tone: TwistyPanelTone): void {
  try {
    localStorage.setItem(TWISTY_PANEL_TONE_KEY, tone);
  } catch {
    // ignore
  }
}

const TWISTY_BOTTOM_FACE_BY_REPO_KEY = 'algs_twisty_bottom_face_by_repo';

/** 按公式库（cube + classId，如 333+PLL / 333+OLL）保存：底面中心颜色（魔方视角） */
export type CubeBottomFaceColor = 'yellow' | 'white' | 'red' | 'orange' | 'green' | 'blue';

function repoTwistyKey(cube: string, classId: string): string {
  return `${encodeURIComponent(cube)}::${encodeURIComponent(classId)}`;
}

export function getTwistyBottomFaceColor(cube: string, classId: string): CubeBottomFaceColor {
  try {
    const raw = localStorage.getItem(TWISTY_BOTTOM_FACE_BY_REPO_KEY);
    if (!raw) return 'yellow';
    const map = JSON.parse(raw) as Record<string, CubeBottomFaceColor>;
    const v = map[repoTwistyKey(cube, classId)];
    if (
      v === 'yellow' ||
      v === 'white' ||
      v === 'red' ||
      v === 'orange' ||
      v === 'green' ||
      v === 'blue'
    ) {
      return v;
    }
  } catch {
    // ignore
  }
  return 'yellow';
}

export function setTwistyBottomFaceColor(cube: string, classId: string, color: CubeBottomFaceColor): void {
  try {
    const raw = localStorage.getItem(TWISTY_BOTTOM_FACE_BY_REPO_KEY);
    const map: Record<string, CubeBottomFaceColor> = raw ? JSON.parse(raw) : {};
    map[repoTwistyKey(cube, classId)] = color;
    localStorage.setItem(TWISTY_BOTTOM_FACE_BY_REPO_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}
