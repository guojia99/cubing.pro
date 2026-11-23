"use client";

import { Badge, Box, Button, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { PageHeader } from "@/components/ui/page";
import { toaster } from "@/components/ui/toaster";
import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import {
  deleteForumComment, getModerationComments, getRecentDiscussions, getReplyNotifications, markReplyRead,
  type ForumTarget,
} from "@/services/cubing-pro/algs/forum";
import { ForumScope, useFormulaForum } from "./ForumScope";
import { forumDate, ForumLoadState, ForumPagination, targetLabel, useForumErrorMessage, useForumQuery } from "./forumUi";

function TargetRow({ target, onOpen, children }: {
  target: ForumTarget;
  onOpen: () => void;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const content = <Stack gap="1">
    <HStack gap="2" flexWrap="wrap">
      <Text fontSize="sm" fontWeight="semibold" overflowWrap="anywhere">{targetLabel(target) || target.id}</Text>
      {target.unavailable && <Badge>{t("forum.targetUnavailable")}</Badge>}
    </HStack>
    {target.moves && <Text fontFamily="mono" overflowWrap="anywhere">{target.moves}</Text>}
    {children}
  </Stack>;
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
    {data.items.map(item => <TargetRow key={item.target.id} target={item.target} onOpen={() => open({ ...item.target, commentId: item.lastCommentId })}>
      <Text fontSize="xs" color="fg.muted">{t("forum.comments")} · {item.count} · {forumDate(item.lastActivity, locale)}</Text>
    </TargetRow>)}
    <ForumPagination page={data.page} total={data.total} onPage={setPage} />
  </Stack>;
}

function ReplyInbox() {
  const { t, locale } = useI18n();
  const { open, version, refresh: changed } = useFormulaForum();
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const message = useForumErrorMessage();
  const load = useCallback((signal: AbortSignal) => getReplyNotifications(page, signal), [page]);
  const { data, error, refresh } = useForumQuery(load, version);

  async function markUnavailableRead(id: number) {
    if (busy) return;
    setBusy(true);
    try {
      await markReplyRead(id);
      changed();
    } catch (error) {
      toaster.create({ type: "error", title: message(error) });
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <ForumLoadState error={error} retry={refresh} />;
  return <Stack>
    {data.items.length === 0 && <Text color="fg.muted">{t("forum.noReplies")}</Text>}
    {data.items.map(item => <TargetRow key={item.id} target={item.target} onOpen={() => open({
      kind: item.target.kind, id: item.target.id, commentId: item.commentId, notificationId: item.readAt ? undefined : item.id,
    })}>
      <HStack gap="2">
        {!item.readAt && <Badge colorPalette="brand">{t("forum.unread")}</Badge>}
        <Text fontWeight="medium" fontSize="sm">{item.authorName}</Text>
        <Text fontSize="xs" color="fg.muted">{forumDate(item.createdAt, locale)}</Text>
      </HStack>
      <Text lineClamp={2} overflowWrap="anywhere">{item.body}</Text>
      {item.target.unavailable && !item.readAt && <Button alignSelf="start" size="xs" variant="outline"
        disabled={busy} onClick={() => void markUnavailableRead(item.id)}>{t("forum.markRead")}</Button>}
    </TargetRow>)}
    <ForumPagination page={data.page} total={data.total} onPage={setPage} />
  </Stack>;
}

export function FormulaRepliesPage() {
  const { t } = useI18n();
  const { currentUser, loading } = useAuth();
  return <Stack gap="5"><PageHeader title={t("forum.replies")} />
    {currentUser?.id ? <ForumScope><ReplyInbox key={currentUser.id} /></ForumScope>
      : loading ? <Text>{t("algs.loading")}</Text>
      : <Button asChild alignSelf="start"><Link href="/login?redirect=%2Fuser%2Fformula-replies">{t("user.login")}</Link></Button>}
  </Stack>;
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
