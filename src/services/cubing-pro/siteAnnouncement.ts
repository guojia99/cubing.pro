import { AuthHeader } from "./auth/token";
import { Request } from "./request";

export type SiteAnnouncement = { revision: string; text: string; href: string };
export type AdminSiteAnnouncement = SiteAnnouncement & { active: boolean };
type Envelope<T> = { data: T };
const ADMIN_TIMEOUT = 10000;
const adminPath = "/admin/system_result/site-announcement";

export async function getSiteAnnouncement(): Promise<SiteAnnouncement | null> {
  const { data } = await Request.get<Envelope<SiteAnnouncement | null>>("/public/site-announcement", { timeout: 2500 });
  return data.data;
}

export async function getAdminSiteAnnouncement(signal: AbortSignal): Promise<AdminSiteAnnouncement> {
  const { data } = await Request.get<Envelope<AdminSiteAnnouncement>>(adminPath, { headers: AuthHeader(), timeout: ADMIN_TIMEOUT, signal });
  return data.data;
}

export async function publishSiteAnnouncement(draft: Pick<SiteAnnouncement, "text" | "href">): Promise<AdminSiteAnnouncement> {
  const { data } = await Request.put<Envelope<AdminSiteAnnouncement>>(adminPath, draft, { headers: AuthHeader(), timeout: ADMIN_TIMEOUT });
  return data.data;
}

export async function withdrawSiteAnnouncement(): Promise<AdminSiteAnnouncement> {
  const { data } = await Request.delete<Envelope<AdminSiteAnnouncement>>(adminPath, { headers: AuthHeader(), timeout: ADMIN_TIMEOUT });
  return data.data;
}
