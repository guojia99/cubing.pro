"use client";

import { Button, Stack, Tabs, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useReducer, useState } from "react";

import { NotificationItems } from "@/components/notifications/NotificationItems";
import { PageHeader } from "@/components/ui/page";
import { useI18n } from "@/contexts/I18nProvider";
import { useNotifications } from "@/contexts/NotificationsProvider";
import type { NotificationFilter, NotificationPage } from "@/services/cubing-pro/notifications";
import { ForumScope } from "@/views/Algs/forum/ForumScope";
import { ForumLoadState, ForumPagination } from "@/views/Algs/forum/forumUi";

function NotificationList({ type }: { type: NotificationFilter }) {
  const { loggedIn, loadPage, version } = useNotifications();
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [revision, refresh] = useReducer((value: number) => value + 1, 0);
  const [result, setResult] = useState<{ page: number; data?: NotificationPage; error?: unknown } | null>(null);
  useEffect(() => {
    const request = new AbortController();
    void loadPage(page, type, request.signal).then(
      data => { if (!request.signal.aborted) setResult({ page, data }); },
      error => {
        if (!request.signal.aborted) setResult(previous => ({ page, error, data: previous?.page === page ? previous.data : undefined }));
      },
    );
    return () => request.abort();
  }, [loadPage, page, type, version, revision]);
  const data = result?.page === page ? result.data : undefined;
  const error = result?.page === page ? result.error : undefined;

  if (!loggedIn && type === "formula-reply") return <Button asChild alignSelf="start">
    <Link href="/login?redirect=%2Fuser%2Fnotifications%3Ftype%3Dformula-reply">{t("user.login")}</Link>
  </Button>;
  if (!data) return <ForumLoadState error={error} retry={refresh} />;
  return <Stack gap="3">
    {error ? <ForumLoadState error={error} retry={refresh} /> : null}
    <NotificationItems items={data.items} />
    <ForumPagination page={data.page} total={data.total} onPage={setPage} />
  </Stack>;
}

export function NotificationsPage() {
  const { t } = useI18n();
  const { identity, ready, loggedIn } = useNotifications();
  const search = useSearchParams();
  const router = useRouter();
  const requested = search?.get("type");
  const type: NotificationFilter = requested === "formula-reply" || requested === "site-announcement" ? requested : "all";

  return <Stack gap="5">
    <PageHeader title={t("notification.title")} />
    {!loggedIn && ready && <Text color="fg.muted" fontSize="sm">{t("notification.guestHint")}</Text>}
    <Tabs.Root value={type} onValueChange={({ value }) => router.replace(value === "all" ? "/user/notifications" : `/user/notifications?type=${value}`, { scroll: false })}>
      <Tabs.List overflowX="auto">
        <Tabs.Trigger value="all">{t("notification.all")}</Tabs.Trigger>
        <Tabs.Trigger value="formula-reply">{t("notification.replies")}</Tabs.Trigger>
        <Tabs.Trigger value="site-announcement">{t("notification.announcements")}</Tabs.Trigger>
      </Tabs.List>
      <Stack pt="4">
        {!ready ? <Text role="status" color="fg.muted">{t("algs.loading")}</Text>
          : <ForumScope key={`${identity}/${type}`}><NotificationList type={type} /></ForumScope>}
      </Stack>
    </Tabs.Root>
  </Stack>;
}
