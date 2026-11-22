"use client";

import { Button, HStack, Text } from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useReducer, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { getIntlLocale, type Locale } from "@/i18n";
import { FORUM_PAGE_SIZE, type ForumTarget } from "@/services/cubing-pro/algs/forum";
import { getApiErrorDisplayMessage } from "@/services/cubing-pro/request";

export function useForumQuery<T>(load: (signal: AbortSignal) => Promise<T>, revision = 0) {
  const [reload, refresh] = useReducer((value: number) => value + 1, 0);
  const version = reload + revision;
  const [result, setResult] = useState<{ load: typeof load; version: number; data?: T; error?: unknown } | null>(null);
  useEffect(() => {
    const request = new AbortController();
    load(request.signal).then(
      (data) => { if (!request.signal.aborted) setResult({ load, version, data }); },
      (error) => { if (!request.signal.aborted) setResult({ load, version, error }); },
    );
    return () => request.abort();
  }, [load, version]);

  const current = result?.load === load && result.version === version ? result : null;
  return { data: current?.data, error: current?.error, refresh };
}

export function useForumErrorMessage() {
  const { t } = useI18n();
  return (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const body = error.response?.data;
      if (body?.code === "keyword_blocked") return t("forum.blocked");
      return getApiErrorDisplayMessage(body) ?? t("forum.error");
    }
    return t("forum.error");
  };
}

export function ForumLoadState({ error, retry }: { error: unknown; retry: () => void }) {
  const { t } = useI18n();
  const message = useForumErrorMessage();
  return error ? (
    <HStack role="alert" flexWrap="wrap">
      <Text color="fg.error">{message(error)}</Text>
      <Button size="xs" variant="outline" onClick={retry}>{t("advertisements.retry")}</Button>
    </HStack>
  ) : <Text role="status" color="fg.muted">{t("algs.loading")}</Text>;
}

export function ForumPagination({ page, total, onPage }: { page: number; total: number; onPage: (page: number) => void }) {
  const { t } = useI18n();
  const pages = Math.ceil(total / FORUM_PAGE_SIZE);
  if (pages <= 1) return null;
  return <HStack justify="center" gap="3" py="2">
    <Button variant="outline" size="xs" disabled={page <= 1} onClick={() => onPage(page - 1)}>{t("algs.modal.prev")}</Button>
    <Text fontSize="sm">{page} / {pages}</Text>
    <Button variant="outline" size="xs" disabled={page >= pages} onClick={() => onPage(page + 1)}>{t("algs.modal.next")}</Button>
  </HStack>;
}

export function targetLabel(target: ForumTarget) {
  return [target.cube, target.className, target.setName, target.groupName, target.caseName].filter(Boolean).join(" · ");
}

export function forumDate(date: string, locale: Locale) {
  return new Date(date).toLocaleString(getIntlLocale(locale), { dateStyle: "short", timeStyle: "short" });
}
