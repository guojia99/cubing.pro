"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";

import { ANNOUNCEMENT_READS_KEY, LEGACY_CLOSED_REVISIONS_KEY, announcementNotifications, paginateAnnouncements, readGuestAnnouncements, rememberGuestAnnouncement } from "@/components/notifications/guestReads";
import { useAuth } from "@/contexts/AuthProvider";
import { isLoggedIn } from "@/lib/auth";
import { getNotifications, getPublicNotificationAnnouncements, markNotificationRead, NOTIFICATION_PAGE_SIZE, NOTIFICATION_PREVIEW_SIZE, type NotificationFilter, type NotificationPage } from "@/services/cubing-pro/notifications";

type NotificationsContextValue = {
  identity: string;
  ready: boolean;
  loggedIn: boolean;
  preview?: NotificationPage;
  error?: unknown;
  version: number;
  refresh: () => void;
  loadPage: (page: number, type: NotificationFilter, signal: AbortSignal, size?: number) => Promise<NotificationPage>;
  markRead: (id: string) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth();
  const loggedIn = isLoggedIn(currentUser?.id);
  const identity = loading ? "loading" : loggedIn ? String(currentUser?.id) : "guest";
  const currentIdentity = useRef(identity);
  currentIdentity.current = identity;
  const [result, setResult] = useState<{ identity: string; data?: NotificationPage; error?: unknown } | null>(null);
  const [version, changed] = useReducer((value: number) => value + 1, 0);
  const previewRequest = useRef<AbortController | null>(null);
  const mutations = useRef(new Map<string, { identity: string; request: AbortController; promise: Promise<void> }>());
  const guestReads = useRef(new Map<string, string>());

  const loadPage = useCallback(async (page: number, type: NotificationFilter, signal: AbortSignal, size = NOTIFICATION_PAGE_SIZE) => {
    if (loggedIn) return getNotifications(page, type, signal, size);
    if (type === "formula-reply") return { items: [], total: 0, page: 1, unread: 0 };
    const announcements = await getPublicNotificationAnnouncements(signal);
    let reads = guestReads.current;
    try {
      reads = new Map([...readGuestAnnouncements(window.localStorage), ...reads]);
    } catch { /* Keep in-memory reads when browser storage is unavailable. */ }
    return paginateAnnouncements(announcementNotifications(announcements, reads), page, size);
  }, [loggedIn]);

  const refresh = useCallback(() => {
    if (loading) return;
    previewRequest.current?.abort();
    const request = new AbortController();
    previewRequest.current = request;
    void loadPage(1, "all", request.signal, NOTIFICATION_PREVIEW_SIZE).then(
      data => {
        if (request.signal.aborted || currentIdentity.current !== identity) return;
        setResult({ identity, data });
        changed();
      },
      error => {
        if (request.signal.aborted || currentIdentity.current !== identity) return;
        setResult(previous => ({ identity, data: previous?.identity === identity ? previous.data : undefined, error }));
      },
    );
  }, [identity, loading, loadPage]);

  useEffect(() => {
    refresh();
    const refreshVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    const timer = window.setInterval(refreshVisible, 60000);
    const pending = mutations.current;
    return () => {
      previewRequest.current?.abort();
      for (const mutation of pending.values()) mutation.request.abort();
      pending.clear();
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [refresh]);

  useEffect(() => {
    if (loggedIn || loading) return;
    const sync = (event: StorageEvent) => {
      if (event.key === ANNOUNCEMENT_READS_KEY || event.key === LEGACY_CLOSED_REVISIONS_KEY || event.key === null) {
        guestReads.current = new Map();
        refresh();
        changed();
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [loggedIn, loading, refresh]);

  const markRead = useCallback((id: string): Promise<void> => {
    if (loading) return Promise.resolve();
    const pending = mutations.current.get(id);
    if (pending?.identity === identity) return pending.promise;
    const request = new AbortController();
    const promise = (async () => {
      const readAt = new Date().toISOString();
      if (loggedIn) {
        await markNotificationRead(id, request.signal);
      } else {
        if (!id.startsWith("site-announcement:")) return;
        const announcementId = id.slice("site-announcement:".length);
        try {
          guestReads.current = rememberGuestAnnouncement(window.localStorage, announcementId, readAt);
        } catch {
          guestReads.current.set(announcementId, readAt);
        }
      }
      if (request.signal.aborted || currentIdentity.current !== identity) return;
      setResult(previous => {
        if (previous?.identity !== identity || !previous.data) return previous;
        const wasUnread = previous.data.items.some(item => item.id === id && !item.readAt);
        return { identity, data: {
          ...previous.data,
          items: previous.data.items.map(item => item.id === id ? { ...item, readAt: item.readAt ?? readAt } : item),
          unread: Math.max(0, previous.data.unread - (wasUnread ? 1 : 0)),
        } };
      });
      changed();
      refresh();
    })().finally(() => {
      if (mutations.current.get(id)?.request === request) mutations.current.delete(id);
    });
    mutations.current.set(id, { identity, request, promise });
    return promise;
  }, [identity, loading, loggedIn, refresh]);

  const current = result?.identity === identity ? result : null;
  const value = useMemo(() => ({
    identity, ready: !loading, loggedIn, preview: current?.data, error: current?.error,
    version, refresh, loadPage, markRead,
  }), [identity, loading, loggedIn, current, version, refresh, loadPage, markRead]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("NotificationsProvider is missing");
  return context;
}
