"use client";

import { Box, Button, Field, Flex, Input, Stack, Text } from "@chakra-ui/react";
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { eraseMask, rectangleMask, type Point, type Rect } from "./photoMask";

export function BackgroundEditor({ image, onChange, onPending }: {
  image: HTMLImageElement;
  onChange: (value: HTMLCanvasElement | null) => void;
  onPending: (value: boolean) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [source] = useState(() => {
    const scale = Math.min(1, 2160 / Math.max(image.naturalWidth, image.naturalHeight));
    return { width: Math.max(1, Math.round(image.naturalWidth * scale)), height: Math.max(1, Math.round(image.naturalHeight * scale)) };
  });
  const displayScale = Math.min(1, 350 / Math.max(source.width, source.height));
  const workWidth = Math.max(1, Math.round(source.width * displayScale));
  const workHeight = Math.max(1, Math.round(source.height * displayScale));
  const [eraserSize, setEraserSize] = useState(5);
  const radius = Math.max(source.width, source.height) * eraserSize / 200;
  const [mask, setMask] = useState<Uint8ClampedArray | null>(null);
  const [undo, setUndo] = useState<Uint8ClampedArray | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mode, setMode] = useState<"box" | "erase">("box");
  const [color, setColor] = useState("#081933");
  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [backdrop, setBackdrop] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const surface = useRef<HTMLCanvasElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const stroke = useRef<{ id: number; start: Point; last: Point; before: Uint8ClampedArray | null } | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [composite, setComposite] = useState<HTMLCanvasElement | null>(null);
  const unfinished = mode === "box" && rect !== null;

  useEffect(() => { onPending(loading || drawing || (open && unfinished)); }, [loading, drawing, open, unfinished, onPending]);
  useEffect(() => () => onPending(false), [onPending]);
  useEffect(() => {
    if (!backdropFile) return;
    const url = URL.createObjectURL(backdropFile), photo = new Image();
    let active = true; photo.src = url;
    photo.decode().then(() => { if (active) { setBackdrop(photo); setLoading(false); } }, () => {
      if (active) { setError(true); setLoading(false); }
    });
    return () => { active = false; URL.revokeObjectURL(url); };
  }, [backdropFile]);

  useLayoutEffect(() => {
    if (!mask) { setComposite(null); onChange(null); return; }
    // Work at the displayed size during touch strokes, then paint the full
    // selection once at the end so the exported edge stays pixel-accurate.
    const width = drawing ? workWidth : source.width;
    const height = drawing ? workHeight : source.height;
    const alpha = document.createElement("canvas"); alpha.width = width; alpha.height = height;
    const actx = alpha.getContext("2d")!, pixels = actx.createImageData(width, height);
    if (width === source.width && height === source.height) {
      for (let i = 0; i < mask.length; i++) pixels.data[i * 4 + 3] = mask[i];
    } else {
      for (let y = 0; y < height; y++) {
        const row = Math.floor((y + .5) * source.height / height) * source.width;
        for (let x = 0; x < width; x++) {
          pixels.data[(y * width + x) * 4 + 3] = mask[row + Math.floor((x + .5) * source.width / width)];
        }
      }
    }
    actx.putImageData(pixels, 0, 0);
    const result = document.createElement("canvas"); result.width = width; result.height = height;
    const ctx = result.getContext("2d")!;
    ctx.drawImage(image, 0, 0, result.width, result.height);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(alpha, 0, 0, result.width, result.height);
    ctx.globalCompositeOperation = "destination-over";
    if (backdrop) {
      const scale = Math.max(result.width / backdrop.naturalWidth, result.height / backdrop.naturalHeight);
      const w = backdrop.naturalWidth * scale, h = backdrop.naturalHeight * scale;
      ctx.drawImage(backdrop, (result.width - w) / 2, (result.height - h) / 2, w, h);
    }
    ctx.fillStyle = color; ctx.fillRect(0, 0, result.width, result.height);
    ctx.globalCompositeOperation = "source-over";
    setComposite(result);
    if (!drawing) onChange(result);
  }, [mask, color, backdrop, image, source, drawing, workWidth, workHeight, onChange]);

  useLayoutEffect(() => {
    const c = surface.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(mode === "box" ? image : composite ?? image, 0, 0, c.width, c.height);
    if (rect && mode === "box") {
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.setLineDash([5, 3]);
      ctx.strokeRect(rect.x * c.width, rect.y * c.height, rect.width * c.width, rect.height * c.height);
      ctx.setLineDash([]);
    }
  }, [open, rect, mode, composite, image]);

  function point(event: PointerEvent<HTMLCanvasElement>): Point {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)), y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)) };
  }
  function move(event: PointerEvent<HTMLCanvasElement>) {
    const current = stroke.current;
    if (current?.id !== event.pointerId) return;
    const next = point(event);
    if (mode === "box") setRect({ x: Math.min(current.start.x, next.x), y: Math.min(current.start.y, next.y), width: Math.abs(next.x - current.start.x), height: Math.abs(next.y - current.start.y) });
    else {
      const previous = current.last;
      setMask(value => eraseMask(value!, source.width, source.height, previous, next, radius));
    }
    current.last = next;
  }
  function finish(event: PointerEvent<HTMLCanvasElement>, cancel = false) {
    if (stroke.current?.id !== event.pointerId) return;
    if (cancel) { if (mode !== "box") setMask(stroke.current.before); else setRect(null); }
    else move(event);
    stroke.current = null; setDrawing(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function restore() {
    setMask(null); setUndo(null); setRect(null); setMode("box"); setBackdropFile(null); setBackdrop(null); setLoading(false); setError(false);
  }

  return <Stack gap="3">
    <Button variant="outline" aria-expanded={open} aria-controls="background-editor" onClick={() => { if (open) { setRect(null); setMode(mask ? "erase" : "box"); } setOpen(!open); }}>{t("playerCard.background")}</Button>
    {open && <Stack id="background-editor" gap="3">
      <Text fontSize="sm" color="fg.muted">{t("playerCard.backgroundHelp")}</Text>
      <Box maxW={`${workWidth}px`} alignSelf="center" width="100%">
        <canvas ref={surface} width={workWidth} height={workHeight} aria-label={t("playerCard.editSurface")} role="img"
          style={{ display: "block", width: "100%", height: "auto", touchAction: "none", cursor: "crosshair" }}
          onPointerDown={event => {
            if (!event.isPrimary || event.button !== 0 || loading) return;
            const p = point(event); event.currentTarget.setPointerCapture(event.pointerId);
            stroke.current = { id: event.pointerId, start: p, last: p, before: mask }; setDrawing(true);
            if (mode !== "box") { setUndo(mask); setMask(eraseMask(mask!, source.width, source.height, p, p, radius)); }
          }} onPointerMove={move} onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)}
          onLostPointerCapture={() => { stroke.current = null; setDrawing(false); }} />
      </Box>
      <Flex gap="2" wrap="wrap">
        {mask && <Button size="sm" variant="outline" aria-pressed={mode === "box"} onClick={() => { setMode("box"); setRect(null); }}>{t("playerCard.redraw")}</Button>}
        {mode === "box" && <Button size="sm" disabled={!rect || rect.width * workWidth < 3 || rect.height * workHeight < 3 || drawing || loading} onClick={() => {
          setMask(rectangleMask(source.width, source.height, rect!)); setUndo(null); setMode("erase");
        }}>{t("playerCard.useSelection")}</Button>}
        {mask && <>
          <Button size="sm" variant="outline" disabled={!undo} onClick={() => { setMask(undo); setUndo(null); }}>{t("playerCard.undo")}</Button>
        </>}
      </Flex>
      {mask && <>
        {mode === "erase" && <Field.Root>
          <Field.Label htmlFor="eraser-size">{t("playerCard.eraserSize")}</Field.Label>
          <input id="eraser-size" type="range" min="1" max="15" step="1" value={eraserSize}
            style={{ width: "100%", minHeight: 44, accentColor: "var(--accent)" }} onChange={event => setEraserSize(Number(event.target.value))} />
        </Field.Root>}
        <Field.Root><Field.Label htmlFor="background-color">{t("playerCard.color")}</Field.Label>
          <Input id="background-color" type="color" value={color} onChange={event => { setColor(event.target.value); setBackdropFile(null); setBackdrop(null); setLoading(false); setError(false); }} />
        </Field.Root>
        <input ref={input} type="file" hidden accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/bmp" aria-label={t("playerCard.backdrop")} onChange={event => {
          const file = event.target.files?.[0]; event.target.value = "";
          if (!file) return;
          if (!/^image\/(png|jpeg|webp|avif|gif|bmp)$/.test(file.type) || !file.size) { setError(true); return; }
          setError(false); setLoading(true); setBackdropFile(file);
        }} />
        <Button size="sm" variant="outline" onClick={() => input.current?.click()}>{t("playerCard.backdrop")}</Button>
      </>}
      {loading && <Text role="status">{t("playerCard.loading")}</Text>}
      {error && <Text role="alert" color="fg.error">{t("playerCard.decodeError")}</Text>}
      <Flex gap="2">
        <Button size="sm" variant="outline" onClick={restore}>{t("playerCard.original")}</Button>
        <Button size="sm" disabled={loading || drawing || unfinished} onClick={() => setOpen(false)}>{t("playerCard.done")}</Button>
      </Flex>
    </Stack>}
  </Stack>;
}
