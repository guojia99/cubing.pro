"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useI18n } from "@/contexts/I18nProvider";

const WIDTH_KEY = "algs_filter_panel_width";
const DEFAULT_WIDTH = 288;
const MIN_WIDTH = 240;
const MAX_WIDTH = 480;
const MIN_CONTENT_WIDTH = 480;
const DIVIDER_WIDTH = 16;

/** The two panels share one width constraint, independent of formula card content. */
export default function AlgsResizablePanels({ navigation, children }: { navigation: ReactNode; children: ReactNode }) {
  const { locale } = useI18n();
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; startX: number; width: number } | null>(null);
  const preferred = useRef(DEFAULT_WIDTH);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [maxWidth, setMaxWidth] = useState(MAX_WIDTH);
  const [dragging, setDragging] = useState(false);
  const maximum = useRef(MAX_WIDTH);
  const current = useRef(DEFAULT_WIDTH);
  const observedWidth = useRef<number | null>(null);

  function apply(next: number) {
    const value = Math.round(Math.max(MIN_WIDTH, Math.min(maximum.current, next)));
    current.current = value;
    setWidth(value);
    return value;
  }
  function remember(next: number) {
    preferred.current = next;
    try { localStorage.setItem(WIDTH_KEY, String(next)); } catch { /* Layout remains usable without persistence. */ }
  }
  useEffect(() => {
    try {
      const saved = localStorage.getItem(WIDTH_KEY);
      const value = saved === null ? DEFAULT_WIDTH : Number(saved);
      if (Number.isFinite(value)) preferred.current = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, value));
    } catch { /* Use the default width when storage is unavailable. */ }
    const element = root.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const measuredWidth = Math.round(entry.contentRect.width);
      if (observedWidth.current === measuredWidth) return;
      observedWidth.current = measuredWidth;
      const available = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.floor(entry.contentRect.width - MIN_CONTENT_WIDTH - DIVIDER_WIDTH)));
      maximum.current = available;
      setMaxWidth(available);
      current.current = Math.max(MIN_WIDTH, Math.min(available, preferred.current));
      setWidth(current.current);
      drag.current = null;
      setDragging(false);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const label = locale === "en-US" ? "Resize filter and formula panels" : "调整筛选与公式区域宽度";
  const hint = locale === "en-US" ? "Drag or use arrow keys. Double-click to reset." : "拖拽或使用左右方向键调整，双击恢复默认宽度";
  return <div ref={root} className={`algs-detail-panels${dragging ? " algs-detail-panels--resizing" : ""}`} style={{ "--algs-filter-width": `${width}px` } as CSSProperties}>
    {navigation}
    <div
      className="algs-detail-resizer"
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-label={label}
      aria-controls="algs-filter-pane algs-formula-pane"
      aria-valuemin={MIN_WIDTH}
      aria-valuemax={maxWidth}
      aria-valuenow={width}
      aria-valuetext={locale === "en-US" ? `Filter width ${width} pixels` : `筛选栏宽度 ${width} 像素`}
      title={hint}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { pointerId: event.pointerId, startX: event.clientX, width: current.current };
        setDragging(true);
      }}
      onPointerMove={(event) => {
        const active = drag.current;
        if (!active || active.pointerId !== event.pointerId) return;
        apply(active.width + event.clientX - active.startX);
      }}
      onPointerUp={(event) => {
        if (drag.current?.pointerId !== event.pointerId) return;
        remember(current.current);
        drag.current = null;
        setDragging(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={(event) => {
        if (drag.current?.pointerId !== event.pointerId) return;
        apply(preferred.current);
        drag.current = null;
        setDragging(false);
      }}
      onLostPointerCapture={() => { drag.current = null; setDragging(false); }}
      onDoubleClick={() => remember(apply(DEFAULT_WIDTH))}
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === "Home" ? MIN_WIDTH : event.key === "End" ? maximum.current : current.current + (event.key === "ArrowLeft" ? -1 : 1) * (event.shiftKey ? 32 : 16);
        remember(apply(next));
      }}
    ><span aria-hidden="true" /></div>
    {children}
  </div>;
}
