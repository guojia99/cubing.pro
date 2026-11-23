import type { ForumTarget } from "./algs/forum";
import { AuthHeader } from "./auth/token";
import { Request } from "./request";
import type { SiteAnnouncement } from "./siteAnnouncement";

export type NotificationType = "formula-reply" | "site-announcement";
export type NotificationFilter = "all" | NotificationType;

export interface NotificationItem {
  id: string;
  type: NotificationType;
  createdAt: string;
  readAt: string | null;
  title?: string;
  body: string;
  authorName?: string;
  commentId?: number;
  target?: ForumTarget;
}

export interface NotificationPage {
  items: NotificationItem[];
  total: number;
  page: number;
  unread: number;
}

export const NOTIFICATION_PAGE_SIZE = 20;
export const NOTIFICATION_PREVIEW_SIZE = 5;
const api = "/user/notifications";

export async function getNotifications(page: number, type: NotificationFilter, signal: AbortSignal, size = NOTIFICATION_PAGE_SIZE) {
  const response = await Request.get<{ data: NotificationPage }>(api, {
    params: { page, size, type }, headers: AuthHeader(), signal,
  });
  return response.data.data;
}

export async function markNotificationRead(id: string, signal?: AbortSignal) {
  await Request.put(api + `/${encodeURIComponent(id)}/read`, {}, { headers: AuthHeader(), signal });
}

export async function getPublicNotificationAnnouncements(signal: AbortSignal): Promise<SiteAnnouncement[]> {
  const response = await Request.get<{ data: SiteAnnouncement[] }>("/public/site-announcement", { signal, timeout: 2500 });
  return Array.isArray(response.data.data) ? response.data.data.filter(item =>
    item?.id && item.revision && item.title && item.text && Number.isFinite(Date.parse(item.publishedAt)),
  ) : [];
}
