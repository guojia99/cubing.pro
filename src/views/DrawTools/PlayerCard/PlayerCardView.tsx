"use client";

import { Box, Button, Field, Grid, Input, Stack, Text } from "@chakra-ui/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PageHeader, Surface } from "@/components/ui/page";
import { useI18n } from "@/contexts/I18nProvider";
import { CARD_SIZE, INITIAL_CROP, cardFilename, clampCrop, paintCard, zoomCrop } from "./composition";
import { loadNicknameFont, NICKNAME_FALLBACK } from "./nicknameFont";
import { BackgroundEditor } from "./BackgroundEditor";

export function PlayerCardView() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [composite, setComposite] = useState<HTMLCanvasElement | null>(null);
  const [backgroundPending, setBackgroundPending] = useState(false);
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
      if (active) setImage(photo);
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
    if (image && canvas.current) paintCard(canvas.current, image, crop, nicknamePending ? "" : name, nicknameFont ?? NICKNAME_FALLBACK, composite ?? image);
  }, [image, crop, name, nicknamePending, nicknameFont, composite]);

  function download() {
    if (!image || !canvas.current || nicknamePending || backgroundPending) return;
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
          setImage(null); setComposite(null); setBackgroundPending(false); setFile(null); setCrop(INITIAL_CROP); setError(null); drag.current = null;
          if (!/^image\/(png|jpeg|webp|avif|gif|bmp)$/.test(selected.type) || selected.size === 0) setError("decode");
          else setFile(selected);
          event.target.value = "";
        }} />
      <Grid templateColumns={{ base: "minmax(0, 1fr)", md: "minmax(0, 1.3fr) minmax(0, 1fr)" }} gap={{ base: 5, md: 8 }} alignItems="start">
        <Surface p={{ base: 3, md: 4 }}>
          <Box position="relative" aspectRatio="1" bg="bg.subtle" overflow="hidden" borderRadius="lg">
            <canvas ref={canvas} width={CARD_SIZE} height={CARD_SIZE} role="img" aria-label={t("playerCard.preview")}
              style={{ display: "block", width: "100%", height: "100%", visibility: image ? "visible" : "hidden", touchAction: "none", cursor: image ? "grab" : "default" }}
              onPointerDown={(event) => {
                if (!image || !event.isPrimary || event.button !== 0) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
              }}
              onPointerMove={(event) => {
                const previous = drag.current;
                if (!image || previous?.id !== event.pointerId) return;
                const ratio = CARD_SIZE / event.currentTarget.getBoundingClientRect().width;
                const dx = (event.clientX - previous.x) * ratio;
                const dy = (event.clientY - previous.y) * ratio;
                drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
                setCrop(value => clampCrop(image.naturalWidth, image.naturalHeight, { ...value, x: value.x + dx, y: value.y + dy }));
              }}
              onPointerUp={(event) => {
                if (drag.current?.id === event.pointerId) {
                  drag.current = null;
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
              }}
              onPointerCancel={() => { drag.current = null; }}
              onLostPointerCapture={() => { drag.current = null; }}
            />
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
          {image && <Text fontSize="sm" color="fg.muted" mt="3">{t("playerCard.move")}</Text>}
        </Surface>
        <Surface>
          <Stack gap="6">
            {image && <Button variant="outline" onClick={() => photoInput.current?.click()}>{t("playerCard.photo")}</Button>}
            {image && <BackgroundEditor image={image} onChange={setComposite} onPending={setBackgroundPending} />}
            <Field.Root>
              <Field.Label htmlFor="player-card-name">{t("playerCard.name")}</Field.Label>
              <Input id="player-card-name" value={name} onChange={event => setName(event.target.value)} />
            </Field.Root>
            <Field.Root disabled={!image}>
              <Field.Label htmlFor="player-card-zoom">{t("playerCard.zoom")}</Field.Label>
              <input id="player-card-zoom" type="range" min="1" max="3" step="0.01" value={crop.zoom} disabled={!image} style={{ width: "100%", minHeight: 44, accentColor: "var(--accent)" }} onChange={event => {
                if (image) setCrop(value => zoomCrop(image.naturalWidth, image.naturalHeight, value, Number(event.target.value)));
              }} />
            </Field.Root>
            <Button variant="outline" disabled={!image} onClick={() => setCrop(INITIAL_CROP)}>{t("playerCard.reset")}</Button>
            <Button colorPalette="brand" disabled={!image || nicknamePending || backgroundPending} onClick={download}>{t("playerCard.download")}</Button>
            {error === "export" && <Text role="alert" color="fg.error">{t("playerCard.exportError")}</Text>}
          </Stack>
        </Surface>
      </Grid>
    </Box>
  );
}
