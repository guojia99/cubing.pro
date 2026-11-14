/// <reference lib="webworker" />
import { getModel } from "./engine/state";
import { buildLibrary, type Library } from "./engine/library";
import { isCompetitionDistance, search, validateOptions } from "./engine/search";
import type { MethodData, MethodId, SearchOptions } from "./engine/types";
import { toRufScramble } from "./engine/scramble";

const datasets = new Map<MethodId, MethodData>();
let activeLibrary: { key: string; library: Library } | undefined;
const worker = self as unknown as DedicatedWorkerGlobalScope;
worker.onmessage = async (event: MessageEvent<{
  id: number; type: "solve" | "validate" | "scramble"; scramble: string; options?: SearchOptions; baseUrl: string;
}>) => {
  const { id, type, scramble, options, baseUrl } = event.data;
  const progress = (text: string) => worker.postMessage({ id, type: "progress", text });
  try {
    const model = await getModel();
    if (type === "scramble") {
      const normalized = toRufScramble(model, scramble);
      worker.postMessage({ id, type: "result", result: isCompetitionDistance(model, normalized) ? normalized : null });
      return;
    }
    if (type === "validate") {
      worker.postMessage({ id, type: "result", result: isCompetitionDistance(model, scramble) });
      return;
    }
    if (!options) throw new Error("缺少搜索参数");
    validateOptions(options);
    const key = [...new Set(options.methods)].sort().join(",");
    if (activeLibrary?.key !== key) {
      const selected = await Promise.all([...new Set(options.methods)].map(async method => {
        let data = datasets.get(method);
        if (!data) {
          progress(`加载 ${method} 公式`);
          const response = await fetch(new URL(`two-solver/data/${encodeURIComponent(method)}.json`, baseUrl));
          if (!response.ok) throw new Error(`${method} 公式加载失败 (${response.status})`);
          const json: MethodData = await response.json();
          if (json.method !== method || !Array.isArray(json.records)) throw new Error(`${method} 公式数据格式错误`);
          data = json;
          datasets.set(method, data);
        }
        return data;
      }));
      activeLibrary = { key, library: await buildLibrary(model, selected, progress) };
    }
    worker.postMessage({ id, type: "result", result: await search(model, activeLibrary.library, scramble, options, progress) });
  } catch (error) {
    worker.postMessage({ id, type: "error", error: error instanceof Error ? error.message : String(error) });
  }
};
