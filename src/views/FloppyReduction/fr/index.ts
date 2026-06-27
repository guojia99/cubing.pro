import { type AxisIndex, type CubeState, applyMoves, applyScramble, ScrambleParseError } from "./cube";
import { classifyAxis, isFrShape, isHtrState } from "./analysis";
import { isTrueFr, solveAxis, solveAxisShape } from "./solver";
import {
  AXIS_INDEX,
  AXIS_LIST,
  FR_TRIGGERS,
  type AxisResult,
  type FrAnalysis,
  type SolutionStep,
} from "./types";

export * from "./types";
export { generateHtrScramble } from "./scramble";
export { isValidToken } from "./cube";

function buildCaseLabel(edgeLabel: string, cornerLabel: string): string {
  return `${edgeLabel} / ${cornerLabel}`;
}

/** 把一条解逐步重放，记录每步后的形态标签与 trigger 提示 */
function decompose(
  state: CubeState,
  moves: string[],
  axis: AxisIndex,
): SolutionStep[] {
  const stepOf = (cur: CubeState, move: string | null): SolutionStep => {
    const c = classifyAxis(cur, axis);
    const caseLabel = buildCaseLabel(c.edgeLabel, c.cornerLabel);
    return { move, caseLabel, trueFr: isTrueFr(cur, axis), trigger: FR_TRIGGERS[caseLabel] };
  };
  const steps: SolutionStep[] = [stepOf(state, null)];
  let cur = state;
  for (const m of moves) {
    cur = applyMoves(cur, [m]);
    steps.push(stepOf(cur, m));
  }
  return steps;
}

/** 分析一条 HTR 打乱，返回三个轴的 FR 形态与参考步骤。 */
export function analyzeScramble(scramble: string): FrAnalysis {
  const trimmed = scramble.trim();
  let state;
  try {
    state = applyScramble(trimmed);
  } catch (e) {
    if (e instanceof ScrambleParseError) {
      return {
        ok: false,
        errorToken: e.message,
        isHtr: false,
        scramble: trimmed,
        axes: [],
      };
    }
    throw e;
  }

  const htr = isHtrState(state);

  // 角形/坏棱分类仅在 HTR 态下有意义
  const axes: AxisResult[] = htr
    ? AXIS_LIST.map(({ key, axis }) => {
        const cls = classifyAxis(state, axis);
        const solution = solveAxis(state, axis);
        const shapeSolution = solveAxisShape(state, axis);

        // 输入本身已是 FR 形态但非真 FR => 假 FR
        const inputFalseFr =
          isFrShape(state, axis) && !isTrueFr(state, axis);

        // 按最短形态解收尾后是否为假 FR
        let shapeIsFalseFr = false;
        if (shapeSolution && shapeSolution.length > 0) {
          const shaped = applyMoves(state, shapeSolution);
          shapeIsFalseFr = !isTrueFr(shaped, AXIS_INDEX[key]);
        }

        return {
          axisKey: key,
          ...cls,
          solution,
          shapeSolution,
          alreadyFr: solution !== null && solution.length === 0,
          inputFalseFr,
          shapeIsFalseFr,
          caseLabel: buildCaseLabel(cls.edgeLabel, cls.cornerLabel),
          decomposition: solution ? decompose(state, solution, axis) : [],
          shapeDecomposition:
            shapeIsFalseFr && shapeSolution
              ? decompose(state, shapeSolution, axis)
              : null,
        };
      })
    : [];

  return { ok: true, isHtr: htr, scramble: trimmed, axes };
}
