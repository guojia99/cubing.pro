import type { NotificationItem, NotificationPage } from "@/services/cubing-pro/notifications";
import type { SiteAnnouncement } from "@/services/cubing-pro/siteAnnouncement";

export const ANNOUNCEMENT_READS_KEY = "cubing-pro:notifications:announcement-reads";
export const LEGACY_CLOSED_REVISIONS_KEY = "cubing-pro:site-announcement:closed-revisions";

type StorageReader = Pick<Storage, "getItem">;

function storedObject(storage: StorageReader, key: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(storage.getItem(key) ?? "null");
    return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export function readGuestAnnouncements(storage: StorageReader): Map<string, string> {
  const reads = new Map<string, string>();
  for (const [id, revision] of Object.entries(storedObject(storage, LEGACY_CLOSED_REVISIONS_KEY))) {
    if (typeof revision === "string") reads.set(id, new Date(0).toISOString());
  }
  for (const [id, at] of Object.entries(storedObject(storage, ANNOUNCEMENT_READS_KEY))) {
    if (typeof at === "string" && Number.isFinite(Date.parse(at))) reads.set(id, at);
  }
  return reads;
}

export function rememberGuestAnnouncement(storage: StorageReader & Pick<Storage, "setItem">, id: string, readAt: string) {
  const reads = readGuestAnnouncements(storage);
  reads.set(id, readAt);
  storage.setItem(ANNOUNCEMENT_READS_KEY, JSON.stringify(Object.fromEntries(reads)));
  return reads;
}

export function announcementNotifications(items: SiteAnnouncement[], reads: ReadonlyMap<string, string>): NotificationItem[] {
  return items.map(item => ({
    id: `site-announcement:${item.id}`, type: "site-announcement" as const,
    createdAt: item.publishedAt, title: item.title, body: item.text, readAt: reads.get(item.id) ?? null,
  })).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id.localeCompare(a.id));
}

export function paginateAnnouncements(items: NotificationItem[], requestedPage: number, size: number): NotificationPage {
  const total = items.length;
  const page = Math.max(1, Math.min(requestedPage, Math.max(1, Math.ceil(total / size))));
  return { items: items.slice((page - 1) * size, page * size), total, page, unread: items.filter(item => !item.readAt).length };
}
