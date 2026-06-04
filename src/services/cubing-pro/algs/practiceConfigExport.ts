import { getFormulaPracticeConfig } from "./formulaPracticeConfig";
import { getFormulaPracticeSelection } from "./formulaPracticeSelection";
import { getFormulaProficiency } from "./formulaPracticeProficiency";
import { getCustomAlgs } from "./customAlgs";

export type PracticeExportData = {
  version: 1;
  configs: Record<string, unknown>;
  selections: Record<string, unknown>;
  proficiencies: Record<string, unknown>;
  customAlgs: Record<string, string[]>;
};

export function exportPracticeConfig(
  cube: string,
  classId: string,
  algsKeys?: string[],
): string {
  const data: PracticeExportData = {
    version: 1,
    configs: { [`${cube}_${classId}`]: getFormulaPracticeConfig(cube, classId) },
    selections: { [`${cube}_${classId}`]: getFormulaPracticeSelection(cube, classId) },
    proficiencies: { [`${cube}_${classId}`]: getFormulaProficiency(cube, classId) },
    customAlgs: {},
  };
  if (algsKeys) {
    for (const key of algsKeys) {
      data.customAlgs[key] = getCustomAlgs(key);
    }
  }
  return JSON.stringify(data, null, 2);
}

export function importPracticeConfig(jsonStr: string): PracticeExportData {
  const data = JSON.parse(jsonStr) as PracticeExportData;
  if (data.version !== 1) {
    throw new Error("不支持的配置版本");
  }
  return data;
}
