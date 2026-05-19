/**
 * 公式熟练度 - 用于权重随机模式
 * 存储 key: algs:formula_practice_proficiency:{cube}-{classId}
 */
const LS_KEY_PREFIX = 'algs:formula_practice_proficiency:';
/** 熟练度对应的权重（用于随机抽取，权重越高越容易被抽到） */
export const PROFICIENCY_WEIGHTS = {
    mastered: 1,
    skilled: 2,
    average: 3,
    unskilled: 4,
    unknown: 5,
};
/** 默认熟练度（未标记时） */
export const DEFAULT_PROFICIENCY = 'average';
function getStorageKey(cube, classId) {
    return `${LS_KEY_PREFIX}${encodeURIComponent(cube)}-${encodeURIComponent(classId)}`;
}
export function getFormulaProficiency(cube, classId) {
    try {
        const raw = localStorage.getItem(getStorageKey(cube, classId));
        if (!raw)
            return {};
        const data = JSON.parse(raw);
        const valid = ['mastered', 'skilled', 'average', 'unskilled', 'unknown'];
        const result = {};
        Object.entries(data).forEach(([key, val]) => {
            if (valid.includes(val)) {
                result[key] = val;
            }
        });
        return result;
    }
    catch {
        return {};
    }
}
export function setFormulaProficiency(cube, classId, formulaKey, level) {
    if (!cube || !classId)
        return;
    try {
        const map = getFormulaProficiency(cube, classId);
        map[formulaKey] = level;
        localStorage.setItem(getStorageKey(cube, classId), JSON.stringify(map));
    }
    catch {
        // ignore
    }
}
export function getProficiencyLevel(cube, classId, formulaKey) {
    const map = getFormulaProficiency(cube, classId);
    return map[formulaKey] ?? DEFAULT_PROFICIENCY;
}
/** 获取不熟练的公式 key 列表（unskilled 或 unknown） */
export function getUnskilledFormulaKeys(cube, classId) {
    const map = getFormulaProficiency(cube, classId);
    return Object.entries(map)
        .filter(([, level]) => level === 'unskilled' || level === 'unknown')
        .map(([key]) => key);
}
//# sourceMappingURL=formulaPracticeProficiency.js.map