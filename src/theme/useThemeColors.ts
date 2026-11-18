"use client";

import { useSyncExternalStore } from "react";
import { getThemeColors } from "./chartColors";

type ThemeColors = ReturnType<typeof getThemeColors>;
const serverColors: ThemeColors = {
  accent: "#1a8aad", foreground: "#203d49", background: "#f8fafb", card: "#ffffff",
  mutedForeground: "#526e7a", faintForeground: "#6b8490", border: "rgba(32,61,73,.08)",
  signalSuccess: "#5aac7e", signalWarning: "#d4a259", signalInfo: "#4a9eff", destructive: "#e05c5c",
};
let snapshot = serverColors;
const listeners = new Set<() => void>();
let observer: MutationObserver | undefined;

function readSnapshot() {
  const next = getThemeColors();
  if ((Object.keys(next) as (keyof ThemeColors)[]).some((key) => next[key] !== snapshot[key])) snapshot = next;
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!observer) {
    observer = new MutationObserver(() => {
      const previous = snapshot;
      readSnapshot();
      if (previous !== snapshot) listeners.forEach((notify) => notify());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-palette", "style"] });
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) { observer?.disconnect(); observer = undefined; }
  };
}

export function useThemeColors() {
  return useSyncExternalStore(subscribe, readSnapshot, () => serverColors);
}
