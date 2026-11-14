"use client";
import { useEffect, useRef, useState } from "react";
import type { SearchOptions, SearchResult } from "./engine/types";

export function useTwoSolver() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const worker = useRef<Worker | null>(null);
  const pending = useRef<{ id: number; resolve: (result: unknown) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> } | null>(null);
  const generation = useRef(0);
  const sequence = useRef(0);
  const mounted = useRef(true);

  function dispose(message = "任务已取消") {
    const p = pending.current;
    pending.current = null;
    if (p) { clearTimeout(p.timer); p.reject(new DOMException(message, "AbortError")); }
    worker.current?.terminate(); worker.current = null;
  }
  function cancel() {
    generation.current++;
    dispose();
    if (mounted.current) { setBusy(false); setProgress("已取消"); }
  }
  function begin() {
    generation.current++;
    // Keep the indexed library warm between completed searches and practice
    // samples. Only an in-flight task requires terminating its worker.
    if (pending.current) dispose();
    return generation.current;
  }
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; dispose(); };
  }, []);

  function request(type: "solve" | "validate", scramble: string, options?: SearchOptions): Promise<unknown> {
    if (pending.current) throw new Error("已有搜索任务正在运行");
    if (!worker.current) {
      const instance = new Worker(new URL("./solver.worker.ts", import.meta.url), { type: "module" });
      worker.current = instance;
      instance.onmessage = event => {
        const p = pending.current;
        if (!p || event.data.id !== p.id) return;
        if (event.data.type === "progress") { if (mounted.current) setProgress(event.data.text); return; }
        pending.current = null; clearTimeout(p.timer);
        if (event.data.type === "error") p.reject(new Error(event.data.error)); else p.resolve(event.data.result);
      };
      instance.onerror = event => {
        const p = pending.current;
        pending.current = null;
        worker.current?.terminate(); worker.current = null;
        if (p) { clearTimeout(p.timer); p.reject(new Error(event.message || "求解 Worker 加载失败")); }
      };
    }
    const id = ++sequence.current;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (pending.current?.id !== id) return;
        dispose("初始化或搜索超时，请重试或减少启用的方法");
        if (mounted.current) setError("初始化或搜索超时，请重试或减少启用的方法");
      }, type === "validate" ? 20000 : 90000);
      pending.current = { id, resolve, reject, timer };
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
      worker.current!.postMessage({ id, type, scramble, options, baseUrl: new URL(`${basePath}/`, window.location.origin).href });
    });
  }
  async function solve(scramble: string, options: SearchOptions): Promise<SearchResult | null> {
    const run = begin();
    setBusy(true); setError(null); setProgress("初始化完整状态引擎");
    try {
      const response = await request("solve", scramble, structuredClone(options)) as SearchResult;
      if (run !== generation.current || !mounted.current) return null;
      setResult(response); setProgress(`${response.solutions.length} 条已验证解法`);
      return response;
    } catch (e) {
      if (run === generation.current && mounted.current && !(e instanceof DOMException && e.name === "AbortError")) setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally { if (run === generation.current && mounted.current) setBusy(false); }
  }
  async function generate(): Promise<string | null> {
    const run = begin();
    setBusy(true); setError(null); setProgress("生成二阶随机状态打乱");
    try {
      const moduleUrl = new URL("/two-solver/scrambler/scramble.js", window.location.origin).href;
      const { randomScrambleForEvent } = await import(/* webpackIgnore: true */ moduleUrl) as {
        randomScrambleForEvent: (event: string) => Promise<{ toString(): string }>;
      };
      for (let attempt = 0; attempt < 30; attempt++) {
        const scramble = (await randomScrambleForEvent("222")).toString();
        if (run !== generation.current || !mounted.current) return null;
        if (await request("validate", scramble)) return scramble;
      }
      throw new Error("未能生成满足至少 4 步还原条件的打乱，请重试");
    } catch (e) {
      if (run === generation.current && mounted.current && !(e instanceof DOMException && e.name === "AbortError")) setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally { if (run === generation.current && mounted.current) setBusy(false); }
  }
  return { busy, progress, error, result, solve, generate, cancel };
}
