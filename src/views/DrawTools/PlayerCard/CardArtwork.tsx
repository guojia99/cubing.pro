"use client";

import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@chakra-ui/react";
import { useI18n } from "@/contexts/I18nProvider";
import type { CardTemplate } from "@/services/cubing-pro/cubeCards";
import type { createMotionScene } from "./motionScene";
import styles from "./CardArtwork.module.css";

type CardArtworkProps = {
  template: CardTemplate;
  alt: string;
  revision?: number;
  onDragSubject?: (dx: number, dy: number) => void;
} & (
  | { src: string; children?: never }
  | { src?: never; children: ReactNode }
);

export function CardArtwork({ src, children, template, alt, revision, onDragSubject }: CardArtworkProps) {
  const { t } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; ratio: number } | null>(null);
  const source = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createMotionScene> | null>(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (template !== "motion") return;
    const stage = host.current!;
    const texture = source.current!.querySelector("canvas, img") as HTMLCanvasElement | HTMLImageElement;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let generation = 0;

    function stop(phase: "static" | "fallback") {
      generation++;
      scene.current?.dispose();
      scene.current = null;
      stage.dataset.motionPhase = phase;
      delete stage.dataset.motionPose;
      setReady(false);
      setPaused(false);
    }

    async function syncPreference() {
      stop("static");
      if (preference.matches) return;
      const current = generation;
      const failed = () => { if (generation === current) stop("fallback"); };
      try {
        const [{ createMotionScene }] = await Promise.all([
          import("./motionScene"),
          texture instanceof HTMLImageElement ? texture.decode() : undefined,
        ]);
        if (generation !== current) return;
        const next = createMotionScene(stage, texture, failed);
        if (generation !== current) { next.dispose(); return; }
        scene.current = next;
        setReady(true);
      } catch { failed(); }
    }

    void syncPreference();
    preference.addEventListener("change", syncPreference);
    return () => { preference.removeEventListener("change", syncPreference); stop("static"); };
  }, [template, src]);

  useEffect(() => { scene.current?.refresh(); }, [revision]);

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    delete event.currentTarget.dataset.dragging;
  }

  // The accessible source stays mounted: it is also the full-resolution download.
  const artwork = src !== undefined
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={src} alt={alt} width={1080} height={template === "motion" ? 1440 : 1080} />
    : children;
  if (template !== "motion") return <div className={styles.classic} data-template={template}>
    <div className={styles.source} data-testid="card-artwork">{artwork}</div>
  </div>;
  return <div data-template="motion">
    <div className={onDragSubject ? `${styles.stage} ${styles.draggable}` : styles.stage} ref={host} data-testid="card-artwork" data-paused={paused}
      role={onDragSubject ? "group" : undefined} aria-label={onDragSubject ? t("playerCard.motionMove") : undefined}
      tabIndex={onDragSubject ? 0 : undefined}
      onPointerDown={onDragSubject && (event => {
        if (!event.isPrimary || event.button !== 0 || drag.current) return;
        const stage = event.currentTarget;
        const rect = stage.getBoundingClientRect();
        const fraction = window.matchMedia("(max-width: 600px)").matches ? 0.82 : 0.74;
        const ratio = 1080 / Math.max(1, rect.width * fraction);
        stage.setPointerCapture(event.pointerId);
        stage.dataset.dragging = "true";
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, ratio };
      })}
      onPointerMove={onDragSubject && (event => {
        const pointer = drag.current;
        if (!pointer || pointer.id !== event.pointerId) return;
        onDragSubject((event.clientX - pointer.x) * pointer.ratio, (event.clientY - pointer.y) * pointer.ratio);
        pointer.x = event.clientX;
        pointer.y = event.clientY;
      })}
      onPointerUp={onDragSubject && finishDrag} onPointerCancel={onDragSubject && finishDrag} onLostPointerCapture={onDragSubject && finishDrag}
      onKeyDown={onDragSubject && (event => {
        const step = event.shiftKey ? 20 : 5;
        switch (event.key) {
          case "ArrowLeft": onDragSubject(-step, 0); break;
          case "ArrowRight": onDragSubject(step, 0); break;
          case "ArrowUp": onDragSubject(0, -step); break;
          case "ArrowDown": onDragSubject(0, step); break;
          default: return;
        }
        event.preventDefault();
      })}>
      <div className={styles.source} ref={source}>{artwork}</div>
      <div className={styles.viewport} data-motion-viewport="" aria-hidden="true" />
    </div>
    {ready && <Button mt="2.5" size="sm" variant="outline" aria-pressed={paused} onClick={() => {
      scene.current?.setPaused(!paused);
      setPaused(!paused);
    }}>{t(paused ? "playerCard.play" : "playerCard.pause")}</Button>}
  </div>;
}
