import { AuthHeader } from "./auth/token";
import { Request } from "./request";

export type SiteAnnouncement = { id: string; revision: string; text: string; href: string };
export type AdminSiteAnnouncement = SiteAnnouncement & { active: boolean };
type Envelope<T> = { data: T };
type AnnouncementDraft = Pick<SiteAnnouncement, "text" | "href">;
const ADMIN_TIMEOUT = 10000;
const adminPath = "/admin/system_result/site-announcement";

export async function getSiteAnnouncements(): Promise<SiteAnnouncement[]> {
  const { data } = await Request.get<Envelope<SiteAnnouncement[]>>("/public/site-announcement", { timeout: 2500 });
  return Array.isArray(data.data) ? data.data : [];
}

export async function getAdminSiteAnnouncements(signal: AbortSignal): Promise<AdminSiteAnnouncement[]> {
  const { data } = await Request.get<Envelope<AdminSiteAnnouncement[]>>(adminPath, { headers: AuthHeader(), timeout: ADMIN_TIMEOUT, signal });
  if (!Array.isArray(data.data)) throw new Error("Invalid site announcement list");
  return data.data;
}

export async function publishSiteAnnouncement(draft: AnnouncementDraft, id?: string): Promise<AdminSiteAnnouncement> {
  const config = { headers: AuthHeader(), timeout: ADMIN_TIMEOUT };
  const { data } = id === undefined
    ? await Request.post<Envelope<AdminSiteAnnouncement>>(adminPath, draft, config)
    : await Request.put<Envelope<AdminSiteAnnouncement>>(`${adminPath}/${encodeURIComponent(id)}`, draft, config);
  return data.data;
}

export async function withdrawSiteAnnouncement(id: string): Promise<AdminSiteAnnouncement> {
  const { data } = await Request.delete<Envelope<AdminSiteAnnouncement>>(`${adminPath}/${encodeURIComponent(id)}`, { headers: AuthHeader(), timeout: ADMIN_TIMEOUT });
  return data.data;
}
