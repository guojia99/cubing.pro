"use client";

import { Box, Button, CloseButton, Dialog, HStack, Stack, Text, Textarea } from "@chakra-ui/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LuMessageCircle } from "react-icons/lu";
import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import { Auth, hasAnyAuth } from "@/lib/auth";
import { addForumComment, deleteForumComment, getForumComments, type ForumComment, type ForumKind, type ForumTarget } from "@/services/cubing-pro/algs/forum";
import { normalizeForumPath, saveForumLoginResume } from "./forumResume";
import { forumDate, ForumLoadState, ForumPagination, targetLabel, useForumErrorMessage, useForumQuery } from "./forumUi";

export interface OpenThread {
  kind: ForumKind;
  id: string;
  commentId?: number;
  onLoaded?: () => void;
}

function formulaHref(target: ForumTarget) {
  const base = `/algs/${encodeURIComponent(target.cube)}/${encodeURIComponent(target.className)}/`;
  if (target.kind === "set") return `${base}#set-${target.id}`;
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
  const onLoaded = thread.onLoaded;
  const moderator = hasAnyAuth(currentUser?.Auth ?? 0, [Auth.AuthAdmin, Auth.AuthSuperAdmin]);
  const [page, setPage] = useState(1);
  const [focusId, setFocusId] = useState(thread.commentId);
  const [draft, setDraft] = useState("");
  const [reply, setReply] = useState<ForumComment | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const editor = useRef<HTMLTextAreaElement>(null);
  const focused = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
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
    if (!data || loaded.current) return;
    loaded.current = true;
    onLoaded?.();
  }, [data, onLoaded]);

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
      <Dialog.Header flexShrink={0} bg="bg.subtle" borderBottomWidth="1px" borderColor="border.subtle" px={{ base: "4", md: "6" }} pt="4" pb="3">
        <Stack gap="2" minW="0" pr="8">
          <HStack gap="2" flexWrap="wrap">
            <Dialog.Title fontSize="lg" fontWeight="semibold" letterSpacing="tight">{thread.kind === "set" && data ? tf("forum.setScope", { setName: data.target.setName }) : t(thread.kind === "group" ? "forum.group" : "forum.discuss")}</Dialog.Title>
            {viewHref && <Button asChild size="xs" variant="ghost" color="fg.muted"><Link href={viewHref} onClick={onClose}>{t("forum.viewFormula")}</Link></Button>}
          </HStack>
          {data && <>
            <Text fontSize="sm" color="fg.muted" overflowWrap="anywhere">{targetLabel(data.target, true)}</Text>
            {data.target.moves && <Text fontFamily="mono" fontSize="sm" lineHeight="tall" color="fg" bg="bg.elevated"
              borderWidth="1px" borderColor="border.subtle" borderRadius="lg" px="3" py="1.5" alignSelf="start" maxW="full"
              overflowWrap="anywhere">{data.target.moves}</Text>}
          </>}
        </Stack>
        <Dialog.CloseTrigger asChild><CloseButton aria-label={t("algs.modal.close")} size="sm" color="fg.muted" borderRadius="full" /></Dialog.CloseTrigger>
      </Dialog.Header>
      <Dialog.Body data-testid="forum-comments" flex="0 1 auto" minH="0" overflowY="auto" overscrollBehavior="contain" px={{ base: "4", md: "6" }} pt="3" pb="3">
        {!data ? <ForumLoadState error={error} retry={refresh} /> : <Stack gap="0">
          <Text fontWeight="medium" fontSize="xs" color="fg.muted" pb="2">{t("forum.comments")} · {data.count}</Text>
          {data.items.length === 0 && <HStack gap="3" py="3">
            <Box aria-hidden="true" display="grid" placeItems="center" flexShrink={0} boxSize="9" borderRadius="full" bg="bg.subtle" color="fg.muted">
              <LuMessageCircle size={18} strokeWidth={1.5} />
            </Box>
            <Text color="fg.muted" fontSize="sm">{t("forum.empty")}</Text>
          </HStack>}
          {data.items.map(comment => <Box key={comment.id} id={`formula-comment-${comment.id}`}
            ref={comment.id === focusId ? focused : undefined}
            borderTopWidth="1px" borderColor={comment.id === focusId ? "brand.border" : "border.subtle"}
            py="3" ms={comment.parentId ? "3" : "0"} minW="0">
            {comment.deleted ? <Text color="fg.muted" fontSize="sm">{t("forum.deleted")}</Text> : <>
              <HStack gap="2" flexWrap="wrap">
                <Text fontWeight="semibold" fontSize="sm" overflowWrap="anywhere" minW="0">{comment.authorName}</Text>
                {comment.replyToName && <Text fontSize="xs" color="fg.muted" overflowWrap="anywhere" minW="0">{tf("forum.replyTo", { name: comment.replyToName })}</Text>}
                <Text as="time" fontSize="xs" color="fg.muted" ms="auto" flexShrink={0}>{forumDate(comment.createdAt, locale)}</Text>
              </HStack>
              <Text whiteSpace="pre-wrap" overflowWrap="anywhere" fontSize="sm" lineHeight="tall" color="fg" pt="2" pb="1">{comment.body}</Text>
              <HStack gap="1">
                {currentUser?.id ? <Button size="xs" variant="ghost" color="fg.muted" disabled={busy} onClick={() => {
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
      <Dialog.Footer data-testid="forum-composer" display="block" flexShrink={0} bg="bg.subtle" borderTopWidth="1px" borderColor="border.subtle" px={{ base: "4", md: "6" }} py="3">
        {notice && <Text role="alert" color="fg.error" mb="2">{notice}</Text>}
        {data && (currentUser?.id ? <Stack gap="2">
          {reply && <HStack><Text fontSize="sm" color="fg.muted" overflowWrap="anywhere" minW="0">{tf("forum.replyTo", { name: reply.authorName })}</Text>
            <Button size="xs" variant="ghost" flexShrink={0} disabled={busy} onClick={() => setReply(null)}>{t("siteContent.cancel")}</Button></HStack>}
          <Textarea ref={editor} rows={2} minH="14" resize="none" value={draft} disabled={busy} aria-label={t("forum.write")} placeholder={t("forum.write")}
            bg="bg.elevated" borderColor="border.subtle" borderRadius="lg" fontSize="sm" lineHeight="tall" _placeholder={{ color: "fg.muted" }}
            onChange={event => { setDraft(event.target.value); setNotice(""); }} />
          <HStack justify="space-between"><Text fontSize="xs" color={length > 400 ? "fg.error" : "fg.muted"}>{length} / 400</Text>
            <Button size="sm" colorPalette="brand" borderRadius="lg" px="5" disabled={busy || !length || length > 400} onClick={() => void post()}>{t("forum.post")}</Button></HStack>
        </Stack> : <Button asChild size="sm" variant="outline" bg="bg.elevated" borderColor="border.subtle"><Link href={loginHref} onClick={() => {
          saveForumLoginResume({ pathname: returnUrl.pathname, thread, tab });
        }}>{t("forum.login")}</Link></Button>)}
      </Dialog.Footer>
  </>;
}
