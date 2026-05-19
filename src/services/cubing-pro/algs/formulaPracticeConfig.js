/**
 * 公式练习器配置
 */
const LS_KEY_PREFIX = 'algs:formula_practice_config:';
const DEFAULT_CONFIG = {
    trimRatio: 5,
    remindProficiency: true,
};
function getStorageKey(cube, classId) {
    return `${LS_KEY_PREFIX}${encodeURIComponent(cube)}-${encodeURIComponent(classId)}`;
}
export function getFormulaPracticeConfig(cube, classId) {
    try {
        const raw = localStorage.getItem(getStorageKey(cube, classId));
        if (!raw)
            return { ...DEFAULT_CONFIG };
        const data = JSON.parse(raw);
        return {
            trimRatio: typeof data.trimRatio === 'number' ? Math.max(0, Math.min(50, data.trimRatio)) : DEFAULT_CONFIG.trimRatio,
            remindProficiency: typeof data.remindProficiency === 'boolean' ? data.remindProficiency : DEFAULT_CONFIG.remindProficiency,
        };
    }
    catch {
        return { ...DEFAULT_CONFIG };
    }
}
export function saveFormulaPracticeConfig(cube, classId, config) {
    if (!cube || !classId)
        return;
    try {
        const current = getFormulaPracticeConfig(cube, classId);
        const next = { ...current, ...config };
        localStorage.setItem(getStorageKey(cube, classId), JSON.stringify(next));
    }
    catch {
        // ignore
    }
}
//# sourceMappingURL=formulaPracticeConfig.js.map