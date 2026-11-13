"use client";

import { useSyncExternalStore } from "react";

export type CubeColor = "white" | "yellow" | "red" | "orange" | "green" | "blue";

export interface PuzzlePreferences {
  bottom: CubeColor;
  front: CubeColor;
  view: "auto" | "2D" | "3D";
}

export const PUZZLE_PREFERENCES_KEY = "algs_puzzle_preferences_v1";
export const DEFAULT_PUZZLE_PREFERENCES: PuzzlePreferences = Object.freeze({
  bottom: "white",
  front: "red",
  view: "auto",
});

export const CUBE_COLORS: readonly CubeColor[] = Object.freeze([
  "white", "yellow", "red", "orange", "green", "blue",
]);

export const CUBE_COLOR_HEX: Readonly<Record<CubeColor, string>> = Object.freeze({
  white: "#ffffff",
  yellow: "#ffdd00",
  red: "#e53935",
  orange: "#ff8800",
  green: "#00a651",
  blue: "#2266ff",
});

type Vector = readonly [number, number, number];

// Right-handed coordinates: +x R, +y U, +z F. This is a rotation of
// the Western/BOY scheme, not a reflection: U yellow, D white, F red,
// B orange, R green, L blue. Reference:
// https://standards.cubing.net/draft/1/fundamental-cube-terms/#121-standard-color-scheme
const NORMALS: Record<CubeColor, Vector> = {
  white: [0, -1, 0],
  yellow: [0, 1, 0],
  red: [0, 0, 1],
  orange: [0, 0, -1],
  green: [1, 0, 0],
  blue: [-1, 0, 0],
};

function dot(a: Vector, b: Vector): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function isCubeColor(value: unknown): value is CubeColor {
  return typeof value === "string" && CUBE_COLORS.includes(value as CubeColor);
}

export function normalizePuzzlePreferences(value: unknown): PuzzlePreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_PUZZLE_PREFERENCES;
  }
  const input = value as Record<string, unknown>;
  if (
    Object.keys(input).length !== 3 ||
    !["bottom", "front", "view"].every((key) => Object.prototype.hasOwnProperty.call(input, key)) ||
    !isCubeColor(input.bottom) ||
    !isCubeColor(input.front) ||
    (input.view !== "auto" && input.view !== "2D" && input.view !== "3D") ||
    dot(NORMALS[input.bottom], NORMALS[input.front]) !== 0
  ) {
    return DEFAULT_PUZZLE_PREFERENCES;
  }
  return Object.freeze({ bottom: input.bottom, front: input.front, view: input.view });
}

let cachedRaw: string | null | undefined;
let snapshot = DEFAULT_PUZZLE_PREFERENCES;

export function readPuzzlePreferences(): PuzzlePreferences {
  if (typeof window === "undefined") return DEFAULT_PUZZLE_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(PUZZLE_PREFERENCES_KEY);
    if (raw === cachedRaw) return snapshot;
    const next = normalizePuzzlePreferences(raw === null ? null : JSON.parse(raw));
    cachedRaw = raw;
    if (next.bottom !== snapshot.bottom || next.front !== snapshot.front || next.view !== snapshot.view) {
      snapshot = next;
    }
    return snapshot;
  } catch {
    cachedRaw = undefined;
    snapshot = DEFAULT_PUZZLE_PREFERENCES;
    return snapshot;
  }
}

const CHANGE_EVENT = "algs:puzzle-preferences-changed";

/** Notify only after a verified save or a completed backup import. */
export function notifyPuzzlePreferencesChanged(): void {
  if (typeof window === "undefined") return;
  // Notification must never turn an already committed import into a rollback.
  try { window.dispatchEvent(new Event(CHANGE_EVENT)); } catch { /* Storage is already committed. */ }
}

/** Returns false on unavailable storage, quota errors or an unverified write. */
export function writePuzzlePreferences(value: unknown): boolean {
  if (typeof window === "undefined") return false;
  const raw = JSON.stringify(normalizePuzzlePreferences(value));
  try {
    window.localStorage.setItem(PUZZLE_PREFERENCES_KEY, raw);
    if (window.localStorage.getItem(PUZZLE_PREFERENCES_KEY) !== raw) return false;
  } catch {
    return false;
  }
  notifyPuzzlePreferencesChanged();
  return true;
}

const listeners = new Set<() => void>();

function publish(): void {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== PUZZLE_PREFERENCES_KEY) return;
  try {
    if (event.storageArea !== null && event.storageArea !== window.localStorage) return;
  } catch { return; }
  publish();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, publish);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, publish);
    }
  };
}

function getServerSnapshot(): PuzzlePreferences {
  return DEFAULT_PUZZLE_PREFERENCES;
}

export function usePuzzlePreferences(): PuzzlePreferences {
  return useSyncExternalStore(subscribe, readPuzzlePreferences, getServerSnapshot);
}

export function cubeFaceColors(preferences: PuzzlePreferences): Record<string, string> {
  const { bottom, front } = normalizePuzzlePreferences(preferences);
  const down = NORMALS[bottom];
  const forward = NORMALS[front];
  const up: Vector = [-down[0], -down[1], -down[2]];
  // U x F = R selects precisely the 24 proper whole-cube rotations.
  const right: Vector = [
    up[1] * forward[2] - up[2] * forward[1],
    up[2] * forward[0] - up[0] * forward[2],
    up[0] * forward[1] - up[1] * forward[0],
  ];
  const colors: Record<string, string> = {};
  for (const color of CUBE_COLORS) {
    const normal = NORMALS[color];
    const x = dot(normal, right);
    const y = dot(normal, up);
    const z = dot(normal, forward);
    const face = x === 1 ? "R" : x === -1 ? "L" : y === 1 ? "U" : y === -1 ? "D" : z === 1 ? "F" : "B";
    colors[face] = CUBE_COLOR_HEX[color];
  }
  return colors;
}

/** Skewb's large unlit stickers need a softer palette; orientation is unchanged. */
export function puzzleFaceColors(preferences: PuzzlePreferences, puzzle?: string): Record<string, string> {
  const colors = cubeFaceColors(preferences);
  if (puzzle !== "skewb") return colors;
  const soft: Record<string, string> = {
    [CUBE_COLOR_HEX.white]: "#f2f0e8", [CUBE_COLOR_HEX.yellow]: "#d6b83f",
    [CUBE_COLOR_HEX.red]: "#c64d48", [CUBE_COLOR_HEX.orange]: "#d17c3a",
    [CUBE_COLOR_HEX.green]: "#388a61", [CUBE_COLOR_HEX.blue]: "#426fa6",
  };
  return Object.fromEntries(Object.entries(colors).map(([face, color]) => [face, soft[color]]));
}
