"use client";

import { Badge, Box, Button, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { LuChevronRight } from "react-icons/lu";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { toaster } from "@/components/ui/toaster";
import { useI18n } from "@/contexts/I18nProvider";
import {
  deleteForumComment, getModerationComments, getRecentDiscussions,
  type ForumTarget,
} from "@/services/cubing-pro/algs/forum";
import { ForumScope, useFormulaForum } from "./ForumScope";
import { forumDate, ForumLoadState, ForumPagination, targetLabel, useForumErrorMessage, useForumQuery } from "./forumUi";

function TargetRow({ target, onOpen, children, recent = false }: {
  target: ForumTarget;
  onOpen: () => void;
  children?: ReactNode;
  recent?: boolean;
}) {
  const { t } = useI18n();
  const content = <Stack gap="1" minW="0" flex={recent ? "1" : undefined}>
    <HStack gap="2" flexWrap="wrap">
      <Text fontSize={recent ? "md" : "sm"} color={recent ? "fg" : undefined} fontWeight="semibold" overflowWrap="anywhere">{targetLabel(target) || target.id}</Text>
      {target.unavailable && <Badge>{t("forum.targetUnavailable")}</Badge>}
    </HStack>
    {target.moves && <Text fontFamily="mono" overflowWrap="anywhere">{target.moves}</Text>}
    {children}
  </Stack>;
  if (recent) return <Box asChild textAlign="start" width="full" minH="14" p="4" borderWidth="1px" borderRadius="md"
    cursor={target.unavailable ? undefined : "pointer"}
    _hover={target.unavailable ? undefined : { bg: "accent.soft", borderColor: "brand.border" }}
    _focusVisible={{ outline: "2px solid", outlineColor: "brand.focusRing", outlineOffset: "2px", bg: "accent.soft" }}>
    {target.unavailable ? content : <button type="button" onClick={onOpen}>
      <HStack gap="3">
        {content}
        <Box asChild color="accent" flexShrink="0"><LuChevronRight aria-hidden="true" size={20} /></Box>
      </HStack>
    </button>}
  </Box>;
  return <Box asChild textAlign="start" width="full" p="3" borderWidth="1px" borderRadius="md"
    _hover={target.unavailable ? undefined : { bg: "bg.subtle", borderColor: "brand.500" }}>
    {target.unavailable ? content : <button type="button" onClick={onOpen}>{content}</button>}
  </Box>;
}

export function RecentDiscussions() {
  const { t, locale } = useI18n();
  const { open, version } = useFormulaForum();
  const [page, setPage] = useState(1);
  const load = useCallback((signal: AbortSignal) => getRecentDiscussions(page, signal), [page]);
  const { data, error, refresh } = useForumQuery(load, version);
  if (!data) return <ForumLoadState error={error} retry={refresh} />;
  return <Stack>
    {data.items.length === 0 && <Text color="fg.muted">{t("forum.noRecent")}</Text>}
    {data.items.map(item => <TargetRow recent key={item.target.id} target={item.target} onOpen={() => open({ ...item.target, commentId: item.lastCommentId })}>
      <Text fontSize="xs" color="fg.muted">{t("forum.comments")} · {item.count} · {forumDate(item.lastActivity, locale)}</Text>
    </TargetRow>)}
    <ForumPagination page={data.page} total={data.total} onPage={setPage} />
  </Stack>;
}

export function FormulaRepliesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/user/notifications?type=formula-reply");
  }, [router]);
  return null;
}

function ModerationList() {
  const { locale, t } = useI18n();
  const { open, version, refresh: changed } = useFormulaForum();
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const message = useForumErrorMessage();
  const load = useCallback((signal: AbortSignal) => getModerationComments(page, signal), [page]);
  const { data, error, refresh } = useForumQuery(load, version);

  async function remove(id: number) {
    if (busy || !window.confirm(t("forum.deletePrompt"))) return;
    setBusy(true);
    try {
      await deleteForumComment(id);
      if (data) setPage(data.page);
      changed();
    } catch (error) {
      toaster.create({ type: "error", title: message(error) });
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <ForumLoadState error={error} retry={refresh} />;
  return <Stack>
    {data.items.length === 0 && <Text color="fg.muted">{t("forum.empty")}</Text>}
    {data.items.map(item => <Stack as="article" data-testid="moderation-comment" key={item.id}
      gap="2" p={{ base: "3", md: "4" }} borderWidth="1px" borderRadius="lg" minW="0">
      <HStack gap="2" flexWrap="wrap">
        <Text fontSize="sm" fontWeight="semibold" overflowWrap="anywhere">{targetLabel(item.target, true) || item.target.id}</Text>
        {item.target.unavailable && <Badge>{t("forum.targetUnavailable")}</Badge>}
      </HStack>
      {item.target.moves && <Text fontSize="sm" fontFamily="mono" overflowWrap="anywhere">{item.target.moves}</Text>}
      <HStack gap="2" flexWrap="wrap" fontSize="xs" color="fg.muted">
        <Text fontWeight="medium" color="fg">{item.authorName}</Text>
        <Text asChild><time dateTime={item.createdAt}>{forumDate(item.createdAt, locale)}</time></Text>
      </HStack>
      <Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere" lineClamp={3}>{item.body}</Text>
      <HStack gap="2" flexWrap="wrap">
        <Button size="xs" variant="outline" colorPalette="brand" disabled={item.target.unavailable}
          onClick={() => open({ ...item.target, commentId: item.id })}>{t("forum.viewContext")}</Button>
        <Button size="xs" variant="outline" colorPalette="red" disabled={busy}
          onClick={() => void remove(item.id)}>{t("draws.delete")}</Button>
      </HStack>
    </Stack>)}
    <ForumPagination page={data.page} total={data.total} onPage={setPage} />
  </Stack>;
}

export function FormulaModerationPage() {
  const { t } = useI18n();
  return <AdminGuard><Stack gap="4">
    <Stack as="header" gap="1">
      <Heading as="h1" fontSize={{ base: "xl", md: "2xl" }}>{t("forum.moderation")}</Heading>
      <Text fontSize="sm" color="fg.muted">{t("forum.moderationHint")}</Text>
    </Stack>
    <ForumScope><ModerationList /></ForumScope>
  </Stack></AdminGuard>;
}
