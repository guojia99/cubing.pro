import type { ForumKind } from "@/services/cubing-pro/algs/forum";

const STORAGE_KEY = "cubing_pro_forum_login_resume";
const TTL = 30 * 60 * 1000;

export interface ForumLoginResume {
  pathname: string;
  thread: { kind: ForumKind; id: string; commentId?: number; origin?: "library" };
  tab?: "recent";
  ts: number;
}

export function normalizeForumPath(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

export function saveForumLoginResume({ pathname, thread: { kind, id, commentId, origin }, tab }: Omit<ForumLoginResume, "ts">) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      pathname: normalizeForumPath(pathname), thread: { kind, id, commentId, origin }, tab, ts: Date.now(),
    }));
    return true;
  } catch {
    return false;
  }
}

export function clearForumLoginResume() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function readForumLoginResume(pathname: string): ForumLoginResume | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const payload = JSON.parse(raw) as ForumLoginResume | null;
    const thread = payload?.thread;
    const now = Date.now();
    if (!payload || typeof payload.pathname !== "string" || !Number.isFinite(payload.ts)
      || now - payload.ts >= TTL || payload.ts > now
      || (payload.tab !== undefined && payload.tab !== "recent")
      || (thread?.kind !== "solution" && thread?.kind !== "group" && thread?.kind !== "class")
      || (thread.origin !== undefined && thread.origin !== "library")
      || typeof thread.id !== "string" || !/^[0-9a-f]{16}$/.test(thread.id)
      || (thread.commentId !== undefined && !(Number.isSafeInteger(thread.commentId) && thread.commentId > 0))) {
      clearForumLoginResume();
      return null;
    }
    return normalizeForumPath(payload.pathname) === normalizeForumPath(pathname) ? payload : null;
  } catch {
    clearForumLoginResume();
    return null;
  }
}

export function consumeForumLoginResume(pathname: string) {
  const payload = readForumLoginResume(pathname);
  return payload && clearForumLoginResume() ? payload : null;
}
