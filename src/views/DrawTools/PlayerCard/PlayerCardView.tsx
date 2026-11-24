"use client";

import { Box, Button, Field, Grid, Input, Stack, Text } from "@chakra-ui/react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PageHeader, Surface } from "@/components/ui/page";
import { useI18n } from "@/contexts/I18nProvider";
import { CARD_SIZE, INITIAL_CROP, cardFilename, clampCrop, inspectPhoto, paintCard, zoomCrop } from "./composition";
import { replaceSolidBackground, sourcePoint } from "./solidBackground";
import { loadNicknameFont, NICKNAME_FALLBACK } from "./nicknameFont";
import { eraseSegment, restoreSegment, repairPoint, REPAIR_RADIUS, type BrushPoint } from "./repairBrush";

import { INITIAL_BOX, clampBox, drawnBox } from "./personCutout.mjs";
import { startGrabCut } from "./grabCut";

export function PlayerCardView() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [opaque, setOpaque] = useState(false);
  const [replacement, setReplacement] = useState<HTMLCanvasElement | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [box, setBox] = useState(INITIAL_BOX);
  const [cutting, setCutting] = useState(false);
  const [cutoutError, setCutoutError] = useState(false);
  const cutoutJob = useRef<ReturnType<typeof startGrabCut> | null>(null);
  const selectionDrag = useRef<{ id: number; start: { x: number; y: number }; box: typeof INITIAL_BOX; kind: "move" | "draw" | "resize" } | null>(null);
  const [picking, setPicking] = useState(false);
  const [retry, setRetry] = useState(false);
  const [repairing, setRepairing] = useState<false | "erase" | "restore">(false);
  const [canUndo, setCanUndo] = useState(false);
  const undo = useRef<ImageData | null>(null);
  const stroke = useRef<{ id: number; point: BrushPoint } | null>(null);
  const ring = useRef<SVGSVGElement>(null);
  const tap = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const [crop, setCrop] = useState(INITIAL_CROP);
  const [name, setName] = useState("");
  const [nicknameFont, setNicknameFont] = useState<string | null>(null);
  const needsNicknameFont = !!image && !!name.trim();
  const nicknamePending = needsNicknameFont && nicknameFont === null;
  const [error, setError] = useState<"decode" | "export" | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const photo = new Image();
    let active = true;
    photo.src = url;
    photo.decode().then(() => {
      if (active) {
        const inspection = inspectPhoto(photo);
        setTransparentBackground(inspection.transparentBackground);
        setOpaque(inspection.opaque);
        setImage(photo);
      }
    }, () => {
      if (active) setError("decode");
    });
    return () => { active = false; URL.revokeObjectURL(url); };
  }, [file]);

  useEffect(() => {
    if (!needsNicknameFont) return;
    let active = true;
    loadNicknameFont().then(font => { if (active) setNicknameFont(font); });
    return () => { active = false; };
  }, [needsNicknameFont]);

  useLayoutEffect(() => {
    if (image && canvas.current) paintCard(canvas.current, image, crop, nicknamePending ? "" : name, nicknameFont ?? NICKNAME_FALLBACK, transparentBackground, replacement);
  }, [image, crop, name, nicknamePending, nicknameFont, transparentBackground, replacement]);

  useEffect(() => () => { cutoutJob.current?.cancel(); cutoutJob.current = null; }, []);

  function cancelCutout() {
    const job = cutoutJob.current;
    cutoutJob.current = null;
    job?.cancel();
    setCutting(false);
    setCutoutError(false);
    selectionDrag.current = null;
  }

  async function cutout() {
    if (!image) return;
    cancelCutout(); resetRepair(false); setPicking(false);
    setCutting(true);
    let job: ReturnType<typeof startGrabCut> | null = null;
    try {
      job = startGrabCut(image, crop, box);
      cutoutJob.current = job;
      const next = await job.result;
      // Upload, restore, crop edits, cancel and unmount invalidate this job.
      if (cutoutJob.current !== job) return;
      resetRepair(); setReplacement(next); setSelecting(false);
    } catch {
      if (job && cutoutJob.current !== job) return;
      setCutoutError(true);
    } finally {
      if (cutoutJob.current === job) { cutoutJob.current = null; setCutting(false); }
    }
  }

  function selectionPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
  }

  function resetRepair(clearHistory = true) {
    setRepairing(false); stroke.current = null;
    if (clearHistory) { setCanUndo(false); undo.current = null; }
    if (ring.current) ring.current.style.display = "none";
  }

  function repaint() {
    if (image && canvas.current) paintCard(canvas.current, image, crop, nicknamePending ? "" : name, nicknameFont ?? NICKNAME_FALLBACK, transparentBackground, replacement);
  }

  function showRing(clientX: number, clientY: number) {
    const rect = canvas.current!.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    if (ring.current) {
      ring.current.style.display = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height ? "block" : "none";
      ring.current.style.left = `${x - REPAIR_RADIUS - 1}px`;
      ring.current.style.top = `${y - REPAIR_RADIUS - 1}px`;
    }
    return repairPoint(image!.naturalWidth, image!.naturalHeight, replacement!.width, replacement!.height, crop, rect, clientX, clientY);
  }

  function download() {
    if (!image || !canvas.current || nicknamePending) return;
    try {
      const link = document.createElement("a");
      link.download = cardFilename(name);
      link.href = canvas.current.toDataURL("image/png");
      link.click();
      setError(null);
    } catch {
      setError("export");
    }
  }

  return (
    <Box maxW="1100px" mx="auto" py={{ base: 4, md: 8 }} minW="0">
      <PageHeader eyebrow={t("nav.tools.draw")} title={t("playerCard.title")} description={t("playerCard.description")} />
      <input ref={photoInput} id="player-card-photo" type="file" hidden aria-label={t("playerCard.photo")}
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/bmp"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (!selected) return;
          cancelCutout(); setSelecting(false); setBox(INITIAL_BOX);
          setReplacement(null); setPicking(false); setRetry(false); tap.current = null;
          resetRepair();
          setImage(null); setFile(null); setCrop(INITIAL_CROP); setError(null); drag.current = null;
          if (!/^image\/(png|jpeg|webp|avif|gif|bmp)$/.test(selected.type) || selected.size === 0) setError("decode");
          else setFile(selected);
          event.target.value = "";
        }} />
      <Grid templateColumns={{ base: "minmax(0, 1fr)", md: "minmax(0, 1.3fr) minmax(0, 1fr)" }} gap={{ base: 5, md: 8 }} alignItems="start">
        <Surface p={{ base: 3, md: 4 }}>
          <Box position="relative" aspectRatio="1" bg="bg.subtle" overflow="hidden" borderRadius="lg">
            <canvas ref={canvas} width={CARD_SIZE} height={CARD_SIZE} role="img" aria-label={t("playerCard.preview")} tabIndex={selecting ? 0 : undefined}
              aria-describedby={selecting ? "player-card-box-hint" : undefined}
              onKeyDown={event => {
                if (!selecting || cutting || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
                event.preventDefault();
                const dx = event.key === "ArrowLeft" ? -.01 : event.key === "ArrowRight" ? .01 : 0;
                const dy = event.key === "ArrowUp" ? -.01 : event.key === "ArrowDown" ? .01 : 0;
                setBox(value => clampBox(event.shiftKey ? { ...value, width: value.width + dx, height: value.height + dy } : { ...value, x: value.x + dx, y: value.y + dy }));
              }}
              style={{ display: "block", width: "100%", height: "100%", visibility: image ? "visible" : "hidden", touchAction: "none", cursor: cutting ? "wait" : selecting ? "crosshair" : repairing ? "none" : picking ? "crosshair" : image ? "grab" : "default" }}
              onPointerDown={(event) => {
                if (!image || cutting || !event.isPrimary || event.button !== 0) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                if (selecting) {
                  event.preventDefault();
                  const point = selectionPoint(event);
                  const tolerance = 24 / event.currentTarget.getBoundingClientRect().width;
                  const resize = Math.abs(point.x - box.x - box.width) < tolerance && Math.abs(point.y - box.y - box.height) < tolerance;
                  const inside = point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
                  selectionDrag.current = { id: event.pointerId, start: point, box, kind: resize ? "resize" : inside ? "move" : "draw" };
                  return;
                }
                if (repairing && replacement) {
                  event.preventDefault();
                  undo.current = replacement.getContext("2d")!.getImageData(0, 0, replacement.width, replacement.height);
                  const point = showRing(event.clientX, event.clientY);
                  stroke.current = { id: event.pointerId, point };
                  if (repairing === "restore") restoreSegment(replacement, image, point);
                  else eraseSegment(replacement, point);
                  repaint(); setCanUndo(true);
                  return;
                }
                if (picking) {
                  tap.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
                  return;
                }
                drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
              }}
              onPointerMove={(event) => {
                if (selecting) {
                  const gesture = selectionDrag.current;
                  if (!gesture || gesture.id !== event.pointerId) return;
                  event.preventDefault();
                  const point = selectionPoint(event);
                  const dx = point.x - gesture.start.x, dy = point.y - gesture.start.y;
                  setBox(gesture.kind === "draw" ? drawnBox(gesture.start, point) : clampBox(gesture.kind === "resize"
                    ? { ...gesture.box, width: gesture.box.width + dx, height: gesture.box.height + dy }
                    : { ...gesture.box, x: gesture.box.x + dx, y: gesture.box.y + dy }));
                  return;
                }
                if (repairing && replacement) {
                  if (!event.isPrimary) return;
                  const point = showRing(event.clientX, event.clientY);
                  if (stroke.current?.id === event.pointerId) {
                    event.preventDefault();
                    if (repairing === "restore") restoreSegment(replacement, image!, point, stroke.current.point);
                    else eraseSegment(replacement, point, stroke.current.point);
                    stroke.current.point = point;
                    repaint();
                  }
                  return;
                }
                if (picking) {
                  const start = tap.current;
                  if (start?.id === event.pointerId && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) start.moved = true;
                  return;
                }
                const previous = drag.current;
                if (!image || previous?.id !== event.pointerId) return;
                const ratio = CARD_SIZE / event.currentTarget.getBoundingClientRect().width;
                const dx = (event.clientX - previous.x) * ratio;
                const dy = (event.clientY - previous.y) * ratio;
                drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
                setCrop(value => clampCrop(image.naturalWidth, image.naturalHeight, { ...value, x: value.x + dx, y: value.y + dy }));
              }}
              onPointerUp={(event) => {
                if (selectionDrag.current?.id === event.pointerId) {
                  selectionDrag.current = null;
                  event.currentTarget.releasePointerCapture(event.pointerId);
                  return;
                }
                if (stroke.current?.id === event.pointerId) {
                  stroke.current = null;
                  event.currentTarget.releasePointerCapture(event.pointerId);
                  if (event.pointerType === "mouse") showRing(event.clientX, event.clientY);
                  else if (ring.current) ring.current.style.display = "none";
                  return;
                }
                const start = tap.current;
                if (image && picking && start?.id === event.pointerId) {
                  tap.current = null;
                  event.currentTarget.releasePointerCapture(event.pointerId);
                  if (start.moved || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  const point = sourcePoint(image.naturalWidth, image.naturalHeight, crop,
                    (event.clientX - rect.left) * CARD_SIZE / rect.width,
                    (event.clientY - rect.top) * CARD_SIZE / rect.height);
                  const next = replaceSolidBackground(image, point);
                  setRetry(!next);
                  if (next) { setReplacement(next); setPicking(false); }
                }
                if (drag.current?.id === event.pointerId) {
                  drag.current = null;
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
              }}
              onPointerLeave={() => { if (ring.current) ring.current.style.display = "none"; }}
              onPointerCancel={() => { selectionDrag.current = null; drag.current = null; tap.current = null; stroke.current = null; if (ring.current) ring.current.style.display = "none"; }}
              onLostPointerCapture={() => {
                selectionDrag.current = null;
                if (stroke.current && ring.current) ring.current.style.display = "none";
                drag.current = null; tap.current = null; stroke.current = null;
              }}
            />
            {image && selecting && <svg data-testid="person-box" aria-hidden="true" viewBox="0 0 1080 1080" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              <rect x={box.x * CARD_SIZE} y={box.y * CARD_SIZE} width={box.width * CARD_SIZE} height={box.height * CARD_SIZE} fill="none" stroke="#082b60" strokeWidth="8" />
              <rect x={box.x * CARD_SIZE} y={box.y * CARD_SIZE} width={box.width * CARD_SIZE} height={box.height * CARD_SIZE} fill="none" stroke="#bce6ff" strokeWidth="3" strokeDasharray="12 8" />
              <circle cx={(box.x + box.width) * CARD_SIZE} cy={(box.y + box.height) * CARD_SIZE} r="16" fill="#bce6ff" stroke="#082b60" strokeWidth="4" />
            </svg>}
            <svg ref={ring} data-testid="repair-ring" aria-hidden="true" width={REPAIR_RADIUS * 2 + 2} height={REPAIR_RADIUS * 2 + 2}
              style={{ display: "none", position: "absolute", pointerEvents: "none", overflow: "visible" }}>
              <circle cx={REPAIR_RADIUS + 1} cy={REPAIR_RADIUS + 1} r={REPAIR_RADIUS} fill="none" stroke="white" strokeWidth="1" />
              <circle cx={REPAIR_RADIUS + 1} cy={REPAIR_RADIUS + 1} r={REPAIR_RADIUS} fill="none" stroke="#18253b" strokeWidth="1" strokeDasharray="3 3" />
            </svg>
            {!image && (
              <Stack position="absolute" inset="0" align="center" justify="center" p="5" gap="3" textAlign="center">
                {file && !error ? <Text color="fg.muted" role="status">{t("playerCard.loading")}</Text> : <>
                  <Button colorPalette="brand" bg="accent.emphasis" color="accent.fg" onClick={() => photoInput.current?.click()}>{t("playerCard.photo")}</Button>
                  <Text fontSize="sm" color="fg.muted">{t("playerCard.private")}</Text>
                  {error === "decode" && <Text role="alert" fontSize="sm" color="fg.error">{t("playerCard.decodeError")}</Text>}
                </>}
              </Stack>
            )}
          </Box>
          {image && !selecting && <Text role="status" fontSize="sm" color="fg.muted" mt="3">{t(repairing === "restore" ? "playerCard.restoreHint" : repairing ? "playerCard.repairHint" : picking ? retry ? "playerCard.retryBackground" : "playerCard.pickBackground" : "playerCard.move")}</Text>}
        </Surface>
        <Surface>
          <Stack gap="6">
            {image && <Button variant="outline" onClick={() => photoInput.current?.click()}>{t("playerCard.photo")}</Button>}
            {image && <Stack gap="2">
              <Button variant={selecting ? "solid" : "outline"} aria-pressed={selecting} onClick={() => {
                cancelCutout(); resetRepair(false); setPicking(false); setRetry(false); drag.current = null; tap.current = null;
                setSelecting(!selecting);
              }}>{t(selecting ? "playerCard.finishBox" : "playerCard.selectPerson")}</Button>
              {selecting && <>
                <Text id="player-card-box-hint" fontSize="sm" color="fg.muted">{t("playerCard.boxHint")}</Text>
                <Button disabled={cutting} onClick={cutout}>{t("playerCard.cutout")}</Button>
              </>}
              {cutting && <>
                <Text role="status">{t("playerCard.cutting")}</Text>
                <Button variant="outline" onClick={cancelCutout}>{t("playerCard.cancelCutout")}</Button>
              </>}
              {cutoutError && <Text role="alert" color="fg.error">{t("playerCard.cutoutError")}</Text>}
            </Stack>}
            {image && (opaque || replacement) && <Stack gap="2">
              {replacement ? <>
                <Button variant={repairing === "erase" ? "solid" : "outline"} aria-pressed={repairing === "erase"} onClick={() => {
                  cancelCutout(); setSelecting(false); setPicking(false);
                  setRepairing(repairing === "erase" ? false : "erase"); drag.current = null; stroke.current = null;
                  if (ring.current) ring.current.style.display = "none";
                }}>{t("playerCard.repair")}</Button>
                <Button variant={repairing === "restore" ? "solid" : "outline"} aria-pressed={repairing === "restore"} onClick={() => {
                  cancelCutout(); setSelecting(false); setPicking(false);
                  setRepairing(repairing === "restore" ? false : "restore"); drag.current = null; stroke.current = null;
                  if (ring.current) ring.current.style.display = "none";
                }}>{t("playerCard.restoreBrush")}</Button>
                <Button variant="outline" disabled={!canUndo || cutting} onClick={() => {
                  replacement.getContext("2d")!.putImageData(undo.current!, 0, 0);
                  undo.current = null; setCanUndo(false); repaint();
                }}>{t("playerCard.undoStroke")}</Button>
                <Button variant="outline" onClick={() => { cancelCutout(); setSelecting(false); resetRepair(); setReplacement(null); setRetry(false); }}>{t("playerCard.restoreBackground")}</Button>
              </> :
                <Button variant="outline" aria-pressed={picking} onClick={() => { cancelCutout(); setSelecting(false); setPicking(!picking); setRetry(false); drag.current = null; tap.current = null; }}>{t(picking ? "playerCard.cancelBackground" : "playerCard.replaceBackground")}</Button>}
            </Stack>}
            <Field.Root>
              <Field.Label htmlFor="player-card-name">{t("playerCard.name")}</Field.Label>
              <Input id="player-card-name" value={name} onChange={event => setName(event.target.value)} />
            </Field.Root>
            <Field.Root disabled={!image}>
              <Field.Label htmlFor="player-card-zoom">{t("playerCard.zoom")}</Field.Label>
              <input id="player-card-zoom" type="range" min="1" max="3" step="0.01" value={crop.zoom} disabled={!image} style={{ width: "100%", minHeight: 44, accentColor: "var(--accent)" }} onChange={event => {
                cancelCutout(); setBox(INITIAL_BOX);
                if (image) setCrop(value => zoomCrop(image.naturalWidth, image.naturalHeight, value, Number(event.target.value)));
              }} />
            </Field.Root>
            <Button variant="outline" disabled={!image} onClick={() => { cancelCutout(); setBox(INITIAL_BOX); setCrop(INITIAL_CROP); }}>{t("playerCard.reset")}</Button>
            <Button colorPalette="brand" disabled={!image || nicknamePending} onClick={download}>{t("playerCard.download")}</Button>
            {error === "export" && <Text role="alert" color="fg.error">{t("playerCard.exportError")}</Text>}
          </Stack>
        </Surface>
      </Grid>
    </Box>
  );
}
