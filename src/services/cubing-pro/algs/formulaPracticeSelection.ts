const LS_KEY_PREFIX = 'algs:formula_practice_selection:';

export interface FormulaPracticeSelection {
  selectedSets: string[];
  selectedGroups: string[]; // format: "setName:groupName"
  selectedFormulas: string[]; // format: "setName:groupName:algName"
}

function getStorageKey(cube: string, classId: string): string {
  return `${LS_KEY_PREFIX}${encodeURIComponent(cube)}-${encodeURIComponent(classId)}`;
}

function getLegacyStorageKey(cube: string, classId: string): string {
  return `${LS_KEY_PREFIX}${encodeURIComponent(cube)}:${encodeURIComponent(classId)}`;
}

export function buildGroupKey(setName: string, groupName: string): string {
  return `${setName}:${groupName}`;
}

export function buildFormulaKey(setName: string, groupName: string, algName: string): string {
  return `${setName}:${groupName}:${algName}`;
}

export function getFormulaPracticeSelection(
  cube: string,
  classId: string,
): FormulaPracticeSelection | null {
  try {
    let raw = localStorage.getItem(getStorageKey(cube, classId));
    if (!raw) {
      raw = localStorage.getItem(getLegacyStorageKey(cube, classId));
      if (raw) {
        const data = JSON.parse(raw) as FormulaPracticeSelection;
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
    const data = JSON.parse(raw) as FormulaPracticeSelection;
    if (!data || typeof data !== 'object') return null;
    return {
      selectedSets: Array.isArray(data.selectedSets) ? data.selectedSets : [],
      selectedGroups: Array.isArray(data.selectedGroups) ? data.selectedGroups : [],
      selectedFormulas: Array.isArray(data.selectedFormulas) ? data.selectedFormulas : [],
    };
  } catch {
    return null;
  }
}

export function saveFormulaPracticeSelection(
  cube: string,
  classId: string,
  selection: FormulaPracticeSelection,
): void {
  try {
    localStorage.setItem(getStorageKey(cube, classId), JSON.stringify(selection));
  } catch {
    // ignore
  }
}
