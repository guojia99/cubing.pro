import { applyMoves, applyScramble, isValidToken, ScrambleParseError } from "./cube";
import { isFrShape } from "./analysis";
import { isTrueFr } from "./solver";
import { AXIS_INDEX, type AxisKey } from "./types";

export interface VerifyFrResult {
  ok: boolean;
  correct: boolean;
  errorToken?: string;
  /** 达到 FR 形态但非真 FR */
  falseFr?: boolean;
  userMoves: string[];
}

function parseMoveTokens(movesStr: string): string[] {
  return movesStr.trim().split(/\s+/).filter(Boolean);
}

/** 校验玩家提交的 FR 解法是否达到真 FR */
export function verifyFrSolution(
  scramble: string,
  userSolution: string,
  axisKey: AxisKey,
): VerifyFrResult {
  const userMoves = parseMoveTokens(userSolution);
  const axis = AXIS_INDEX[axisKey];

  for (const tok of userMoves) {
    if (!isValidToken(tok)) {
      return { ok: false, correct: false, errorToken: tok, userMoves };
    }
  }

  let state;
  try {
    state = applyScramble(scramble.trim());
  } catch (e) {
    if (e instanceof ScrambleParseError) {
      return { ok: false, correct: false, errorToken: e.message, userMoves };
    }
    throw e;
  }

  try {
    state = applyMoves(state, userMoves);
  } catch (e) {
    if (e instanceof ScrambleParseError) {
      return { ok: false, correct: false, errorToken: e.message, userMoves };
    }
    throw e;
  }

  const correct = isTrueFr(state, axis);
  const falseFr = !correct && isFrShape(state, axis);

  return { ok: true, correct, falseFr, userMoves };
}
