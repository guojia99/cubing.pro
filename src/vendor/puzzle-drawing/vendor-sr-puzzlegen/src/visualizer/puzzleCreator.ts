import { MegaminxTop } from "../puzzles/megaminxTop";
import { MegaminxSimulator } from "../simulator/megaminx/megaminxSimulator";
import { MegaminxOptions, PuzzleOptions } from "./interface";
import { VisualizerType } from "./enum";

// Only the fixed two-layer top view is used by the diagram adapter.
let geometry: MegaminxTop | undefined;

export function getPuzzleGeometry<T extends PuzzleOptions>(
  type: VisualizerType,
  options: T
): MegaminxTop {
  if (type !== VisualizerType.MEGAMINX_TOP) {
    throw new Error(`Unsupported SVG puzzle geometry: ${type}`);
  }
  return createMegaminxTop(options);
}

export function getPuzzleSimulator<T extends PuzzleOptions>(
  type: VisualizerType,
  _options: T
): MegaminxSimulator {
  if (type !== VisualizerType.MEGAMINX_TOP) {
    throw new Error(`Unsupported SVG puzzle simulator: ${type}`);
  }
  return new MegaminxSimulator();
}

export function createMegaminxTop(options: MegaminxOptions = {}): MegaminxTop {
  if (options.size !== undefined && options.size !== 2) {
    throw new Error(`Unsupported Megaminx top size: ${options.size}`);
  }
  if (!geometry) geometry = new MegaminxTop();
  return geometry;
}
