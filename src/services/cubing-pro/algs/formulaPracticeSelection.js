const LS_KEY_PREFIX = 'algs:formula_practice_selection:';
function getStorageKey(cube, classId) {
    return `${LS_KEY_PREFIX}${encodeURIComponent(cube)}-${encodeURIComponent(classId)}`;
}
function getLegacyStorageKey(cube, classId) {
    return `${LS_KEY_PREFIX}${encodeURIComponent(cube)}:${encodeURIComponent(classId)}`;
}
export function buildGroupKey(setName, groupName) {
    return `${setName}:${groupName}`;
}
export function buildFormulaKey(setName, groupName, algName) {
    return `${setName}:${groupName}:${algName}`;
}
export function getFormulaPracticeSelection(cube, classId) {
    try {
        let raw = localStorage.getItem(getStorageKey(cube, classId));
        if (!raw) {
            raw = localStorage.getItem(getLegacyStorageKey(cube, classId));
            if (raw) {
                const data = JSON.parse(raw);
                if (data && typeof data === 'object') {
                    const migrated = {
                        selectedSets: Array.isArray(data.selectedSets) ? data.selectedSets : [],
                        selectedGroups: Array.isArray(data.selectedGroups) ? data.selectedGroups : [],
                        selectedFormulas: Array.isArray(data.selectedFormulas) ? data.selectedFormulas : [],
                    };
                    saveFormulaPracticeSelection(cube, classId, migrated);
                    localStorage.removeItem(getLegacyStorageKey(cube, classId));
                    return migrated;
                }
            }
            return null;
        }
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object')
            return null;
        return {
            selectedSets: Array.isArray(data.selectedSets) ? data.selectedSets : [],
            selectedGroups: Array.isArray(data.selectedGroups) ? data.selectedGroups : [],
            selectedFormulas: Array.isArray(data.selectedFormulas) ? data.selectedFormulas : [],
        };
    }
    catch {
        return null;
    }
}
export function saveFormulaPracticeSelection(cube, classId, selection) {
    try {
        localStorage.setItem(getStorageKey(cube, classId), JSON.stringify(selection));
    }
    catch {
        // ignore
    }
}
//# sourceMappingURL=formulaPracticeSelection.js.map