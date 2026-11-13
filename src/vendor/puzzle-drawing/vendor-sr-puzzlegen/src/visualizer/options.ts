import { VisualizerType } from "./enum";
import {
  RED,
  YELLOW,
  BLUE,
  WHITE,
  ORANGE,
  GREEN,
  PINK,
  LIGHT_YELLOW,
  GREY,
  LIGHT_GREEN,
  PURPLE,
  DARK_BLUE,
} from "../puzzles/colors";
import { MegaminxOptions, PuzzleOptions } from "./interface";

export const defaultMegaminxOptions: MegaminxOptions = {
  size: 2,
  scheme: {
    U: WHITE,
    F: RED,
    R: BLUE,
    dr: PINK,
    dl: LIGHT_YELLOW,
    L: GREEN,
    d: GREY,
    br: LIGHT_GREEN,
    BR: YELLOW,
    BL: PURPLE,
    bl: DARK_BLUE,
    b: ORANGE,
  },
};

export function getDefaultOptions(type: VisualizerType): PuzzleOptions {
  if (type !== VisualizerType.MEGAMINX_TOP) {
    throw new Error(`Unsupported SVG puzzle options: ${type}`);
  }
  return defaultMegaminxOptions;
}
