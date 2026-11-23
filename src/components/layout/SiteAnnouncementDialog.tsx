"use client";

import { Box, Button, Dialog, IconButton, Portal, Stack, Text } from "@chakra-ui/react";
import { LuBell, LuChevronRight, LuX } from "react-icons/lu";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getIntlLocale } from "@/i18n";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteAnnouncements, type SiteAnnouncement } from "@/services/cubing-pro/siteAnnouncement";
import { readClosedRevisions, rememberClosedRevisions, unseenAnnouncements } from "./announcementDismissal";

function isPublicPath(path: string): boolean {
  return !/^\/(admin|auth|login|old-login)(\/|$)/.test(path);
}

export function SiteAnnouncementDialog() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const [announcements, setAnnouncements] = useState<SiteAnnouncement[]>([]);
  const [selected, setSelected] = useState<SiteAnnouncement | null>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const selectedRow = useRef<HTMLButtonElement>(null);
  const lastSelectedId = useRef<string | null>(null);
  useEffect(() => {
    if (selected) detailHeading.current?.focus();
    else if (lastSelectedId.current) selectedRow.current?.focus();
  }, [selected]);
  const dateFormat = new Intl.DateTimeFormat(getIntlLocale(locale), { dateStyle: "medium", timeStyle: "short" });
  const check = useRef<{ path: string; finished: boolean; result: Promise<SiteAnnouncement[]> } | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Static-export fallback can initially have a different Next route than the browser address.
    const browserPath = window.location.pathname;
    if (check.current && browserPath !== check.current.path) check.current.finished = true;
    if (check.current?.finished || !isPublicPath(browserPath)) return;

    const current = check.current ??= { path: browserPath, finished: false, result: getSiteAnnouncements().catch(() => []) };
    let cancelled = false;
    void current.result.then((items) => {
      if (cancelled || current.finished) return;
      current.finished = true;
      if (!items.length || window.location.pathname !== browserPath) return;
      let revisions = new Map<string, string>();
      try {
        revisions = readClosedRevisions(window.localStorage);
      } catch { /* The dialog still works when storage is unavailable. */ }
      setAnnouncements(unseenAnnouncements(items, revisions));
    });
    return () => { cancelled = true; };
  }, [pathname]);

  function close() {
    try {
      rememberClosedRevisions(window.localStorage, announcements);
    } catch { /* Close the current dialog even if storage is unavailable. */ }
    setSelected(null);
    setAnnouncements([]);
  }

  if (!announcements.length || !pathname || !isPublicPath(pathname)) return null;

  return (
    <Dialog.Root open placement="center" size="md" scrollBehavior="inside"
      closeOnInteractOutside={false} closeOnEscape={false} initialFocusEl={() => closeButton.current}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner padding="4">
          <Dialog.Content maxH="calc(100dvh - 2rem)" overflow="hidden">
            <Dialog.Header flexShrink="0" borderBottomWidth="1px" alignItems="center" justifyContent="space-between">
              <Dialog.Title display="flex" alignItems="center" gap="2"><LuBell aria-hidden="true" />{t("siteAnnouncement.title")}</Dialog.Title>
              <IconButton aria-label={t("siteAnnouncement.close")} variant="ghost" size="sm" onClick={close}><LuX /></IconButton>
            </Dialog.Header>
            <Dialog.Body minH="0" py="4">
              {selected ? (
                <Stack gap="3">
                  <Text as="h2" ref={detailHeading} tabIndex={-1} fontSize="lg" fontWeight="semibold" overflowWrap="anywhere">{selected.title}</Text>
                  <Text asChild fontSize="sm" color="fg.muted"><time dateTime={selected.publishedAt}>{dateFormat.format(new Date(selected.publishedAt))}</time></Text>
                  <Text borderLeftWidth="2px" borderColor="brand.solid" pl="4" mt="2" whiteSpace="pre-wrap" overflowWrap="anywhere">{selected.text}</Text>
                </Stack>
              ) : (
                <Stack as="ul" listStyleType="none" m="0" p="0" gap="0">
                  {announcements.map((item) => (
                    <Box as="li" key={item.id} borderBottomWidth="1px" _last={{ borderBottomWidth: "0" }}>
                      <Button ref={item.id === lastSelectedId.current ? selectedRow : undefined} variant="ghost" width="full" height="auto" py="4" px="2" whiteSpace="normal" justifyContent="space-between" textAlign="start"
                        onClick={() => { lastSelectedId.current = item.id; setSelected(item); }}>
                        <Stack as="span" gap="1" minW="0">
                          <Text as="span" fontWeight="semibold" overflowWrap="anywhere">{item.title}</Text>
                          <Text asChild fontSize="sm" fontWeight="normal" color="fg.muted"><time dateTime={item.publishedAt}>{dateFormat.format(new Date(item.publishedAt))}</time></Text>
                        </Stack>
                        <LuChevronRight aria-hidden="true" style={{ flexShrink: 0 }} />
                      </Button>
                    </Box>
                  ))}
                </Stack>
              )}
            </Dialog.Body>
            <Dialog.Footer flexShrink="0" borderTopWidth="1px" flexWrap="wrap">
              {selected && <Button variant="ghost" onClick={() => setSelected(null)}>{t("siteAnnouncement.back")}</Button>}
              <Button ref={closeButton} onClick={close}>{t("siteAnnouncement.close")}</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
