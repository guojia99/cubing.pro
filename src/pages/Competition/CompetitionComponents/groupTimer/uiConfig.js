/** 群赛计时器外观（本地 + 可选云端 KV） */
export const GROUP_TIMER_UI_STORAGE_KEY = 'cubingPro.groupTimerUi.v1';
export function defaultGroupTimerUi() {
    return {
        version: 1,
        inputMode: 'timer',
        scrambleFontPx: 18,
        fullscreenBg: '',
        timerTapMinVh: 42,
        metaFontPx: 16,
        inspectionEnabled: false,
        inspectionDisplayMode: 'countdown',
        inspectionPrecision: 'tenth',
        blindSkipInspection: true,
    };
}
/** 合并本地/云端片段为合法配置（旧数据无 inputMode 时默认为计时器） */
export function normalizeGroupTimerUi(patch) {
    const base = defaultGroupTimerUi();
    const j = { ...base, ...patch, version: 1 };
    return {
        version: 1,
        inputMode: j.inputMode === 'manual' ? 'manual' : 'timer',
        scrambleFontPx: clampNum(j.scrambleFontPx, 12, 32, base.scrambleFontPx),
        fullscreenBg: typeof j.fullscreenBg === 'string' ? j.fullscreenBg : base.fullscreenBg,
        timerTapMinVh: clampNum(j.timerTapMinVh, 18, 70, base.timerTapMinVh),
        metaFontPx: clampNum(j.metaFontPx, 12, 24, base.metaFontPx),
        inspectionEnabled: typeof j.inspectionEnabled === 'boolean' ? j.inspectionEnabled : base.inspectionEnabled,
        inspectionDisplayMode: j.inspectionDisplayMode === 'countup' ? 'countup' : base.inspectionDisplayMode,
        inspectionPrecision: j.inspectionPrecision === 'second' ? 'second' : base.inspectionPrecision,
        blindSkipInspection: typeof j.blindSkipInspection === 'boolean' ? j.blindSkipInspection : base.blindSkipInspection,
    };
}
export function loadGroupTimerUiFromStorage() {
    try {
        const raw = localStorage.getItem(GROUP_TIMER_UI_STORAGE_KEY);
        if (!raw) {
            return defaultGroupTimerUi();
        }
        const j = JSON.parse(raw);
        return normalizeGroupTimerUi(j);
    }
    catch {
        return defaultGroupTimerUi();
    }
}
function clampNum(v, min, max, fallback) {
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    if (Number.isNaN(n)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, n));
}
export function saveGroupTimerUiToStorage(cfg) {
    localStorage.setItem(GROUP_TIMER_UI_STORAGE_KEY, JSON.stringify(cfg));
}
//# sourceMappingURL=uiConfig.js.map