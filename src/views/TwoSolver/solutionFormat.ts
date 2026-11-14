import type { Solution } from "./engine/types";
import { tDetail, type DetailLocale } from "../../i18n/messages/two-solver-detail";

export type StageId = "orientation" | "base" | "preAuf" | "algorithm" | "postAuf";
export type StagePart = { text: string; cancelled: boolean };

const tokens = (text: string) => text.trim().split(/\s+/).filter(Boolean);
const turns = (move: string) => move.endsWith("'") ? 3 : move.endsWith("2") ? 2 : 1;
const token = (face: string, amount: number) => face + (amount === 2 ? "2" : amount === 3 ? "'" : "");

// A signed basis records all 24 cube frames without loading the solver/model.
function rotate(frame: number[], axis: string): number[] {
  return frame.map(value => {
    const sign = Math.sign(value), face = Math.abs(value);
    const next = axis === "x" ? [1, -3, 2] : axis === "y" ? [3, 2, -1] : [-2, 1, 3];
    return sign * next[face - 1];
  });
}
const rotationWords = new Map<string, string[]>([["1,2,3", []]]);
for (const [key, word] of rotationWords) {
  for (const axis of "xyz") {
    let frame = key.split(",").map(Number);
    for (let amount = 1; amount <= 3; amount++) {
      frame = rotate(frame, axis);
      if (!rotationWords.has(String(frame))) rotationWords.set(String(frame), [...word, token(axis, amount)]);
    }
  }
}

/** Engine tokens only; never parse user notation or move rotations across turns. */
export function compactNotation(text: string): string {
  let moves = tokens(text);
  for (;;) {
    const out: string[] = [];
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      if (/^[xyz]/.test(move)) {
        let frame = [1, 2, 3];
        while (i < moves.length && /^[xyz]/.test(moves[i])) {
          for (let n = 0; n < turns(moves[i]); n++) frame = rotate(frame, moves[i][0]);
          i++;
        }
        out.push(...rotationWords.get(String(frame))!);
        i--;
      } else {
        let amount = turns(move);
        while (i + 1 < moves.length && moves[i + 1][0] === move[0]) amount += turns(moves[++i]);
        if (amount % 4) out.push(token(move[0], amount % 4));
      }
    }
    if (out.join(" ") === moves.join(" ")) return out.join(" ");
    moves = out;
  }
}

export function formatFullSolution(solution: Solution): string {
  // The engine has already used the requested stage-overlap budget. A second
  // whole-sequence simplification here would silently exceed that budget.
  if (solution.boundary) return [compactNotation(solution.orientation), solution.execution.trim()].filter(Boolean).join(" ");
  return compactNotation([solution.orientation, solution.execution].filter(Boolean).join(" "));
}

export function formatSolutionStages(solution: Solution, locale: DetailLocale = "zh-CN") {
  const definitions: { id: StageId; label: string; annotation: string; value: string }[] = [
    { id: "orientation", label: tDetail(locale, "two.detail.stage.orientation"), annotation: tDetail(locale, "two.detail.stage.orientation"), value: solution.orientation },
    { id: "base", label: tDetail(locale, "two.detail.stage.base"), annotation: tDetail(locale, "two.detail.stage.base"), value: solution.base },
    { id: "preAuf", label: tDetail(locale, "two.detail.stage.preAuf"), annotation: "AUF", value: solution.preAuf },
    { id: "algorithm", label: tDetail(locale, "two.detail.stage.algorithm"), annotation: solution.method, value: solution.algorithm },
    { id: "postAuf", label: tDetail(locale, "two.detail.stage.postAuf"), annotation: "AUF", value: solution.postAuf },
  ];
  let rightOffset = 0, cumulative = 0;
  return definitions.map(stage => {
    const moves = tokens(stage.value);
    const marked = stage.id === "base" ? solution.boundary?.leftMarked
      : stage.id === "orientation" ? undefined : solution.boundary?.rightMarked.slice(rightOffset);
    if (stage.id !== "base" && stage.id !== "orientation") rightOffset += moves.length;
    const parts: StagePart[] = [];
    moves.forEach((move, index) => {
      const cancelled = marked?.[index] === true;
      const last = parts.at(-1);
      if (last?.cancelled === cancelled) last.text += ` ${move}`;
      else parts.push({ text: move, cancelled });
    });
    // Keep marked source tokens intact: their indices describe the original join.
    for (const part of parts) if (!part.cancelled) part.text = compactNotation(part.text);
    const count = stage.id === "orientation" ? 0 : moves.filter(move => !/^[xyz]/.test(move)).length;
    cumulative += count;
    const text = parts.filter(part => part.text).map(part => part.cancelled ? `(${part.text})` : part.text).join(" ");
    return { ...stage, parts: parts.filter(part => part.text), text, count, cumulative };
  });
}

export function formatAnnotatedSolution(solution: Solution, locale: DetailLocale = "zh-CN"): string {
  const stages = formatSolutionStages(solution, locale);
  const originalMoves = stages.at(-1)!.cumulative;
  return [
    tDetail(locale, "two.detail.annotationSummary", { method: solution.method, originalMoves, moves: solution.moves }),
    tDetail(locale, "two.detail.annotationOverlap"),
    ...stages.map(stage => `${stage.text}${stage.text ? " " : ""}//${stage.annotation} ${stage.count}/${stage.cumulative}`),
    tDetail(locale, "two.detail.annotationFull", { solution: formatFullSolution(solution) || tDetail(locale, "two.detail.noMoves") }),
  ].join("\n");
}
