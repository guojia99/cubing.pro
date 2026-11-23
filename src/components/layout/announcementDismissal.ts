import type { SiteAnnouncement } from "@/services/cubing-pro/siteAnnouncement";

export const CLOSED_REVISIONS_KEY = "cubing-pro:site-announcement:closed-revisions";

export function readClosedRevisions(storage: Pick<Storage, "getItem">): Map<string, string> {
  try {
    const value: unknown = JSON.parse(storage.getItem(CLOSED_REVISIONS_KEY) ?? "null");
    if (value === null || typeof value !== "object" || Array.isArray(value)) return new Map();
    return new Map(Object.entries(value).filter((pair): pair is [string, string] => typeof pair[1] === "string"));
  } catch {
    return new Map();
  }
}

export function unseenAnnouncements(items: SiteAnnouncement[], revisions: ReadonlyMap<string, string>) {
  return items.filter((item) => revisions.get(item.id) !== item.revision);
}

export function rememberClosedRevisions(
  storage: Pick<Storage, "getItem" | "setItem">,
  shown: Pick<SiteAnnouncement, "id" | "revision">[],
) {
  const revisions = readClosedRevisions(storage);
  for (const item of shown) revisions.set(item.id, item.revision);
  storage.setItem(CLOSED_REVISIONS_KEY, JSON.stringify(Object.fromEntries(revisions)));
}
