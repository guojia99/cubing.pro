"use client";

import { Badge, Box, Button, HStack, IconButton, Popover, Portal, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useState } from "react";
import { LuBell } from "react-icons/lu";

import { NotificationItems } from "@/components/notifications/NotificationItems";
import { NAV_FONT_SIZE } from "@/components/layout/navStyles";
import { useI18n } from "@/contexts/I18nProvider";
import { useNotifications } from "@/contexts/NotificationsProvider";
import { ForumScope } from "@/views/Algs/forum/ForumScope";

function BellContent() {
  const { t } = useI18n();
  const { ready, loggedIn, preview, error, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const unread = preview?.unread ?? 0;

  return <Popover.Root id="app-header-notifications" open={open} onOpenChange={({ open }) => {
    setOpen(open);
    if (open) refresh();
  }} positioning={{ placement: "bottom-end", gutter: 12 }} lazyMount>
    <Popover.Trigger asChild>
      <IconButton aria-label={t("notification.title") + (unread ? ` (${unread} ${t("notification.unread")})` : "")}
        variant="ghost" size="sm" minW="9" borderRadius="lg" position="relative" disabled={!ready}>
        <LuBell size={19} aria-hidden="true" />
        {unread > 0 && <Badge aria-hidden="true" colorPalette="red" position="absolute" top="0" right="0"
          borderRadius="full" fontSize="9px" minW="4" h="4" px="1" justifyContent="center">{unread > 99 ? "99+" : unread}</Badge>}
      </IconButton>
    </Popover.Trigger>
    <Portal>
      <Popover.Positioner>
        <Popover.Content width="24rem" maxW="calc(100vw - 2rem)" maxH="min(36rem, calc(100dvh - 6rem))"
          overflow="hidden" bg="bg.elevated" color="fg" borderWidth="1px" borderColor="border"
          borderRadius="var(--radius-card, 1rem)" boxShadow="var(--shadow-float, 0 12px 40px rgb(12 58 77 / 10%))"
          fontSize={NAV_FONT_SIZE} fontFamily="var(--font-body, inherit)">
          <Popover.Header borderBottomWidth="1px" px="4" py="3"><Popover.Title fontWeight="semibold">{t("notification.title")}</Popover.Title></Popover.Header>
          <Popover.Body p="0" overflowY="auto" overscrollBehavior="contain" minH="0">
            {error ? <HStack role="alert" p="3" flexWrap="wrap"><Text color="fg.error" fontSize="sm">{t("notification.error")}</Text>
              <Button size="xs" variant="outline" onClick={refresh}>{t("advertisements.retry")}</Button></HStack>
              : !preview ? <Text role="status" p="4" color="fg.muted">{t("algs.loading")}</Text> : null}
            {preview && <NotificationItems items={preview.items} compact onOpen={() => setOpen(false)} />}
          </Popover.Body>
          <Popover.Footer borderTopWidth="1px" p="2"><Button asChild variant="ghost" size="sm" width="full"><Link href={loggedIn ? "/user/notifications" : "/user/notifications?type=site-announcement"} onClick={() => setOpen(false)}>{t("notification.viewAll")}</Link></Button></Popover.Footer>
        </Popover.Content>
      </Popover.Positioner>
    </Portal>
  </Popover.Root>;
}

export function NotificationBell() {
  const { identity } = useNotifications();
  return <Box display="inline-flex"><ForumScope key={identity}><BellContent /></ForumScope></Box>;
}
