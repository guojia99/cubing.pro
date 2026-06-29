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

const MOVE_PREFIX = /^[UDRLFB](?:2|'?)?$/;

/** 是否为合法步的前缀（输入过程中如 `R`、`R2`） */
export function isValidTokenPrefix(token: string): boolean {
  if (!token) return false;
  if (isValidToken(token)) return true;
  return MOVE_PREFIX.test(token);
}

export type PracticeInputStatus =
  | "empty"
  | "typing"
  | "valid"
  | "invalid"
  | "trueFr"
  | "falseFr";

export interface PracticeInputState {
  status: PracticeInputStatus;
  appliedMoves: string[];
  invalidToken?: string;
}

/** 练习输入实时解析：区分已完成步、输入中前缀与非法 token，并判断当前 FR 形态 */
export function parsePracticeSolutionInput(
  scramble: string,
  userSolution: string,
  axisKey: AxisKey,
): PracticeInputState {
  const raw = userSolution;
  if (!raw.trim()) {
    return { status: "empty", appliedMoves: [] };
  }

  const endsWithSpace = /\s$/.test(raw);
  const trimmedEnd = raw.trimEnd();
  const parts = trimmedEnd.split(/\s+/).filter(Boolean);

  let completeMoves: string[];
  let trailing: string | null = null;

  if (endsWithSpace) {
    completeMoves = parts;
  } else {
    trailing = parts[parts.length - 1] ?? null;
    completeMoves = parts.length > 1 ? parts.slice(0, -1) : [];
  }

  for (const tok of completeMoves) {
    if (!isValidToken(tok)) {
      return { status: "invalid", appliedMoves: completeMoves, invalidToken: tok };
    }
  }

  if (trailing !== null) {
    if (!isValidTokenPrefix(trailing)) {
      return { status: "invalid", appliedMoves: completeMoves, invalidToken: trailing };
    }
    if (!isValidToken(trailing)) {
      return { status: "typing", appliedMoves: completeMoves };
    }
    completeMoves = [...completeMoves, trailing];
  }

  if (completeMoves.length === 0) {
    return { status: "typing", appliedMoves: [] };
  }

  let state;
  try {
    state = applyScramble(scramble.trim());
    state = applyMoves(state, completeMoves);
  } catch (e) {
    if (e instanceof ScrambleParseError) {
      return {
        status: "invalid",
        appliedMoves: completeMoves,
        invalidToken: e.message,
      };
    }
    throw e;
  }

  const axis = AXIS_INDEX[axisKey];
  if (isTrueFr(state, axis)) {
    return { status: "trueFr", appliedMoves: completeMoves };
  }
  if (isFrShape(state, axis)) {
    return { status: "falseFr", appliedMoves: completeMoves };
  }
  return { status: "valid", appliedMoves: completeMoves };
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
