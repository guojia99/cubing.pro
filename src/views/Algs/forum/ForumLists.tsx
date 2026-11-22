"use client";

import { Badge, Box, Button, HStack, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { PageHeader } from "@/components/ui/page";
import { toaster } from "@/components/ui/toaster";
import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import {
  deleteForumComment, getModerationComments, getRecentDiscussions, getReplyNotifications, markReplyRead,
  type ForumNotification, type ForumTarget,
} from "@/services/cubing-pro/algs/forum";
import { ForumScope, useFormulaForum } from "./ForumScope";
import { forumDate, ForumLoadState, ForumPagination, targetLabel, useForumErrorMessage, useForumQuery } from "./forumUi";

function TargetRow({ target, onOpen, children, disabled }: {
  target: ForumTarget;
  onOpen: () => void;
  children?: ReactNode;
  disabled?: boolean;
}) {
  return <Box asChild textAlign="start" width="full" p="3" borderWidth="1px" borderRadius="md"
    _hover={{ bg: "bg.subtle", borderColor: "brand.500" }}>
    <button type="button" onClick={onOpen} disabled={disabled}>
      <Stack gap="1">
        <Text fontSize="sm" fontWeight="semibold" overflowWrap="anywhere">{targetLabel(target)}</Text>
        {target.moves && <Text fontFamily="mono" overflowWrap="anywhere">{target.moves}</Text>}
        {children}
      </Stack>
    </button>
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
    {data.items.map(item => <TargetRow key={item.target.id} target={item.target} onOpen={() => open(item.target)}>
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

  async function viewReply(item: ForumNotification) {
    if (busy) return;
    setBusy(true);
    try {
      if (!item.readAt) {
        await markReplyRead(item.id);
        changed();
      }
      open({ ...item.target, commentId: item.commentId });
    } catch (error) {
      toaster.create({ type: "error", title: message(error) });
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <ForumLoadState error={error} retry={refresh} />;
  return <Stack>
    {data.items.length === 0 && <Text color="fg.muted">{t("forum.noReplies")}</Text>}
    {data.items.map(item => <TargetRow key={item.id} target={item.target} disabled={busy} onOpen={() => void viewReply(item)}>
      <HStack gap="2">
        {!item.readAt && <Badge colorPalette="brand">{t("forum.unread")}</Badge>}
        <Text fontWeight="medium" fontSize="sm">{item.authorName}</Text>
        <Text fontSize="xs" color="fg.muted">{forumDate(item.createdAt, locale)}</Text>
      </HStack>
      <Text lineClamp={2} overflowWrap="anywhere">{item.body}</Text>
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
      if (data?.items.length === 1 && page > 1) setPage(page - 1);
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
    {data.items.map(item => <HStack key={item.id} align="center">
      <TargetRow target={item.target} onOpen={() => open({ ...item.target, commentId: item.id })}>
        <Text fontSize="sm" color="fg.muted">{item.authorName} · {forumDate(item.createdAt, locale)}</Text>
        <Text whiteSpace="pre-wrap" overflowWrap="anywhere">{item.body}</Text>
      </TargetRow>
      <Button size="xs" variant="ghost" colorPalette="red" disabled={busy} onClick={() => void remove(item.id)}>{t("draws.delete")}</Button>
    </HStack>)}
    <ForumPagination page={data.page} total={data.total} onPage={setPage} />
  </Stack>;
}

export function FormulaModerationPage() {
  const { t } = useI18n();
  return <AdminGuard><Stack gap="5"><PageHeader title={t("forum.moderation")} />
    <ForumScope><ModerationList /></ForumScope>
  </Stack></AdminGuard>;
}
