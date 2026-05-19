const LS_KEY_PREFIX = 'algs:formula_random_pick:';
const MAX_HISTORY = 10;
function getStorageKey(cube, classId) {
    return `${LS_KEY_PREFIX}${encodeURIComponent(cube)}:${encodeURIComponent(classId)}`;
}
export function getFormulaPickHistory(cube, classId) {
    try {
        const raw = localStorage.getItem(getStorageKey(cube, classId));
        if (!raw)
            return [];
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    }
    catch {
        return [];
    }
}
export function saveFormulaPick(cube, classId, item) {
    const history = getFormulaPickHistory(cube, classId);
    const next = [item, ...history.filter((h) => !isSamePick(h, item))].slice(0, MAX_HISTORY);
    try {
        localStorage.setItem(getStorageKey(cube, classId), JSON.stringify(next));
    }
    catch {
        // ignore
    }
}
function isSamePick(a, b) {
    return a.setName === b.setName && a.groupName === b.groupName && a.algName === b.algName;
}
//# sourceMappingURL=formulaRandomPick.js.map