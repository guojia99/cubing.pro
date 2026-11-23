"use client";

import { Box, Button, Dialog, Portal, Stack, Text } from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import { getSiteAnnouncements, type SiteAnnouncement } from "@/services/cubing-pro/siteAnnouncement";
import { readClosedRevisions, rememberClosedRevisions, unseenAnnouncements } from "./announcementDismissal";

function isPublicPath(path: string): boolean {
  return !/^\/(admin|auth|login|old-login)(\/|$)/.test(path);
}

export function SiteAnnouncementDialog() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [announcements, setAnnouncements] = useState<SiteAnnouncement[]>([]);
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
    setAnnouncements([]);
  }

  if (!announcements.length || !pathname || !isPublicPath(pathname)) return null;

  return (
    <Dialog.Root open placement="center" size="sm" scrollBehavior="inside"
      closeOnInteractOutside={false} closeOnEscape={false} initialFocusEl={() => closeButton.current}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header><Dialog.Title>{t("siteAnnouncement.title")}</Dialog.Title></Dialog.Header>
            <Dialog.Body>
              <Stack as="ul" listStyleType="none" m="0" p="0" gap="4">
                {announcements.map((item, index) => (
                  <Box as="li" key={item.id} pt={index > 0 ? "4" : undefined} borderTopWidth={index > 0 ? "1px" : undefined}>
                    <Text whiteSpace="pre-wrap" overflowWrap="anywhere">{item.text}</Text>
                    {item.href && (
                      <Button asChild variant="outline" size="sm" mt="2">
                        <a href={item.href} target="_blank" rel="noopener noreferrer">{t("siteAnnouncement.details")}</a>
                      </Button>
                    )}
                  </Box>
                ))}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button ref={closeButton} onClick={close}>{t("siteAnnouncement.close")}</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
