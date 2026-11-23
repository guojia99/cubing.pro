"use client";

import { Box, Button, Field, Flex, Input, Stack, Text } from "@chakra-ui/react";
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { brushMask, segmentPhoto, type Point, type Rect } from "./photoMask";

export function BackgroundEditor({ image, onChange, onPending }: {
  image: HTMLImageElement;
  onChange: (value: HTMLCanvasElement | null) => void;
  onPending: (value: boolean) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [work] = useState(() => {
    const c = document.createElement("canvas");
    const scale = Math.min(1, 350 / Math.max(image.naturalWidth, image.naturalHeight));
    c.width = Math.max(1, Math.round(image.naturalWidth * scale)); c.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = c.getContext("2d")!; ctx.drawImage(image, 0, 0, c.width, c.height);
    return ctx.getImageData(0, 0, c.width, c.height);
  });
  const [mask, setMask] = useState<Uint8ClampedArray | null>(null);
  const [undo, setUndo] = useState<Uint8ClampedArray | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mode, setMode] = useState<"box" | "keep" | "erase">("box");
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
    const alpha = document.createElement("canvas"); alpha.width = work.width; alpha.height = work.height;
    const actx = alpha.getContext("2d")!, pixels = actx.createImageData(work.width, work.height);
    for (let i = 0; i < mask.length; i++) pixels.data[i * 4 + 3] = mask[i];
    actx.putImageData(pixels, 0, 0);
    const result = document.createElement("canvas");
    // During brushing only the editor's small canvas needs a fresh frame.
    // The card gets a bounded high-resolution composite when the stroke ends.
    const scale = Math.min(1, 2160 / Math.max(image.naturalWidth, image.naturalHeight));
    result.width = drawing ? work.width : Math.max(1, Math.round(image.naturalWidth * scale));
    result.height = drawing ? work.height : Math.max(1, Math.round(image.naturalHeight * scale));
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
  }, [mask, color, backdrop, image, work, drawing, onChange]);

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
      setMask(value => brushMask(value!, work.width, work.height, previous, next, Math.max(work.width, work.height) * .025, mode === "keep" ? 255 : 0));
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
    <Button variant="outline" aria-expanded={open} aria-controls="background-editor" onClick={() => { if (open) { setRect(null); setMode(mask ? "keep" : "box"); } setOpen(!open); }}>{t("playerCard.background")}</Button>
    {open && <Stack id="background-editor" gap="3">
      <Text fontSize="sm" color="fg.muted">{t("playerCard.backgroundHelp")}</Text>
      <Box maxW={`${work.width}px`} alignSelf="center" width="100%">
        <canvas ref={surface} width={work.width} height={work.height} aria-label={t("playerCard.editSurface")} role="img"
          style={{ display: "block", width: "100%", height: "auto", touchAction: "none", cursor: "crosshair" }}
          onPointerDown={event => {
            if (!event.isPrimary || event.button !== 0 || loading) return;
            const p = point(event); event.currentTarget.setPointerCapture(event.pointerId);
            stroke.current = { id: event.pointerId, start: p, last: p, before: mask }; setDrawing(true);
            if (mode !== "box") { setUndo(mask); setMask(brushMask(mask!, work.width, work.height, p, p, Math.max(work.width, work.height) * .025, mode === "keep" ? 255 : 0)); }
          }} onPointerMove={move} onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)}
          onLostPointerCapture={() => { stroke.current = null; setDrawing(false); }} />
      </Box>
      <Flex gap="2" wrap="wrap">
        <Button size="sm" variant="outline" aria-pressed={mode === "box"} onClick={() => { setMode("box"); setRect(null); }}>{t("playerCard.box")}</Button>
        <Button size="sm" disabled={!rect || rect.width * work.width < 3 || rect.height * work.height < 3 || drawing || loading || mode !== "box"} onClick={() => {
          setMask(segmentPhoto(work.data, work.width, work.height, rect!)); setUndo(null); setMode("keep");
        }}>{t("playerCard.cutout")}</Button>
        {mask && <>
          <Button size="sm" variant="outline" aria-pressed={mode === "keep"} onClick={() => { setMode("keep"); setRect(null); }}>{t("playerCard.keep")}</Button>
          <Button size="sm" variant="outline" aria-pressed={mode === "erase"} onClick={() => { setMode("erase"); setRect(null); }}>{t("playerCard.erase")}</Button>
          <Button size="sm" variant="outline" disabled={!undo} onClick={() => { setMask(undo); setUndo(null); }}>{t("playerCard.undo")}</Button>
        </>}
      </Flex>
      {mask && <>
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
