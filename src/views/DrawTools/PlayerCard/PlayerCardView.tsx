"use client";

import NextLink from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { isLoggedIn } from "@/lib/auth";
import { saveCubeCard, type CardTemplate } from "@/services/cubing-pro/cubeCards";
import { clampMotionPlacement, createMotionCutoutCanvas, hasMotionAutoMatte, INITIAL_MOTION_PLACEMENT, MOTION_HEIGHT, paintMotionCard } from "./motionComposition";
import { CardArtwork } from "./CardArtwork";
import { Box, Button, Field, Grid, HStack, Input, Stack, Text } from "@chakra-ui/react";
import type { CanvasHTMLAttributes, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PageHeader, Surface } from "@/components/ui/page";
import { useI18n } from "@/contexts/I18nProvider";
import { CARD_SIZE, INITIAL_CROP, cardFilename, clampCrop, inspectPhoto, paintCard, zoomCrop, type Crop } from "./composition";
import { replaceSolidBackground, sourcePoint } from "./solidBackground";
import { hasLoadedNicknameFont, loadNicknameFont, NICKNAME_FALLBACK, NICKNAME_FONT } from "./nicknameFont";
import { eraseSegment, fullImageRepairPoint, paintCutoutWorkbench, restoreSegment, repairPoint, REPAIR_RADIUS, type BrushPoint } from "./repairBrush";

import { INITIAL_BOX, clampBox, drawnBox } from "./personCutout.mjs";
import { startGrabCut } from "./grabCut";

const INITIAL_MOTION_BOX = { x: 0.08, y: 0.05, width: 0.84, height: 0.9 };

function squarePhotoRect(image: HTMLImageElement, crop: Crop) {
  const scale = CARD_SIZE / Math.min(image.naturalWidth, image.naturalHeight) * crop.zoom;
  const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
  return { left: (CARD_SIZE - width) / 2 + crop.x, top: (CARD_SIZE - height) / 2 + crop.y, width, height, canvasSize: CARD_SIZE };
}

export function PlayerCardView() {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const [template, setTemplate] = useState<CardTemplate>("classic");
  const motionCanvas = useRef<HTMLCanvasElement | null>(null);
  const editRevision = useRef(0);
  const [motionRevision, setMotionRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saveError" | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [opaque, setOpaque] = useState(false);
  const [replacement, setReplacement] = useState<HTMLCanvasElement | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [box, setBox] = useState(INITIAL_BOX);
  const [motionBox, setMotionBox] = useState(INITIAL_MOTION_BOX);
  const [cutting, setCutting] = useState(false);
  const [cutoutError, setCutoutError] = useState(false);
  const cutoutJob = useRef<ReturnType<typeof startGrabCut> | null>(null);
  const selectionDrag = useRef<{ id: number; start: { x: number; y: number }; box: typeof INITIAL_BOX; kind: "move" | "draw" | "resize" } | null>(null);
  const [picking, setPicking] = useState(false);
  const [retry, setRetry] = useState(false);
  const [repairing, setRepairing] = useState<false | "erase" | "restore">(false);
  const [brushRadius, setBrushRadius] = useState(REPAIR_RADIUS);
  const [canUndo, setCanUndo] = useState(false);
  const undo = useRef<ImageData | null>(null);
  const stroke = useRef<{ id: number; point: BrushPoint } | null>(null);
  const ring = useRef<SVGSVGElement>(null);
  const motionRing = useRef<SVGSVGElement>(null);
  const classicWorkbench = useRef<HTMLCanvasElement>(null);
  const motionWorkbench = useRef<HTMLCanvasElement>(null);
  const tap = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const [crop, setCrop] = useState(INITIAL_CROP);
  const [motionPlacement, setMotionPlacement] = useState(INITIAL_MOTION_PLACEMENT);
  const [name, setName] = useState("");
  const [resolvedNickname, setResolvedNickname] = useState<{ text: string; font: string } | null>(null);
  const trimmedName = name.trim();
  const needsNicknameFont = !!image && !!trimmedName;
  const nicknameFont = !needsNicknameFont ? NICKNAME_FALLBACK
    : hasLoadedNicknameFont(trimmedName) ? NICKNAME_FONT
    : resolvedNickname?.text === trimmedName ? resolvedNickname.font : null;
  const nicknamePending = nicknameFont === null;
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
    if (!nicknamePending) return;
    let active = true;
    loadNicknameFont(trimmedName).then(font => { if (active) setResolvedNickname({ text: trimmedName, font }); });
    return () => { active = false; };
  }, [nicknamePending, trimmedName]);

  const repaint = useCallback(() => {
    if (!image) return;
    if (template === "classic" && canvas.current) paintCard(canvas.current, image, crop, nicknamePending ? "" : name, nicknameFont ?? NICKNAME_FALLBACK, transparentBackground, replacement);
    if (template === "classic" && classicWorkbench.current && repairing && replacement) {
      paintCutoutWorkbench(classicWorkbench.current, image, replacement, repairing, squarePhotoRect(image, crop));
    }
    if (template === "motion" && motionCanvas.current) {
      paintMotionCard(motionCanvas.current, image, crop, nicknamePending ? "" : name, nicknameFont ?? NICKNAME_FALLBACK, transparentBackground, replacement, editRevision.current, motionPlacement);
      setMotionRevision(v => v + 1);
    }
    const target = motionWorkbench.current;
    if (target && repairing && replacement) paintCutoutWorkbench(target, image, replacement, repairing);
    else if (target && (selecting || picking)) {
      const ctx = target.getContext("2d")!;
      ctx.clearRect(0, 0, target.width, target.height);
      ctx.drawImage(image, 0, 0, target.width, target.height);
    }
  }, [image, crop, nicknamePending, name, nicknameFont, transparentBackground, replacement, template, motionPlacement, repairing, selecting, picking]);

  useLayoutEffect(() => {
    repaint();
  }, [repaint]);

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
      if (template === "motion") {
        const rect = squarePhotoRect(image, INITIAL_CROP);
        // sourceBox inverts the square projection; full-photo selections can extend outside [0, 1] here.
        job = startGrabCut(image, INITIAL_CROP, {
          x: (rect.left + motionBox.x * rect.width) / CARD_SIZE, y: (rect.top + motionBox.y * rect.height) / CARD_SIZE,
          width: motionBox.width * rect.width / CARD_SIZE, height: motionBox.height * rect.height / CARD_SIZE,
        });
      } else job = startGrabCut(image, crop, box);
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
    if (clearHistory) { setCanUndo(false); undo.current = null; setBrushRadius(REPAIR_RADIUS); }
    if (activeRing.current) activeRing.current.style.display = "none";
  }

  function toggleBrush(mode: "erase" | "restore") {
    cancelCutout(); setSelecting(false); setPicking(false); setRetry(false);
    if (!replacement && image && canEditMotionMatte) {
      const matte = createMotionCutoutCanvas(image, transparentBackground);
      if (!matte) { setCutoutError(true); return; }
      setReplacement(matte);
    }
    resetRepair(false); setRepairing(repairing === mode ? false : mode);
    drag.current = null; tap.current = null;
  }

  function showRing(event: ReactPointerEvent<HTMLCanvasElement>) {
    const { clientX, clientY } = event;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    if (activeRing.current) {
      activeRing.current.style.display = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height ? "block" : "none";
      activeRing.current.style.left = `${x - brushRadius - 1}px`;
      activeRing.current.style.top = `${y - brushRadius - 1}px`;
    }
    return template === "motion" ? fullImageRepairPoint(replacement!.width, replacement!.height, rect, clientX, clientY, brushRadius)
      : repairPoint(image!.naturalWidth, image!.naturalHeight, replacement!.width, replacement!.height, crop, rect, clientX, clientY, brushRadius);
  }

  function download() {
    if (!image || !canvas.current || nicknamePending) return;
    try {
      const link = document.createElement("a");
      link.download = cardFilename(name);
      link.href = (template === "motion" ? motionCanvas.current! : canvas.current).toDataURL("image/png");
      link.click();
      setError(null);
    } catch {
      setError("export");
    }
  }

  async function save() {
    if (!isLoggedIn(currentUser?.id) || !image || nicknamePending || saving) return;
    const output = template === "motion" ? motionCanvas.current : canvas.current;
    if (!output) return;
    setSaving(true); setSaveStatus(null);
    try {
      const png = await new Promise<Blob>((resolve, reject) => output.toBlob(blob => blob ? resolve(blob) : reject(new Error("PNG export failed")), "image/png"));
      await saveCubeCard(name, png, template);
      setSaveStatus("saved");
    } catch { setSaveStatus("saveError"); } finally { setSaving(false); }
  }

  const showClassicCanvas = template === "classic" || !image;
  const showMotionWorkbench = template === "motion" && image && (selecting || picking || Boolean(repairing));
  const canEditMotionMatte = template === "motion" && !!image && (!!replacement || transparentBackground || hasMotionAutoMatte(image));
  const activeRing = template === "motion" ? motionRing : ring;
  const activeBox = template === "motion" ? motionBox : box;
  const setSelectionBox = template === "motion" ? setMotionBox : setBox;
  const editorProps: CanvasHTMLAttributes<HTMLCanvasElement> = {
    role: "img",
    tabIndex: selecting ? 0 : undefined,
    "aria-describedby": selecting ? "player-card-box-hint" : undefined,
    onKeyDown: event => {
      if (!selecting || cutting || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      const dx = event.key === "ArrowLeft" ? -.01 : event.key === "ArrowRight" ? .01 : 0;
      const dy = event.key === "ArrowUp" ? -.01 : event.key === "ArrowDown" ? .01 : 0;
      setSelectionBox(value => clampBox(event.shiftKey ? { ...value, width: value.width + dx, height: value.height + dy } : { ...value, x: value.x + dx, y: value.y + dy }));
    },
    style: { display: "block", width: "100%", height: "100%", visibility: image ? "visible" : "hidden", touchAction: "none", cursor: cutting ? "wait" : selecting ? "crosshair" : repairing ? "none" : picking ? "crosshair" : image ? "grab" : "default" },
    onPointerDown: (event) => {
      if (!image || cutting || !event.isPrimary || event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      if (selecting) {
        event.preventDefault();
        const point = selectionPoint(event);
        const rect = event.currentTarget.getBoundingClientRect();
        const box = activeBox;
        const resize = Math.abs(point.x - box.x - box.width) < 24 / rect.width && Math.abs(point.y - box.y - box.height) < 24 / rect.height;
        const inside = point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
        selectionDrag.current = { id: event.pointerId, start: point, box, kind: resize ? "resize" : inside ? "move" : "draw" };
        return;
      }
      if (repairing && replacement) {
        event.preventDefault();
        undo.current = replacement.getContext("2d")!.getImageData(0, 0, replacement.width, replacement.height);
        const point = showRing(event);
        stroke.current = { id: event.pointerId, point };
        if (repairing === "restore") restoreSegment(replacement, image, point);
        else eraseSegment(replacement, point);
        editRevision.current++;
        repaint(); setCanUndo(true);
        return;
      }
      if (picking) {
        tap.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
        return;
      }
      drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    },
    onPointerMove: (event) => {
      if (selecting) {
        const gesture = selectionDrag.current;
        if (!gesture || gesture.id !== event.pointerId) return;
        event.preventDefault();
        const point = selectionPoint(event);
        const dx = point.x - gesture.start.x, dy = point.y - gesture.start.y;
        setSelectionBox(gesture.kind === "draw" ? drawnBox(gesture.start, point) : clampBox(gesture.kind === "resize"
          ? { ...gesture.box, width: gesture.box.width + dx, height: gesture.box.height + dy }
          : { ...gesture.box, x: gesture.box.x + dx, y: gesture.box.y + dy }));
        return;
      }
      if (repairing && replacement) {
        if (!event.isPrimary) return;
        const point = showRing(event);
        if (stroke.current?.id === event.pointerId) {
          event.preventDefault();
          if (repairing === "restore") restoreSegment(replacement, image!, point, stroke.current.point);
          else eraseSegment(replacement, point, stroke.current.point);
          stroke.current.point = point;
          editRevision.current++;
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
    },
    onPointerUp: (event) => {
      if (selectionDrag.current?.id === event.pointerId) {
        selectionDrag.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }
      if (stroke.current?.id === event.pointerId) {
        stroke.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
        if (event.pointerType === "mouse") showRing(event);
        else if (activeRing.current) activeRing.current.style.display = "none";
        return;
      }
      const start = tap.current;
      if (image && picking && start?.id === event.pointerId) {
        tap.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
        if (start.moved || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const point = template === "motion" ? {
          x: (event.clientX - rect.left) / rect.width * image.naturalWidth,
          y: (event.clientY - rect.top) / rect.height * image.naturalHeight,
        } : sourcePoint(image.naturalWidth, image.naturalHeight, crop,
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
    },
    onPointerLeave: () => { if (activeRing.current) activeRing.current.style.display = "none"; },
    onPointerCancel: () => { selectionDrag.current = null; drag.current = null; tap.current = null; stroke.current = null; if (activeRing.current) activeRing.current.style.display = "none"; },
    onLostPointerCapture: () => {
      selectionDrag.current = null;
      if (stroke.current && activeRing.current) activeRing.current.style.display = "none";
      drag.current = null; tap.current = null; stroke.current = null;
    },
  };

  const selectionSize = template === "motion" ? 1000 : CARD_SIZE;
  const selectionOverlay = selecting && <svg data-testid="person-box" aria-hidden="true" viewBox={`0 0 ${selectionSize} ${selectionSize}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
    <rect x={activeBox.x * selectionSize} y={activeBox.y * selectionSize} width={activeBox.width * selectionSize} height={activeBox.height * selectionSize} vectorEffect="non-scaling-stroke" fill="none" stroke="#082b60" strokeWidth="3" />
    <rect x={activeBox.x * selectionSize} y={activeBox.y * selectionSize} width={activeBox.width * selectionSize} height={activeBox.height * selectionSize} vectorEffect="non-scaling-stroke" fill="none" stroke="#bce6ff" strokeWidth="1.5" strokeDasharray="5 3" />
    <circle cx={(activeBox.x + activeBox.width) * selectionSize} cy={(activeBox.y + activeBox.height) * selectionSize} r="16" vectorEffect="non-scaling-stroke" fill="#bce6ff" stroke="#082b60" strokeWidth="1.5" />
  </svg>;
  const brushRing = <svg ref={activeRing} data-testid="repair-ring" aria-hidden="true" width={brushRadius * 2 + 2} height={brushRadius * 2 + 2}
    style={{ display: "none", position: "absolute", pointerEvents: "none", overflow: "visible" }}>
    <circle cx={brushRadius + 1} cy={brushRadius + 1} r={brushRadius} fill="none" stroke="white" strokeWidth="1" />
    <circle cx={brushRadius + 1} cy={brushRadius + 1} r={brushRadius} fill="none" stroke="#18253b" strokeWidth="1" strokeDasharray="3 3" />
  </svg>;

  return (
    <Box maxW="1040px" mx="auto" py={{ base: 3, md: 3 }} minW="0">
      <Box mb={{ base: "-2", md: "-4" }}>
        <PageHeader eyebrow={t("nav.tools.draw")} title={t("playerCard.title")} description={t("playerCard.description")} actions={
          <HStack flexWrap="wrap" gap="2">
            {(["classic", "motion"] as const).map(mode => <Button key={mode} variant={template === mode ? "solid" : "outline"} aria-pressed={template === mode} onClick={() => { if (mode === template) return;
              cancelCutout(); resetRepair(false); setSelecting(false); setPicking(false); setRetry(false); drag.current = null; tap.current = null;
              setTemplate(mode); setSaveStatus(null); }}>{t(`playerCard.${mode}`)}</Button>)}
            <Button asChild variant="outline"><NextLink href="/user/cube-cards/">{t("playerCard.myCards")}</NextLink></Button>
          </HStack>
        } />
      </Box>
      <input ref={photoInput} id="player-card-photo" type="file" hidden aria-label={t("playerCard.photo")}
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/bmp"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (!selected) return;
          cancelCutout(); setSelecting(false); setBox(INITIAL_BOX); setMotionBox(INITIAL_MOTION_BOX);
          setReplacement(null); setPicking(false); setRetry(false); tap.current = null;
          resetRepair();
          setImage(null); setFile(null); setCrop(INITIAL_CROP); setError(null); drag.current = null;
          setMotionPlacement(INITIAL_MOTION_PLACEMENT);
          if (!/^image\/(png|jpeg|webp|avif|gif|bmp)$/.test(selected.type) || selected.size === 0) setError("decode");
          else setFile(selected);
          event.target.value = "";
        }} />
      <Grid templateColumns={{ base: "minmax(0, 1fr)", md: "minmax(0, 1.05fr) minmax(0, 1fr)" }} gap={{ base: 4, md: 5 }} alignItems="start">
        <Surface p={{ base: 3, md: 3.5 }}>
          {template === "motion" && image && <Box display={showMotionWorkbench ? "none" : "block"}>
            <CardArtwork revision={motionRevision} template="motion" alt={t("playerCard.motion")} onDragSubject={(dx, dy) => setMotionPlacement(value => clampMotionPlacement({ ...value, x: value.x + dx, y: value.y + dy }))}>
              <canvas ref={motionCanvas} width={CARD_SIZE} height={MOTION_HEIGHT} role="img" aria-label={t("playerCard.motion")} />
            </CardArtwork>
          </Box>}
          {showMotionWorkbench && <>
            <Text fontSize="sm" fontWeight="semibold" mb="2">{t(repairing ? "playerCard.cutoutWorkbench" : "playerCard.cropEditor")}</Text>
            <Box position="relative" mx="auto" bg="bg.subtle" overflow="hidden" style={{ aspectRatio: `${image.naturalWidth} / ${image.naturalHeight}`, maxHeight: "min(520px, calc(100dvh - 250px))", width: "auto", maxWidth: "100%" }}>
              <canvas ref={motionWorkbench} data-testid="motion-workbench" aria-label={t(repairing ? "playerCard.cutoutWorkbench" : "playerCard.cropEditor")}
                width={Math.min(1080, image.naturalWidth)} height={Math.min(1440, Math.round(image.naturalHeight * Math.min(1, 1080 / image.naturalWidth)))}
                {...editorProps} style={{ ...editorProps.style, position: "absolute", inset: 0 }} />
              {selectionOverlay}
              {repairing && brushRing}
            </Box>
          </>}
          <Box position="relative" aspectRatio="1" bg="bg.subtle" overflow="hidden" display={showClassicCanvas ? "block" : "none"} maxW={{ base: "100%", md: "min(100%, 460px, calc(100dvh - 250px))" }} mx="auto">
            <canvas ref={canvas} width={CARD_SIZE} height={CARD_SIZE} aria-label={t("playerCard.preview")} {...editorProps} />
            {template === "classic" && repairing && replacement && <canvas ref={classicWorkbench} width={CARD_SIZE} height={CARD_SIZE} aria-hidden="true"
              style={{ display: "block", position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />}
            {showClassicCanvas && selectionOverlay}
            {showClassicCanvas && brushRing}
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
          {image && !selecting && <Text role="status" fontSize="sm" color="fg.muted" mt="2.5">{t(!showClassicCanvas && !showMotionWorkbench ? "playerCard.motionMove" : repairing === "restore" ? "playerCard.restoreHint" : repairing ? "playerCard.repairHint" : picking ? retry ? "playerCard.retryBackground" : "playerCard.pickBackground" : "playerCard.move")}</Text>}
        </Surface>
        <Surface p={{ base: 4, md: 5 }}>
          <Stack gap="3.5">
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
            {image && opaque && !replacement && <Button variant="outline" aria-pressed={picking} onClick={() => {
              cancelCutout(); setSelecting(false); setPicking(!picking); setRetry(false); drag.current = null; tap.current = null;
            }}>{t(picking ? "playerCard.cancelBackground" : "playerCard.replaceBackground")}</Button>}
            {(replacement || canEditMotionMatte) && <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="2">
              <Button size="sm" variant={repairing === "erase" ? "solid" : "outline"} aria-pressed={repairing === "erase"} onClick={() => toggleBrush("erase")}>{t("playerCard.repair")}</Button>
              <Button size="sm" variant={repairing === "restore" ? "solid" : "outline"} aria-pressed={repairing === "restore"} onClick={() => toggleBrush("restore")}>{t("playerCard.restoreBrush")}</Button>
              <Button size="sm" variant="outline" disabled={!canUndo || cutting || !replacement} onClick={() => {
                replacement!.getContext("2d")!.putImageData(undo.current!, 0, 0);
                editRevision.current++;
                undo.current = null; setCanUndo(false); repaint();
              }}>{t("playerCard.undoStroke")}</Button>
              <Button size="sm" variant="outline" disabled={!replacement} onClick={() => { cancelCutout(); setSelecting(false); resetRepair(); setReplacement(null); setRetry(false); }}>{t("playerCard.restoreBackground")}</Button>
            </Grid>}
            {repairing && <Field.Root>
              <Field.Label htmlFor="player-card-brush-size">{t("playerCard.brushSize")}</Field.Label>
              <input id="player-card-brush-size" type="range" min="6" max="52" step="1" value={brushRadius} style={{ width: "100%", minHeight: 36, accentColor: "var(--accent)" }} onChange={event => setBrushRadius(Number(event.target.value))} />
            </Field.Root>}
            <Field.Root>
              <Field.Label htmlFor="player-card-name">{t("playerCard.name")}</Field.Label>
              <Input id="player-card-name" value={name} onChange={event => setName(event.target.value)} />
            </Field.Root>
            <Grid templateColumns={template === "motion" ? "repeat(2, minmax(0, 1fr))" : "1fr"} gap="3">
              <Field.Root disabled={!image}>
                <Field.Label htmlFor="player-card-zoom">{t("playerCard.zoom")}</Field.Label>
                <input id="player-card-zoom" type="range" min="1" max="3" step="0.01" value={crop.zoom} disabled={!image} style={{ width: "100%", minHeight: 36, accentColor: "var(--accent)" }} onChange={event => {
                  const zoom = Number(event.target.value);
                  cancelCutout(); setBox(INITIAL_BOX);
                  if (image) setCrop(value => zoomCrop(image.naturalWidth, image.naturalHeight, value, zoom));
                }} />
              </Field.Root>
              {template === "motion" && <Field.Root disabled={!image}>
                <Field.Label htmlFor="player-card-subject-scale">{t("playerCard.subjectScale")}</Field.Label>
                <input id="player-card-subject-scale" type="range" min="0.55" max="1.8" step="0.01" value={motionPlacement.scale} disabled={!image} style={{ width: "100%", minHeight: 36, accentColor: "var(--accent)" }} onChange={event => {
                  const scale = Number(event.target.value);
                  setMotionPlacement(value => ({ ...value, scale }));
                }} />
              </Field.Root>}
            </Grid>
            <HStack flexWrap="wrap" gap="2">
              <Button variant="outline" disabled={!image} onClick={() => { cancelCutout(); setBox(INITIAL_BOX); setMotionBox(INITIAL_MOTION_BOX); setCrop(INITIAL_CROP); setMotionPlacement(INITIAL_MOTION_PLACEMENT); }}>{t("playerCard.reset")}</Button>
              <Button colorPalette="brand" disabled={!image || nicknamePending} onClick={download}>{t(template === "motion" ? "playerCard.downloadMotion" : "playerCard.download")}</Button>
              {isLoggedIn(currentUser?.id) && <Button disabled={!image || nicknamePending || saving} onClick={() => void save()}>{t("playerCard.save")}</Button>}
            </HStack>
            {saveStatus && <Text role={saveStatus === "saveError" ? "alert" : "status"}>{t(`playerCard.${saveStatus}`)}</Text>}
            {error === "export" && <Text role="alert" color="fg.error">{t("playerCard.exportError")}</Text>}
          </Stack>
        </Surface>
      </Grid>
    </Box>
  );
}
