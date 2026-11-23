"use client";

import { Badge, Box, Button, HStack, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";
import { LuChevronRight } from "react-icons/lu";
import { PageHeader } from "@/components/ui/page";
import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import { getMyComments, getMyDiscussions } from "@/services/cubing-pro/algs/forum";
import { ForumScope, useFormulaForum } from "./ForumScope";
import { forumDate, ForumLoadState, ForumPagination, targetLabel, useForumQuery } from "./forumUi";

function MyDiscussionsList() {
  const { t, locale } = useI18n();
  const { open, version } = useFormulaForum();
  const [page, setPage] = useState(1);
  const load = useCallback((signal: AbortSignal) => getMyDiscussions(page, signal), [page]);
  const { data, error, refresh } = useForumQuery(load, version);

  if (!data) return <ForumLoadState error={error} retry={refresh} />;
  return <Stack>
    {data.items.length === 0 && <Text color="fg.muted">{t("forum.noMyDiscussions")}</Text>}
    {data.items.map(item => {
      const content = <HStack gap="3">
        <Stack gap="1" minW="0" flex="1">
          <HStack gap="2" flexWrap="wrap">
            <Text fontSize="md" fontWeight="semibold" overflowWrap="anywhere">{targetLabel(item.target) || item.target.id}</Text>
            {item.target.unavailable && <Badge>{t("forum.targetUnavailable")}</Badge>}
          </HStack>
          {item.target.moves && <Text fontFamily="mono" overflowWrap="anywhere">{item.target.moves}</Text>}
          <Text fontSize="xs" color="fg.muted">{t("forum.comments")} · {item.count} · {forumDate(item.lastActivity, locale)}</Text>
        </Stack>
        {!item.target.unavailable && <Box asChild color="accent" flexShrink="0"><LuChevronRight aria-hidden="true" size={20} /></Box>}
      </HStack>;
      return <Box asChild key={`${item.target.kind}/${item.target.id}`} data-testid="my-discussion"
        textAlign="start" width="full" minH="14" p="4" borderWidth="1px" borderRadius="md"
        cursor={item.target.unavailable ? undefined : "pointer"}
        _hover={item.target.unavailable ? undefined : { bg: "accent.soft", borderColor: "brand.border" }}
        _focusVisible={{ outline: "2px solid", outlineColor: "brand.focusRing", outlineOffset: "2px", bg: "accent.soft" }}>
        {item.target.unavailable ? <article>{content}</article>
          : <button type="button" onClick={() => open({ ...item.target, commentId: item.lastCommentId })}>{content}</button>}
      </Box>;
    })}
    <ForumPagination page={data.page} total={data.total} onPage={setPage} />
  </Stack>;
}

function MyCommentsList() {
  const { t, tf, locale } = useI18n();
  const { open, version } = useFormulaForum();
  const [page, setPage] = useState(1);
  const load = useCallback((signal: AbortSignal) => getMyComments(page, signal), [page]);
  const { data, error, refresh } = useForumQuery(load, version);

  if (!data) return <ForumLoadState error={error} retry={refresh} />;
  return <Stack>
    {data.items.length === 0 && <Text color="fg.muted">{t("forum.noMyComments")}</Text>}
    {data.items.map(item => <Stack as="article" data-testid="my-comment" key={item.id}
      gap="2" p={{ base: "3", md: "4" }} borderWidth="1px" borderRadius="lg" minW="0">
      <HStack gap="2" flexWrap="wrap">
        <Text fontSize="sm" fontWeight="semibold" overflowWrap="anywhere">{targetLabel(item.target, true) || item.target.id}</Text>
        {item.target.unavailable && <Badge>{t("forum.targetUnavailable")}</Badge>}
      </HStack>
      {item.target.moves && <Text fontSize="sm" fontFamily="mono" overflowWrap="anywhere">{item.target.moves}</Text>}
      <HStack gap="2" flexWrap="wrap" fontSize="xs" color="fg.muted">
        {item.replyToName && <Text overflowWrap="anywhere">{tf("forum.replyTo", { name: item.replyToName })}</Text>}
        <Text asChild><time dateTime={item.createdAt}>{forumDate(item.createdAt, locale)}</time></Text>
      </HStack>
      <Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere">{item.body}</Text>
      <Button alignSelf="start" size="xs" variant="outline" colorPalette="brand" disabled={item.target.unavailable}
        onClick={() => open({ ...item.target, commentId: item.id })}>{t("forum.viewContext")}</Button>
    </Stack>)}
    <ForumPagination page={data.page} total={data.total} onPage={setPage} />
  </Stack>;
}

function PersonalForumPage({ title, pathname, children }: {
  title: string;
  pathname: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const { currentUser, loading } = useAuth();
  return <Stack gap="5"><PageHeader title={title} />
    {currentUser?.id ? <ForumScope key={currentUser.id}>{children}</ForumScope>
      : loading ? <Text>{t("algs.loading")}</Text>
      : <Button asChild alignSelf="start"><Link href={"/login?redirect=" + encodeURIComponent(pathname)}>{t("user.login")}</Link></Button>}
  </Stack>;
}

export function FormulaDiscussionsPage() {
  const { t } = useI18n();
  return <PersonalForumPage title={t("forum.myDiscussions")} pathname="/user/formula-discussions"><MyDiscussionsList /></PersonalForumPage>;
}

export function MyCommentsPage() {
  const { t } = useI18n();
  return <PersonalForumPage title={t("forum.myComments")} pathname="/user/comments"><MyCommentsList /></PersonalForumPage>;
}
