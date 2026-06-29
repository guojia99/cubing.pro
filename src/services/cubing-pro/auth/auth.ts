import { AuthHeader, removeToken } from "@/services/cubing-pro/auth/token";
import type {
  CurrentUser,
  Token,
  UpdateAvatarRequest,
  UpdateDetailRequest,
} from "@/services/cubing-pro/auth/types";
import { getAPIUrl, Request } from "@/services/cubing-pro/request";

export async function refreshToken() {
  return Request.post<Token>("/auth/refresh", {}, { headers: AuthHeader() });
}

export async function logout() {
  removeToken();
  try {
    await Request.post("/auth/logout", {}, { headers: AuthHeader() });
  } catch {
    // token already cleared locally
  }
}

export async function currentUser() {
  return Request.get<{ data: CurrentUser }>("/auth/current", {
    headers: AuthHeader(),
  });
}

export async function updateAvatar(req: UpdateAvatarRequest) {
  return Request.post("/auth/user/avatar", req, { headers: AuthHeader() });
}

export async function updateDetail(req: UpdateDetailRequest) {
  return Request.post("/auth/user/detail", req, { headers: AuthHeader() });
}

export function getWcaLoginUrl(callbackUrl: string) {
  return `${getAPIUrl()}/auth/wca?redirect=${encodeURIComponent(callbackUrl)}`;
}
