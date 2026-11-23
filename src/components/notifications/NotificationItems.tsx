"use client";

import { Badge, Box, Button, CloseButton, Dialog, HStack, Portal, Stack, Text } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";

import { toaster } from "@/components/ui/toaster";
import { useI18n } from "@/contexts/I18nProvider";
import { useNotifications } from "@/contexts/NotificationsProvider";
import type { NotificationItem } from "@/services/cubing-pro/notifications";
import { useFormulaForum } from "@/views/Algs/forum/ForumScope";
import { forumDate, targetLabel } from "@/views/Algs/forum/forumUi";

export function NotificationItems({ items, compact = false, onOpen }: {
  items: NotificationItem[];
  compact?: boolean;
  onOpen?: () => void;
}) {
  const { t, locale } = useI18n();
  const { markRead } = useNotifications();
  const { open } = useFormulaForum();
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const [busy, setBusy] = useState<string[]>([]);

  const read = useCallback(async (id: string) => {
    setBusy(previous => [...previous, id]);
    try {
      await markRead(id);
    } catch {
      toaster.create({ type: "error", title: t("notification.error") });
    } finally {
      setBusy(previous => previous.filter(item => item !== id));
    }
  }, [markRead, t]);

  useEffect(() => {
    if (selected && !selected.readAt) void read(selected.id);
  }, [selected, read]);

  function show(item: NotificationItem) {
    onOpen?.();
    // Let the notification panel close before placing focus in the detail dialog.
    requestAnimationFrame(() => {
      if (item.type === "site-announcement") {
        setSelected(item);
      } else if (item.target && !item.target.unavailable) {
        open({
          kind: item.target.kind, id: item.target.id, commentId: item.commentId,
          onLoaded: item.readAt ? undefined : () => { void read(item.id); },
        });
      }
    });
  }

  return <>
    <Stack gap={compact ? "0" : "3"} data-testid="notification-list">
      {items.length === 0 && <Text color="fg.muted" fontSize="sm" py="3">{t("notification.empty")}</Text>}
      {items.map(item => {
        const unavailable = item.type === "formula-reply" && (!item.target || item.target.unavailable);
        return <Stack as="article" key={item.id} data-testid="notification-item" data-notification-id={item.id}
          gap="1" minW="0" p={compact ? "3" : { base: "3", md: "4" }} borderWidth={compact ? "0" : "1px"}
          borderBottomWidth="1px" borderRadius={compact ? undefined : "lg"}>
          <HStack gap="2" flexWrap="wrap" fontSize="xs" color="fg.muted">
            <Text>{t(item.type === "formula-reply" ? "notification.replies" : "notification.announcements")}</Text>
            {!item.readAt && <Badge colorPalette="brand" size="sm">{t("notification.unread")}</Badge>}
            {unavailable && <Badge size="sm">{t("forum.targetUnavailable")}</Badge>}
            <Text asChild ms="auto"><time dateTime={item.createdAt}>{forumDate(item.createdAt, locale)}</time></Text>
          </HStack>
          <Box asChild textAlign="start" minW="0" width="full" borderRadius="md"
            _hover={unavailable ? undefined : { bg: "accent.soft" }}
            _focusVisible={{ outline: "2px solid", outlineColor: "brand.focusRing", outlineOffset: "2px" }}>
            <button type="button" onClick={() => show(item)} disabled={unavailable}>
              <Stack gap="1" minW="0" py="1">
                <Text fontWeight="semibold" fontSize="sm" overflowWrap="anywhere" lineClamp={compact ? 2 : undefined}>
                  {item.title || (item.target ? targetLabel(item.target, true) || item.target.id : t("notification.replyTitle"))}
                </Text>
                {item.authorName && <Text fontSize="xs" color="fg.muted" overflowWrap="anywhere">{item.authorName}</Text>}
                <Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere" lineClamp={compact ? 2 : 3}>{item.body}</Text>
              </Stack>
            </button>
          </Box>
          {!item.readAt && <Button alignSelf="start" variant="ghost" size="xs" color="fg.muted"
            disabled={busy.includes(item.id)} onClick={() => { void read(item.id); }}>{t("notification.markRead")}</Button>}
        </Stack>;
      })}
    </Stack>
    <Dialog.Root open={selected !== null} onOpenChange={({ open }) => { if (!open) setSelected(null); }}
      placement="center" size="md" scrollBehavior="inside" lazyMount unmountOnExit>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner padding="4">
          <Dialog.Content maxH="calc(100dvh - 2rem)">
            <Dialog.Header borderBottomWidth="1px" pr="12">
              <Dialog.Title overflowWrap="anywhere">{selected?.title || t("notification.announcementTitle")}</Dialog.Title>
              <Dialog.CloseTrigger asChild><CloseButton size="sm" aria-label={t("siteAnnouncement.close")} /></Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body py="4">
              {selected && <Stack gap="3">
                <Text asChild fontSize="xs" color="fg.muted"><time dateTime={selected.createdAt}>{forumDate(selected.createdAt, locale)}</time></Text>
                <Text whiteSpace="pre-wrap" overflowWrap="anywhere">{selected.body}</Text>
              </Stack>}
            </Dialog.Body>
            <Dialog.Footer borderTopWidth="1px">
              <Dialog.CloseTrigger asChild position="static"><Button>{t("siteAnnouncement.close")}</Button></Dialog.CloseTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  </>;
}
