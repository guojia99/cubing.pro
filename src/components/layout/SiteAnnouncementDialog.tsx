"use client";

import { Button, Dialog, Portal, Text } from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import { getSiteAnnouncement, type SiteAnnouncement } from "@/services/cubing-pro/siteAnnouncement";

const CLOSED_REVISION_KEY = "cubing-pro:site-announcement:closed-revision";

function isPublicPath(path: string): boolean {
  return !/^\/(admin|auth|login|old-login)(\/|$)/.test(path);
}

export function SiteAnnouncementDialog() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState<SiteAnnouncement | null>(null);
  const check = useRef<{ path: string; finished: boolean; result: Promise<SiteAnnouncement | null> } | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Static-export fallback can initially have a different Next route than the browser address.
    const browserPath = window.location.pathname;
    if (check.current && browserPath !== check.current.path) check.current.finished = true;
    if (check.current?.finished || !isPublicPath(browserPath)) return;

    const current = check.current ??= { path: browserPath, finished: false, result: getSiteAnnouncement().catch(() => null) };

    let cancelled = false;
    void current.result.then((item) => {
      if (cancelled || current.finished) return;
      current.finished = true;
      if (!item?.revision || !item.text || window.location.pathname !== browserPath) return;
      try {
        if (window.localStorage.getItem(CLOSED_REVISION_KEY) === item.revision) return;
      } catch { /* The dialog still works when storage is unavailable. */ }
      setAnnouncement(item);
    });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  function close() {
    if (!announcement) return;
    try {
      window.localStorage.setItem(CLOSED_REVISION_KEY, announcement.revision);
    } catch { /* Close the current dialog even if storage is unavailable. */ }
    setAnnouncement(null);
  }

  if (!announcement || !pathname || !isPublicPath(pathname)) return null;

  return (
    <Dialog.Root open placement="center" size="sm" scrollBehavior="inside"
      closeOnInteractOutside={false} closeOnEscape={false} initialFocusEl={() => closeButton.current}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header><Dialog.Title>{t("siteAnnouncement.title")}</Dialog.Title></Dialog.Header>
            <Dialog.Body>
              <Text whiteSpace="pre-wrap" overflowWrap="anywhere">{announcement.text}</Text>
            </Dialog.Body>
            <Dialog.Footer flexWrap="wrap">
              {announcement.href && (
                <Button asChild variant="outline">
                  <a href={announcement.href} target="_blank" rel="noopener noreferrer">{t("siteAnnouncement.details")}</a>
                </Button>
              )}
              <Button ref={closeButton} onClick={close}>{t("siteAnnouncement.close")}</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
