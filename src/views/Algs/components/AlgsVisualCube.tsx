"use client";

import { useEffect, useMemo, useRef } from "react";

import {
  resolveVisualCubeMask,
  resolveVisualCubeView,
} from "../utils/visualCubeConfig";
import { visualCubeSize } from "../utils/visualCubeCube";

export interface AlgsVisualCubeProps {
  cube: string;
  classId: string;
  setName: string;
  groupName: string;
  /** 打乱/setup，优先于 formula */
  scramble?: string;
  /** 库公式或自定义公式 */
  formula: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function AlgsVisualCube({
  cube,
  classId,
  setName,
  groupName,
  scramble,
  formula,
  width = 160,
  height = 160,
  className,
  style,
}: AlgsVisualCubeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cubeSize = visualCubeSize(cube);
  const mask = useMemo(
    () => resolveVisualCubeMask(classId, setName, groupName),
    [classId, setName, groupName],
  );
  const view = useMemo(
    () => resolveVisualCubeView(cube, classId, setName, groupName),
    [cube, classId, setName, groupName],
  );

  const renderWidth = view === "plan" ? Math.min(width, height) : width;
  const renderHeight = view === "plan" ? Math.min(width, height) : height;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let imgLoadHandler: (() => void) | null = null;

    const centerRenderedImage = () => {
      const img = el.querySelector("img");
      if (!img) return;
      img.style.display = "block";
      img.style.margin = "0 auto";
      img.style.width = "100%";
      img.style.height = "auto";
      img.style.maxWidth = "100%";
      img.style.objectFit = "contain";
      img.style.boxSizing = "border-box";
    };

    void import("sr-visualizer").then(({ cubePNG }) => {
      if (cancelled) return;

      el.innerHTML = "";
      const opts: Parameters<typeof cubePNG>[1] = {
        cubeSize,
        width: renderWidth,
        height: renderHeight,
      };
      const scr = scramble?.trim();
      const form = formula?.trim();
      if (scr) {
        opts.algorithm = scr;
      } else if (form) {
        opts.case = form;
      }
      if (mask) opts.mask = mask as import("sr-visualizer").Masking;
      if (view) opts.view = view;

      try {
        cubePNG(el, opts);
        centerRenderedImage();
        const img = el.querySelector("img");
        if (img) {
          imgLoadHandler = centerRenderedImage;
          img.addEventListener("load", imgLoadHandler);
        }
      } catch (e) {
        console.error("[AlgsVisualCube]", e);
      }
    });

    return () => {
      cancelled = true;
      const img = el.querySelector("img");
      if (img && imgLoadHandler) {
        img.removeEventListener("load", imgLoadHandler);
      }
    };
  }, [cubeSize, renderWidth, renderHeight, scramble, formula, mask, view]);

  return (
    <div
      className={className ? `algs-visual-cube ${className}` : "algs-visual-cube"}
      style={{
        width: "100%",
        maxWidth: renderWidth,
        minWidth: 0,
        marginLeft: "auto",
        marginRight: "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        lineHeight: 0,
        ...(view === "plan"
          ? { aspectRatio: "1" }
          : { minHeight: renderHeight }),
        ...style,
      }}
    >
      <div
        ref={containerRef}
        className="algs-visual-cube-inner"
        style={{
          width: "100%",
          maxWidth: "100%",
          height: view === "plan" ? "100%" : undefined,
          minHeight: view === "plan" ? undefined : renderHeight,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          lineHeight: 0,
        }}
      />
    </div>
  );
}
