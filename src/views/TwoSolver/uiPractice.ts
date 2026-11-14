"use client";

import { useEffect, useRef, useState } from "react";

export type Penalty = "none" | "+2" | "DNF";
export type PracticeQuestion = Readonly<{
  id: string;
  scramble: string;
  sampling: string;
}>;
export type PracticeRecord = PracticeQuestion & Readonly<{
  elapsedMs: number;
  inspectionMs: number;
  inspectionPenalty: Penalty;
  penalty: Penalty;
  date: string;
}>;
type Phase = "idle" | "inspection" | "running" | "stopped";
const HISTORY_KEY = "cubing.pro.two-solver.practice.v1";
const HISTORY_LIMIT = 200;

export function adjustedTime(record: Pick<PracticeRecord, "elapsedMs" | "penalty">): number {
  return record.penalty === "DNF" ? Infinity : record.elapsedMs + (record.penalty === "+2" ? 2000 : 0);
}

export function formatTime(ms: number): string {
  if (!Number.isFinite(ms)) return "DNF";
  const hundredths = Math.floor(Math.max(0, ms) / 10);
  const seconds = Math.floor(hundredths / 100);
  return `${seconds >= 60 ? `${Math.floor(seconds / 60)}:` : ""}${seconds >= 60 ? String(seconds % 60).padStart(2, "0") : seconds}.${String(hundredths % 100).padStart(2, "0")}`;
}

function readHistory(): PracticeRecord[] {
  const value: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value.filter((row): row is PracticeRecord => {
    if (!row || typeof row !== "object") return false;
    const r = row as Partial<PracticeRecord>;
    const valid = typeof r.id === "string" && r.id.length > 0 && !ids.has(r.id) && typeof r.scramble === "string" && typeof r.sampling === "string"
      && typeof r.elapsedMs === "number" && Number.isFinite(r.elapsedMs) && r.elapsedMs >= 0
      && typeof r.inspectionMs === "number" && Number.isFinite(r.inspectionMs) && r.inspectionMs >= 0
      && typeof r.date === "string" && Number.isFinite(Date.parse(r.date))
      && ["none", "+2", "DNF"].includes(r.penalty || "")
      && ["none", "+2", "DNF"].includes(r.inspectionPenalty || "");
    if (valid) ids.add(r.id!);
    return valid;
  }).slice(0, HISTORY_LIMIT);
}

export function usePracticeTimer(question: PracticeQuestion | null, inspection: boolean, enabled: boolean) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [clock, setClock] = useState(0);
  const [history, setHistory] = useState<PracticeRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const live = useRef({ phase: "idle" as Phase, started: 0, inspectionMs: 0, penalty: "none" as Penalty, question });
  const held = useRef(false);
  const actionRef = useRef<() => void>(() => {});

  useEffect(() => {
    try { setHistory(readHistory()); }
    catch { setStorageError("无法读取本地历史，仍可继续本次练习。"); }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); }
    catch { setStorageError("无法在此设备保存历史，请保持页面打开以保留本次练习记录。"); }
  }, [history, hydrated]);

  useEffect(() => {
    live.current = { phase: "idle", started: 0, inspectionMs: 0, penalty: "none",
      question: question ? { id: question.id, scramble: question.scramble, sampling: question.sampling } : null };
    held.current = false;
    setPhase("idle");
    setClock(0);
  }, [question]);

  useEffect(() => {
    if (phase !== "running" && phase !== "inspection") return;
    const update = () => {
      if (live.current.phase === "running" || live.current.phase === "inspection") setClock(performance.now() - live.current.started);
    };
    update();
    const interval = window.setInterval(update, 30);
    return () => window.clearInterval(interval);
  }, [phase]);

  function action() {
    const current = live.current;
    if (!enabled || !hydrated || !current.question || current.question.id !== question?.id || current.phase === "stopped") return;
    const now = performance.now();
    if (current.phase === "running") {
      const elapsedMs = now - current.started;
      current.phase = "stopped";
      setPhase("stopped");
      setClock(elapsedMs);
      // Capture before React schedules the updater; a new question may reset live state.
      const record: PracticeRecord = { ...current.question, elapsedMs, inspectionMs: current.inspectionMs,
        inspectionPenalty: current.penalty, penalty: current.penalty, date: new Date().toISOString() };
      setHistory((rows) => rows.some((row) => row.id === record.id) ? rows : [record, ...rows].slice(0, HISTORY_LIMIT));
      return;
    }
    if (current.phase === "idle" && inspection) {
      current.phase = "inspection";
    } else {
      if (current.phase === "inspection") {
        current.inspectionMs = now - current.started;
        current.penalty = current.inspectionMs >= 17000 ? "DNF" : current.inspectionMs >= 15000 ? "+2" : "none";
      }
      current.phase = "running";
    }
    current.started = now;
    setClock(0);
    setPhase(current.phase);
  }

  useEffect(() => { actionRef.current = action; });

  useEffect(() => {
    const interactive = (target: EventTarget | null) => target instanceof Element
      && Boolean(target.closest("input, textarea, select, button, a, [contenteditable]:not([contenteditable='false']), [role='button'], [role='tab'], [role='slider'], [role='textbox'], summary, twisty-player"));
    const down = (event: KeyboardEvent) => {
      if (!enabled || event.defaultPrevented || event.isComposing || event.code !== "Space" || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || interactive(event.target)) return;
      event.preventDefault();
      held.current = true;
      if (live.current.phase === "running") {
        actionRef.current();
        held.current = false;
      }
    };
    const up = (event: KeyboardEvent) => {
      if (event.code !== "Space" || !held.current) return;
      held.current = false;
      if (!enabled || interactive(event.target)) return;
      event.preventDefault();
      actionRef.current();
    };
    const blur = () => { held.current = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      held.current = false;
    };
  }, [enabled]);

  function setPenalty(id: string, penalty: Penalty) {
    setHistory((rows) => rows.map((row) => row.id === id ? { ...row, penalty } : row));
  }

  return { phase, clock, history: history as readonly PracticeRecord[], storageError, hydrated, action, setPenalty,
    isTiming: phase === "inspection" || phase === "running",
    isTimingNow: () => live.current.phase === "inspection" || live.current.phase === "running" };
}
