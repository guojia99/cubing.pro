"use client";

import { Badge, Box, Button, CloseButton, Dialog, HStack, Stack, Text, Textarea } from "@chakra-ui/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toaster } from "@/components/ui/toaster";
import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import { Auth, hasAnyAuth } from "@/lib/auth";
import { addForumComment, deleteForumComment, getForumComments, markReplyRead, type ForumComment, type ForumKind, type ForumTarget } from "@/services/cubing-pro/algs/forum";
import { normalizeForumPath, saveForumLoginResume } from "./forumResume";
import { forumDate, ForumLoadState, ForumPagination, targetLabel, useForumErrorMessage, useForumQuery } from "./forumUi";

export interface OpenThread {
  kind: ForumKind;
  id: string;
  commentId?: number;
  notificationId?: number;
}

function formulaHref(target: ForumTarget) {
  const base = `/algs/${encodeURIComponent(target.cube)}/${encodeURIComponent(target.className)}/`;
  if (target.kind === "solution" && target.id) {
    return `${base}?${new URLSearchParams({ solutionId: target.id })}`;
  }
  return base;
}

export function ForumThread({ thread, currentCube, currentClassId, onChange, onClose }: {
  thread: OpenThread;
  currentCube?: string;
  currentClassId?: string;
  onChange: () => void;
  onClose: () => void;
}) {
  const { t, tf, locale } = useI18n();
  const { currentUser } = useAuth();
  const moderator = hasAnyAuth(currentUser?.Auth ?? 0, [Auth.AuthAdmin, Auth.AuthSuperAdmin]);
  const [page, setPage] = useState(1);
  const [focusId, setFocusId] = useState(thread.commentId);
  const [draft, setDraft] = useState("");
  const [reply, setReply] = useState<ForumComment | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const editor = useRef<HTMLTextAreaElement>(null);
  const focused = useRef<HTMLDivElement>(null);
  const markedRead = useRef(false);
  const message = useForumErrorMessage();
  const load = useCallback((signal: AbortSignal) => getForumComments(thread.kind, thread.id, page, focusId, signal), [thread.kind, thread.id, page, focusId]);
  const { data, error, refresh } = useForumQuery(load);
  const onTargetClass = currentCube !== undefined && currentClassId !== undefined &&
    currentCube === data?.target.cube && currentClassId === data.target.className;
  const viewHref = data && !data.target.unavailable && !onTargetClass ? formulaHref(data.target) : null;
  const length = Array.from(draft.trim()).length;
  const returnUrl = new URL(window.location.href);
  const tab = normalizeForumPath(returnUrl.pathname) === "/algs" ? "recent" : undefined;
  if (tab) returnUrl.searchParams.set("tab", tab);
  if (onTargetClass && thread.kind === "solution") returnUrl.searchParams.set("solutionId", thread.id);
  const loginHref = "/login?redirect=" + encodeURIComponent(returnUrl.pathname + returnUrl.search + returnUrl.hash);

  useEffect(() => {
    if (!data || thread.notificationId === undefined || markedRead.current) return;
    markedRead.current = true;
    void markReplyRead(thread.notificationId).then(onChange, error => {
      toaster.create({ type: "error", title: message(error) });
    });
  }, [data, thread.notificationId, onChange, message]);

  useEffect(() => {
    if (data && focusId) focused.current?.scrollIntoView({ block: "nearest" });
  }, [data, focusId]);

  async function post() {
    if (busy || !length || length > 400) return;
    setBusy(true);
    setNotice("");
    try {
      const result = await addForumComment(thread.kind, thread.id, draft.trim(), reply?.id);
      setDraft("");
      setReply(null);
      setFocusId(result.id);
      onChange();
    } catch (error) {
      setNotice(message(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove(commentId: number) {
    if (busy || !window.confirm(t("forum.deletePrompt"))) return;
    setBusy(true);
    setNotice("");
    try {
      await deleteForumComment(commentId);
      if (reply?.id === commentId) setReply(null);
      setPage(data?.page ?? 1);
      setFocusId(undefined);
      refresh();
      onChange();
    } catch (error) {
      setNotice(message(error));
    } finally {
      setBusy(false);
    }
  }

  return <>
      <Dialog.Header>
        <Stack gap="1" minW="0" pr="8">
          <HStack gap="2" flexWrap="wrap">
            <Dialog.Title>{t(thread.kind === "group" ? "forum.group" : "forum.discuss")}</Dialog.Title>
            {viewHref && <Button asChild size="xs" variant="outline"><Link href={viewHref} onClick={onClose}>{t("forum.viewFormula")}</Link></Button>}
          </HStack>
          {data && <>
            <Text fontSize="sm" color="fg.muted" overflowWrap="anywhere">{targetLabel(data.target)}</Text>
            {data.target.moves && <Text fontFamily="mono" overflowWrap="anywhere">{data.target.moves}</Text>}
          </>}
        </Stack>
        <Dialog.CloseTrigger asChild><CloseButton aria-label={t("algs.modal.close")} size="sm" /></Dialog.CloseTrigger>
      </Dialog.Header>
      <Dialog.Body>
        {!data ? <ForumLoadState error={error} retry={refresh} /> : <Stack gap="3">
          <Text fontWeight="semibold" fontSize="sm">{t("forum.comments")} · {data.count}</Text>
          {data.items.length === 0 && <Text color="fg.muted">{t("forum.empty")}</Text>}
          {data.items.map(comment => <Box key={comment.id} id={`formula-comment-${comment.id}`}
            ref={comment.id === focusId ? focused : undefined}
            borderWidth="1px" borderColor={comment.id === focusId ? "brand.500" : "border"}
            borderRadius="md" p="3" ms={comment.parentId ? "3" : "0"}>
            {comment.deleted ? <Text color="fg.muted" fontSize="sm">{t("forum.deleted")}</Text> : <>
              <HStack gap="2" flexWrap="wrap">
                <Text fontWeight="semibold" fontSize="sm">{comment.authorName}</Text>
                {comment.replyToName && <Badge>{tf("forum.replyTo", { name: comment.replyToName })}</Badge>}
                <Text as="time" fontSize="xs" color="fg.muted" ms="auto">{forumDate(comment.createdAt, locale)}</Text>
              </HStack>
              <Text whiteSpace="pre-wrap" overflowWrap="anywhere" py="1">{comment.body}</Text>
              <HStack>
                {currentUser?.id ? <Button size="xs" variant="ghost" disabled={busy} onClick={() => {
                  setReply(comment);
                  editor.current?.focus();
                }}>{t("forum.reply")}</Button> : null}
                {moderator && <Button size="xs" variant="ghost" colorPalette="red" disabled={busy} onClick={() => void remove(comment.id)}>{t("draws.delete")}</Button>}
              </HStack>
            </>}
          </Box>)}
          <ForumPagination page={data.page} total={data.total} onPage={next => { setFocusId(undefined); setPage(next); }} />
        </Stack>}
      </Dialog.Body>
      <Dialog.Footer display="block" borderTopWidth="1px">
        {notice && <Text role="alert" color="fg.error" mb="2">{notice}</Text>}
        {data && (currentUser?.id ? <Stack gap="2">
          {reply && <HStack><Text fontSize="sm">{tf("forum.replyTo", { name: reply.authorName })}</Text>
            <Button size="xs" variant="ghost" disabled={busy} onClick={() => setReply(null)}>{t("siteContent.cancel")}</Button></HStack>}
          <Textarea ref={editor} rows={2} value={draft} disabled={busy} aria-label={t("forum.write")} placeholder={t("forum.write")}
            onChange={event => { setDraft(event.target.value); setNotice(""); }} />
          <HStack justify="space-between"><Text fontSize="xs" color={length > 400 ? "fg.error" : "fg.muted"}>{length} / 400</Text>
            <Button size="sm" colorPalette="brand" disabled={busy || !length || length > 400} onClick={() => void post()}>{t("forum.post")}</Button></HStack>
        </Stack> : <Button asChild size="sm" variant="outline"><Link href={loginHref} onClick={() => {
          saveForumLoginResume({ pathname: returnUrl.pathname, thread, tab });
        }}>{t("forum.login")}</Link></Button>)}
      </Dialog.Footer>
  </>;
}
