import { describe, matchesStructure } from "./structure";
import { type CubeModel, type State, SOLVED, FACE_NAMES, invert, parseMoves, token } from "./state";
import { METHODS, type MethodData, type MethodId } from "./types";

export interface IndexedFormula {
  method: MethodId; name: string; group: string; sourceApi: string;
  color: string; algorithm: string[]; preAuf: string; postAuf: string;
}
export interface Library {
  index: Map<number, IndexedFormula[]>;
  masks: Set<number>;
  loaded: number; rejected: number;
}

export async function buildLibrary(model: CubeModel, datasets: MethodData[], progress?: (text: string) => void): Promise<Library> {
  const library: Library = { index: new Map(), masks: new Set(), loaded: 0, rejected: 0 };
  const dedupe = new Set<string>();
  for (const dataset of datasets) {
    progress?.(`建立 ${dataset.method} 完整状态索引`);
    const api = METHODS.find(m => m.id === dataset.method)!.api;
    for (const record of dataset.records) for (const raw of record.algs) {
      let alg: string[];
      try { alg = parseMoves(raw); if (!alg.length) throw new Error("Empty formula"); }
      catch { library.rejected++; continue; }
      let accepted = false;
      for (let post = 0; post < 4; post++) {
        const postAuf = token("U", post);
        const originalTarget = model.applySequence(SOLVED, invert([...alg, ...(postAuf ? [postAuf] : [])]));
        // Formula sources contain x/y prefixes and different color frames. Align
        // the target geometrically, then undo alignment as part of execution.
        for (const rotation of model.rotations) {
          const target = model.applySequence(originalTarget, rotation.tokens);
          const colors = [...FACE_NAMES].filter(c => matchesStructure(dataset.method, describe(model, target, c)));
          if (!colors.length) continue;
          const aligned = [...invert(rotation.tokens), ...alg];
          for (let pre = 0; pre < 4; pre++) {
            const preAuf = token("U", pre);
            const required = preAuf ? model.apply(target, token("U", -pre)) : target;
            const key = model.key(required);
            for (const color of colors) {
              const normalizedColor = model.colorNormalizers[required[7]][FACE_NAMES.indexOf(color)];
              const identity = `${dataset.method}:${key}:${normalizedColor}:${preAuf}:${aligned.join(" ")}:${postAuf}`;
              if (dedupe.has(identity)) { accepted = true; continue; }
              dedupe.add(identity);
              const entry: IndexedFormula = { method: dataset.method, name: record.name, group: record.group, sourceApi: api,
                color: normalizedColor, algorithm: aligned, preAuf, postAuf };
              const list = library.index.get(key);
              if (list) list.push(entry); else library.index.set(key, [entry]);
              library.masks.add(model.mask(required, color));
              accepted = true;
            }
          }
        }
      }
      if (accepted) library.loaded++; else library.rejected++;
    }
    // Allow worker progress delivery between bounded method batches.
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  // Identity/AUF finishes cover skips omitted by last-layer algorithm catalogs.
  if (datasets.some(d => d.method === "CLL")) {
    for (let pre = 0; pre < 4; pre++) {
      const preAuf = token("U", pre), state = preAuf ? model.apply(SOLVED, token("U", -pre)) : SOLVED;
      const key = model.key(state), list = library.index.get(key) ?? [];
      list.push({ method: "CLL", name: "CLL Skip", group: "Skip", sourceApi: "CLL", color: "D", algorithm: [], preAuf, postAuf: "" });
      library.index.set(key, list); library.masks.add(model.mask(state, "D"));
    }
  }
  return library;
}

export function matchingColor(model: CubeModel, state: State, normalized: string): string {
  const map = model.colorNormalizers[state[7]];
  return FACE_NAMES[map.indexOf(normalized)];
}
