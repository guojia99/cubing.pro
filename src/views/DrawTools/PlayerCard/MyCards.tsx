"use client";
import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { Box, Button, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import { isLoggedIn } from "@/lib/auth";
import { Surface } from "@/components/ui/page";
import { cubeCardImage, deleteCubeCard, listCubeCards, type CubeCard } from "@/services/cubing-pro/cubeCards";
import { isRequestCanceled } from "@/services/cubing-pro/request";
import { CardArtwork } from "./CardArtwork";
import { cardFilename } from "./composition";

export function MyCards() {
  const { currentUser, loading } = useAuth();
  const { t } = useI18n();
  // Remount private state when the authenticated account changes.
  return <Surface maxW="1000px" mx="auto">
    <Heading mb="5">{t("playerCard.myCards")}</Heading>
    {loading ? <Text role="status">{t("playerCard.loadingCards")}</Text> : isLoggedIn(currentUser?.id)
      ? <CardCollection key={currentUser!.id} />
      : <Button asChild><NextLink href="/login?redirect=%2Fuser%2Fcube-cards%2F">{t("auth.needLogin")}</NextLink></Button>}
  </Surface>;
}
function CardCollection() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<{ items: CubeCard[]; total: number } | null>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const [selected, setSelected] = useState<CubeCard | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); setData(null); setError(false);
    listCubeCards(page, controller.signal).then(setData, e => { if (!isRequestCanceled(e)) setError(true); });
    return () => controller.abort();
  }, [page, revision]);
  useEffect(() => {
    if (!selected) return;
    previewHeading.current?.focus({ preventScroll: true });
    previewHeading.current?.scrollIntoView({ block: "nearest" });
    const controller = new AbortController(); let url: string | undefined;
    cubeCardImage(selected.id, controller.signal).then(blob => {
      if (controller.signal.aborted) return;
      url = URL.createObjectURL(blob); setSrc(url);
    }, e => { if (!isRequestCanceled(e)) setError(true); });
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [selected]);
  async function remove(card: CubeCard) {
    if (!window.confirm(t("playerCard.deleteConfirm"))) return;
    setBusy(true); setError(false);
    try {
      await deleteCubeCard(card.id);
      if (selected?.id === card.id) { setSelected(null); setSrc(null); }
      if (data?.items.length === 1 && page > 1) setPage(page - 1);
      else setRevision(v => v + 1);
    } catch { setError(true); } finally { setBusy(false); }
  }
  return <Stack gap="5">
    <Button asChild variant="outline" alignSelf="start"><NextLink href="/draw-tools/player-card/">{t("playerCard.title")}</NextLink></Button>
    {error && <Stack><Text role="alert" color="fg.error">{t("playerCard.cardsError")}</Text><Button onClick={() => { setSelected(null); setSrc(null); setRevision(v => v + 1); }}>{t("playerCard.retry")}</Button></Stack>}
    {!data && !error && <Text role="status">{t("playerCard.loadingCards")}</Text>}
    {data?.items.length === 0 && <Text>{t("playerCard.empty")}</Text>}
    {selected && <Box maxW="440px" w="full" mx="auto">
      <Heading ref={previewHeading} tabIndex={-1} scrollMarginTop="24" size="md">{selected.title}</Heading>
      {src ? <><CardArtwork key={src} src={src} template={selected.template} alt={selected.title} /><Button asChild><a href={src} download={cardFilename(selected.title)}>{t("playerCard.downloadSaved")}</a></Button></> : !error && <Text role="status">{t("playerCard.loadingCards")}</Text>}
      <Button ml="2" variant="outline" onClick={() => { setSelected(null); setSrc(null); }}>{t("playerCard.close")}</Button>
    </Box>}
    {data?.items.map(card => <HStack key={card.id} justify="space-between" flexWrap="wrap" borderBottomWidth="1px" py="3">
      <Box minW="0" flex="1"><Text fontWeight="bold" overflowWrap="anywhere">{card.title}</Text><Text fontSize="sm" color="fg.muted">{t(card.template === "motion" ? "playerCard.motion" : "playerCard.classic")}</Text></Box>
      <HStack><Button variant="outline" onClick={() => { setError(false); setSrc(null); setSelected({ ...card }); }}>{t("playerCard.view")}</Button><Button variant="outline" disabled={busy} onClick={() => void remove(card)}>{t("playerCard.delete")}</Button></HStack>
    </HStack>)}
    {data && <HStack justify="center"><Button disabled={page === 1 || busy} onClick={() => setPage(page - 1)}>{t("playerCard.previous")}</Button><Text>{page} / {Math.max(1, Math.ceil(data.total / 20))}</Text><Button disabled={page * 20 >= data.total || busy} onClick={() => setPage(page + 1)}>{t("playerCard.next")}</Button></HStack>}

  </Stack>;
}
