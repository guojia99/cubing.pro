import { AuthHeader } from "@/services/cubing-pro/auth/token";
import { Request } from "@/services/cubing-pro/request";

export type ForumKind = "set" | "group" | "solution";

export interface ForumTarget {
  kind: ForumKind;
  id: string;
  unavailable?: boolean;
  cube: string;
  className: string;
  setName: string;
  setId?: string;
  groupName: string;
  caseName: string;
  moves: string;
}

export interface ForumComment {
  id: number;
  parentId: number | null;
  authorName: string;
  replyToName: string;
  body: string;
  deleted: boolean;
  createdAt: string;
}

export interface ForumCounts {
  sets?: Record<string, number>;
  groups: Record<string, number>;
  solutions: Record<string, number>;
}

interface Page<T> {
  items: T[];
  total: number;
  page: number;
}

export interface ForumNotification {
  id: number;
  commentId: number;
  target: ForumTarget;
  authorName: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export type RecentDiscussion = { target: ForumTarget; count: number; lastActivity: string; lastCommentId: number };
export const FORUM_PAGE_SIZE = 20;
type Result<T> = { data: T };
const publicApi = "/public/formula-forum";
const userApi = "/user/formula-forum";
const adminApi = "/admin/formula-forum/comments";

export async function getForumCounts(cube: string, className: string, signal: AbortSignal) {
  const response = await Request.get<Result<ForumCounts>>(publicApi + "/counts", {
    params: { cube, class: className }, signal,
  });
  return response.data.data;
}

function commentsPath(kind: ForumKind, id: string) {
  return `/targets/${kind}/${encodeURIComponent(id)}/comments`;
}

export async function getForumComments(kind: ForumKind, id: string, page: number, commentId: number | undefined, signal: AbortSignal) {
  const response = await Request.get<Result<Page<ForumComment> & { target: ForumTarget; count: number }>>(
    publicApi + commentsPath(kind, id), { params: { page, size: FORUM_PAGE_SIZE, commentId }, signal },
  );
  return response.data.data;
}

export async function addForumComment(kind: ForumKind, id: string, body: string, parentId?: number) {
  const response = await Request.post<Result<{ id: number }>>(
    userApi + commentsPath(kind, id), { body, parentId }, { headers: AuthHeader() },
  );
  return response.data.data;
}

export async function getRecentDiscussions(page: number, signal: AbortSignal) {
  const response = await Request.get<Result<Page<RecentDiscussion>>>(publicApi + "/recent", {
    params: { page, size: FORUM_PAGE_SIZE }, signal,
  });
  return response.data.data;
}

export async function getMyDiscussions(page: number, signal: AbortSignal) {
  const response = await Request.get<Result<Page<RecentDiscussion>>>(userApi + "/discussions", {
    params: { page, size: FORUM_PAGE_SIZE }, headers: AuthHeader(), signal,
  });
  return response.data.data;
}

export async function getMyComments(page: number, signal: AbortSignal) {
  const response = await Request.get<Result<Page<ForumComment & { target: ForumTarget }>>>(userApi + "/comments", {
    params: { page, size: FORUM_PAGE_SIZE }, headers: AuthHeader(), signal,
  });
  return response.data.data;
}

export async function getReplyNotifications(page: number, signal: AbortSignal, size = FORUM_PAGE_SIZE) {
  const response = await Request.get<Result<Page<ForumNotification> & { unread: number }>>(userApi + "/notifications", {
    params: { page, size }, headers: AuthHeader(), signal,
  });
  return response.data.data;
}

export async function markReplyRead(id: number) {
  await Request.put(userApi + `/notifications/${id}/read`, {}, { headers: AuthHeader() });
}

export async function getModerationComments(page: number, signal: AbortSignal) {
  const response = await Request.get<Result<Page<ForumComment & { target: ForumTarget }>>>(adminApi, {
    params: { page, size: FORUM_PAGE_SIZE }, headers: AuthHeader(), signal,
  });
  return response.data.data;
}

export async function deleteForumComment(id: number) {
  await Request.delete(adminApi + "/" + id, { headers: AuthHeader() });
}
