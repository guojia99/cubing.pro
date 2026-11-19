"use client";

import { Badge, Box, Button, Dialog, Field, Heading, HStack, Image, Input, Portal, SimpleGrid, Spinner, Stack, Text, Textarea } from "@chakra-ui/react";
import { useEffect, useId, useRef, useState } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { PageHeader, Surface } from "@/components/ui/page";
import { useI18n } from "@/contexts/I18nProvider";
import { getAdvertisementMessages } from "@/i18n/messages/advertisements";
import { Auth } from "@/lib/auth";
import { getAdminAdvertisements, resolveAdvertisementImage, saveAdvertisements, uploadAdvertisementImage, type Advertisement, type AdvertisementImage } from "@/services/cubing-pro/advertisements";
import { ManagedAdFullContent, ManagedAdThumbnail } from "@/views/Advertisement/ManagedAdvertisement";
import { isAdvertisementUrl, moveAdvertisement, newAdvertisement, validAdvertisementImage, validateAdvertisements } from "./advertisementDraft";
import "./admin-ui.css";

function readableError(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: { msg?: unknown; message?: unknown } } }).response?.data;
    if (typeof data?.msg === "string") return data.msg;
    if (typeof data?.message === "string") return data.message;
  }
  return error instanceof Error ? error.message : "";
}

type ImageFieldProps = {
  value: string;
  onChange: (url: string) => void;
  upload: (file: File, apply: (url: string) => void) => Promise<void>;
  enlarge: (url: string) => void;
};

function AdvertisementImageField({ value, onChange, upload, enlarge }: ImageFieldProps) {
  const uploadId = useId();
  const { locale } = useI18n();
  const m = getAdvertisementMessages(locale);
  const src = isAdvertisementUrl(value, true) ? resolveAdvertisementImage(value) : "";
  return (
    <Stack gap="3" minW="0">
      <Box bg="bg.muted" borderRadius="md" overflow="hidden" h="44" display="flex" alignItems="center" justifyContent="center">
        {src ? <Image src={src} alt={m("advertisements.preview")} w="full" h="full" objectFit="contain" /> : <Text color="fg.muted" fontSize="sm">{m("advertisements.cover")}</Text>}
      </Box>
      <Field.Root required>
        <Field.Label>{m("advertisements.imageUrl")}</Field.Label>
        <Input value={value} onChange={e => onChange(e.target.value)} />
      </Field.Root>
      <Field.Root>
        <Field.Label htmlFor={uploadId}>{m("advertisements.upload")}</Field.Label>
        <input id={uploadId} type="file" accept="image/jpeg,image/png" style={{ width: "100%", minWidth: 0, maxWidth: "100%" }} onChange={e => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file, onChange);
        }} />
      </Field.Root>
      {src ? <Button size="xs" variant="outline" alignSelf="start" onClick={() => enlarge(value)}>{m("advertisements.enlarge")}</Button> : null}
    </Stack>
  );
}

function AdvertisementGalleryEditor({ images, onChange, products, upload, enlarge }: {
  images: AdvertisementImage[];
  onChange: (images: AdvertisementImage[]) => void;
  products: boolean;
  upload: ImageFieldProps["upload"];
  enlarge: ImageFieldProps["enlarge"];
}) {
  const { locale, t } = useI18n();
  const m = getAdvertisementMessages(locale);
  const title = m(products ? "advertisements.products" : "advertisements.showcase");
  const update = (index: number, patch: Partial<AdvertisementImage>) => onChange(images.map((image, i) => i === index ? { ...image, ...patch } : image));
  return (
    <Stack as="section" gap="4" aria-label={title}>
      <HStack justify="space-between" flexWrap="wrap"><Heading as="h3" size="md">{title}</Heading><Button size="sm" variant="outline" disabled={images.length >= 20} onClick={() => onChange([...images, { imageUrl: "", caption: "", ...(products ? { href: "" } : {}) }])}>{m("advertisements.addImage")}</Button></HStack>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="4" alignItems="start">
      {images.map((image, index) => <Box key={index} borderWidth="1px" borderColor="border" borderRadius="lg" p="4" minW="0" bg="bg">
        <Stack gap="3">
          <HStack flexWrap="wrap"><Text fontSize="sm">{index + 1}</Text><Button size="xs" variant="ghost" disabled={index === 0} onClick={() => onChange(moveAdvertisement(images, index, -1))}>{m("advertisements.moveUp")}</Button><Button size="xs" variant="ghost" disabled={index === images.length - 1} onClick={() => onChange(moveAdvertisement(images, index, 1))}>{m("advertisements.moveDown")}</Button><Button size="xs" variant="ghost" colorPalette="red" onClick={() => onChange(images.filter((_, i) => i !== index))}>{t("teamMatch.delete")}</Button></HStack>
          <AdvertisementImageField value={image.imageUrl} onChange={imageUrl => update(index, { imageUrl })} upload={upload} enlarge={enlarge} />
          <Field.Root><Field.Label>{m("advertisements.caption")}</Field.Label><Textarea rows={2} value={image.caption} onChange={e => update(index, { caption: e.target.value })} /></Field.Root>
          {products ? <Field.Root><Field.Label>{m("advertisements.productLink")}</Field.Label><Input value={image.href ?? ""} onChange={e => update(index, { href: e.target.value })} /><Field.HelperText>{m("advertisements.urlHint")}</Field.HelperText></Field.Root> : null}
        </Stack>
      </Box>)}
      </SimpleGrid>
    </Stack>
  );
}

export function AdminAdvertisementsPageView() {
  return <AdminGuard required={[Auth.AuthSuperAdmin]}><AdvertisementsManager /></AdminGuard>;
}

function AdvertisementsManager() {
  const { locale, t } = useI18n();
  const m = getAdvertisementMessages(locale);
  // null means the initial GET has not succeeded: never allow it to become a PUT [].
  const [items, setItems] = useState<Advertisement[] | null>(null);
  const [baseline, setBaseline] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState<"save" | "upload" | null>(null);
  const operation = useRef(false);
  const mounted = useRef(false);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<"card" | "detail" | null>(null);
  const [largeImage, setLargeImage] = useState<string | null>(null);
  const dirty = items !== null && JSON.stringify(items) !== baseline;
  const ad = items?.[selected];
  const locked = busy !== null || loading || items === null;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    getAdminAdvertisements().then((data: Advertisement[]) => {
      if (!active) return;
      if (!Array.isArray(data)) throw new Error();
      setItems(data);
      setBaseline(JSON.stringify(data));
      setSelected(0);
    }).catch((reason: unknown) => {
      if (active) setLoadError(readableError(reason));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  useEffect(() => {
    if (!dirty && !busy) return;
    const message = getAdvertisementMessages(locale)("advertisements.leaveConfirm");
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const navigate = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download") || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const destination = new URL(anchor.href);
      if (destination.origin === location.origin && destination.pathname === location.pathname && destination.search === location.search) return;
      if (!window.confirm(message)) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", navigate, true); };
  }, [dirty, busy, locale]); // The message follows the selected language without refetching drafts.

  function change(next: Advertisement[]) {
    if (operation.current || locked) return;
    setItems(next);
    setError("");
    setSaved(false);
  }

  function update(patch: Partial<Advertisement>) {
    if (items) change(items.map((item, index) => index === selected ? { ...item, ...patch } : item));
  }

  async function save() {
    if (operation.current || locked || !items || !dirty) return;
    const invalid = validateAdvertisements(items);
    if (invalid) { setSelected(invalid.index); setError(m(invalid.messageKey)); return; }
    if (items.length === 0 && !window.confirm(m("advertisements.clearConfirm"))) return;
    operation.current = true;
    setBusy("save");
    setError("");
    setSaved(false);
    const snapshot = structuredClone(items);
    try {
      await saveAdvertisements(snapshot);
      if (mounted.current) { setBaseline(JSON.stringify(snapshot)); setSaved(true); }
    } catch (reason) {
      if (mounted.current) setError(`${t("profile.saveFail")} ${readableError(reason)}`.trim());
    } finally {
      operation.current = false;
      if (mounted.current) setBusy(null);
    }
  }

  async function upload(file: File, apply: (url: string) => void) {
    if (operation.current || locked) return;
    operation.current = true;
    setBusy("upload");
    setError("");
    setSaved(false);
    let bitmap: ImageBitmap | undefined;
    try {
      if (!["image/jpeg", "image/png"].includes(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024) throw new Error();
      bitmap = await createImageBitmap(file);
      if (!validAdvertisementImage(file, bitmap.width, bitmap.height)) throw new Error();
      const result = await uploadAdvertisementImage(file);
      if (!isAdvertisementUrl(result.url, true)) throw new Error();
      if (mounted.current) {
        // Unlock the synchronous mutation guard only after the upload has resolved.
        operation.current = false;
        apply(result.url);
      }
    } catch (reason) {
      if (mounted.current) setError(`${m("advertisements.uploadError")} ${readableError(reason)}`.trim());
    } finally {
      bitmap?.close();
      operation.current = false;
      if (mounted.current) setBusy(null);
    }
  }

  return (
    <Stack className="admin-page" gap="6">
      <PageHeader eyebrow={t("admin.admins.siteManagement")} title={m("advertisements.adminTitle")} description={m("advertisements.adminDescription")} />
      <Surface position="sticky" top="4" zIndex="10" boxShadow="md" aria-label={m("advertisements.save")}>
        <HStack flexWrap="wrap" gap="3">
          <Button colorPalette="brand" disabled={locked || !dirty} loading={busy === "save"} onClick={() => void save()}>{m("advertisements.save")}</Button>
          <Button variant="outline" disabled={locked || (items?.length ?? 0) >= 50} onClick={() => {
            if (!items || operation.current) return;
            change([...items, newAdvertisement()]);
            setSelected(items.length);
          }}>{m("advertisements.add")}</Button>
          {busy === "upload" ? <Spinner size="sm" aria-label={m("advertisements.upload")} /> : null}
          {dirty ? <Text role="status" fontSize="sm" color="fg.muted">{m("advertisements.unsaved")}</Text> : null}
          {saved ? <Text role="status">{t("profile.saveOk")}</Text> : null}
        </HStack>
        <Text mt="3" fontSize="sm" color="fg.muted">{m("advertisements.limit")}</Text>
        {error ? <Text mt="3" role="alert" color="red.fg">{error}</Text> : null}
      </Surface>
      {loading ? <HStack role="status"><Spinner size="sm" /><Text>{m("advertisements.loading")}</Text></HStack> : loadError !== null ? <Surface><Stack gap="3"><Text role="alert">{m("advertisements.loadError")}{loadError ? ` ${loadError}` : ""}</Text><Button alignSelf="start" variant="outline" onClick={() => setAttempt(value => value + 1)}>{m("advertisements.retry")}</Button></Stack></Surface> : items?.length === 0 ? <Surface><Text>{m("advertisements.empty")}</Text></Surface> : (
        <SimpleGrid templateColumns={{ base: "minmax(0, 1fr)", lg: "minmax(0, 1fr) minmax(0, 3fr)" }} gap="6" alignItems="start" data-ad-editor-layout>
          <Stack as="section" gap="2" minW="0" aria-label={m("advertisements.adminTitle")}>
            {items?.map((item, index) => <Surface key={index} p="2" minW="0" borderColor={selected === index ? "accent" : "border"}>
              <Stack gap="1">
                <Button variant="ghost" justifyContent="start" whiteSpace="normal" height="auto" py="2" textAlign="start" overflowWrap="anywhere" aria-pressed={selected === index} disabled={locked} onClick={() => { setSelected(index); setError(""); }}>{index + 1}. {item.title || item.key}</Button>
                <Badge alignSelf="start" mx="2" colorPalette={item.enabled ? "green" : "gray"}>{m(item.enabled ? "advertisements.enabled" : "advertisements.disabled")}</Badge>
              </Stack>
            </Surface>)}
          </Stack>
          {ad ? <Stack minW="0" gap="6">
            <Surface as="section" minW="0">
              <Stack gap="5">
                <HStack justify="space-between" flexWrap="wrap"><Heading as="h2" size="lg">{ad.title || t("teamMatch.edit")}</Heading><HStack flexWrap="wrap"><Button size="sm" variant="outline" disabled={locked} onClick={() => setPreview("card")}>{m("advertisements.preview")}</Button><Button size="sm" variant="outline" disabled={locked} onClick={() => setPreview("detail")}>{m("advertisements.detailPreview")}</Button></HStack></HStack>
                <HStack flexWrap="wrap" gap="2">
                  <Button size="xs" variant="ghost" disabled={locked} onClick={() => change(items!.map((value, i) => i === selected ? { ...value, enabled: !value.enabled } : value))}>{m(ad.enabled ? "advertisements.disabled" : "advertisements.enabled")}</Button>
                  <Button size="xs" variant="ghost" disabled={locked || selected === 0} onClick={() => { change(moveAdvertisement(items!, selected, -1)); setSelected(selected - 1); }}>{m("advertisements.moveUp")}</Button>
                  <Button size="xs" variant="ghost" disabled={locked || selected === items!.length - 1} onClick={() => { change(moveAdvertisement(items!, selected, 1)); setSelected(selected + 1); }}>{m("advertisements.moveDown")}</Button>
                  <Button size="xs" variant="ghost" colorPalette="red" disabled={locked} onClick={() => {
                    if (operation.current || !window.confirm(m("advertisements.deleteConfirm"))) return;
                    change(items!.filter((_, i) => i !== selected));
                    setSelected(Math.max(0, selected - 1));
                  }}>{t("teamMatch.delete")}</Button>
                </HStack>
                <Heading as="h3" size="md">{m("advertisements.basicInfo")}</Heading>
              <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
                <Stack gap="5">
                  <Field.Root required><Field.Label>{m("advertisements.key")}</Field.Label><Input value={ad.key} maxLength={64} onChange={e => update({ key: e.target.value })} /><Field.HelperText>{m("advertisements.keyHint")}</Field.HelperText></Field.Root>
                  <Field.Root required><Field.Label>{m("advertisements.title")}</Field.Label><Input value={ad.title} onChange={e => update({ title: e.target.value })} /></Field.Root>
                  <Field.Root><Field.Label>{m("advertisements.description")}</Field.Label><Textarea rows={4} value={ad.description} onChange={e => update({ description: e.target.value })} /></Field.Root>
                  <Field.Root><Field.Label>{m("advertisements.contact")}</Field.Label><Textarea rows={2} value={ad.contact} onChange={e => update({ contact: e.target.value })} /></Field.Root>
                  <Field.Root required><Field.Label>{m("advertisements.duration")}</Field.Label><Input type="number" min={1} max={120} step="any" value={Number.isFinite(ad.duration) ? ad.duration : ""} onChange={e => update({ duration: e.target.valueAsNumber })} /></Field.Root>
                  <Field.Root><Field.Label>{m("advertisements.targetUrl")}</Field.Label><Input value={ad.targetUrl} onChange={e => update({ targetUrl: e.target.value })} /><Field.HelperText>{m("advertisements.urlHint")}</Field.HelperText></Field.Root>
                  <label><HStack><input type="checkbox" checked={ad.enabled} onChange={e => update({ enabled: e.target.checked })} /><Text>{m("advertisements.enabled")}</Text></HStack></label>
                  <Box borderWidth="1px" borderColor="border" borderRadius="lg" p="4">
                  <Heading as="h3" size="md" mb="4">{m("advertisements.cover")}</Heading>
                  <AdvertisementImageField value={ad.imageUrl} onChange={imageUrl => update({ imageUrl })} upload={upload} enlarge={setLargeImage} />
                  <Text fontSize="sm" color="fg.muted">{m("advertisements.uploadHint")}</Text>
                  </Box>
                </Stack>
              </fieldset>
            </Stack>
            </Surface>
            <Surface as="section" minW="0">
              <Stack gap="5">
                <Heading as="h2" size="lg">{m("advertisements.detailContent")}</Heading>
                <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}><Stack gap="6">
                  <AdvertisementGalleryEditor images={ad.products} onChange={products => update({ products })} products upload={upload} enlarge={setLargeImage} />
                  <AdvertisementGalleryEditor images={ad.showcase} onChange={showcase => update({ showcase })} products={false} upload={upload} enlarge={setLargeImage} />
                </Stack></fieldset>
                <Button alignSelf="end" colorPalette="brand" disabled={locked || !dirty} loading={busy === "save"} onClick={() => void save()}>{m("advertisements.saveChanges")}</Button>
              </Stack>
            </Surface>
          </Stack> : null}
        </SimpleGrid>
      )}
      <Dialog.Root open={preview !== null || largeImage !== null} onOpenChange={e => { if (!e.open) { setPreview(null); setLargeImage(null); } }} scrollBehavior="inside" size="xl">
        <Portal><Dialog.Backdrop /><Dialog.Positioner><Dialog.Content>
          <Dialog.Header><Dialog.Title>{largeImage ? m("advertisements.enlarge") : m(preview === "card" ? "advertisements.cardPreview" : "advertisements.detailPreview")}</Dialog.Title></Dialog.Header>
          <Dialog.Body>
            {largeImage ? <Image src={resolveAdvertisementImage(largeImage)} alt={m("advertisements.preview")} maxH="75vh" mx="auto" objectFit="contain" /> : ad ? preview === "card" ? <ManagedAdThumbnail ad={ad} preview /> : <ManagedAdFullContent ad={ad} /> : null}
          </Dialog.Body>
          <Dialog.Footer>{preview === "card" ? <Button variant="outline" onClick={() => setPreview("detail")}>{m("advertisements.detailPreview")}</Button> : null}<Button onClick={() => { setPreview(null); setLargeImage(null); }}>{m("advertisements.close")}</Button></Dialog.Footer>
        </Dialog.Content></Dialog.Positioner></Portal>
      </Dialog.Root>
    </Stack>
  );
}
