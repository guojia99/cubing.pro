import { refreshToken } from "@/services/cubing-pro/auth/auth";
import type { Token } from "@/services/cubing-pro/auth/types";

const AUTH_TOKEN_KEY = "authToken_cubing_pro";
const REFRESH_INTERVAL = 5 * 60 * 1000;

export function saveToken(token: Token) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(token));
}

export function getToken(): Token | null {
  if (typeof window === "undefined") return null;
  const str = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!str) return null;
  try {
    return JSON.parse(str) as Token;
  } catch {
    return null;
  }
}

export function removeToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function AuthHeader(): Record<string, string> {
  const token = getToken();
  return {
    Authorization: `Bearer ${token?.token ?? ""}`,
    Accept: "application/json",
  };
}

export async function refreshTokenInter() {
  const token = getToken();
  if (!token?.token) return;
  try {
    const value = await refreshToken();
    if (!value?.data?.token) return;
    if (!value.data.expire) {
      saveToken(value.data);
      return;
    }
    const expireTime = new Date(value.data.expire);
    if (Number.isNaN(expireTime.getTime())) {
      saveToken(value.data);
      return;
    }
    const timeDifference = expireTime.getTime() - Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    if (timeDifference <= fifteenMinutes) return;
    saveToken(value.data);
  } catch {
    // 刷新失败不应清掉刚登录的 token（网络抖动 / WCA 回调后尚无 expire）
  }
}

let tokenRefreshTimer: ReturnType<typeof setInterval> | null = null;

export function startTokenRefresh() {
  if (typeof window === "undefined") return;
  if (tokenRefreshTimer) return;
  tokenRefreshTimer = window.setInterval(
    () => void refreshTokenInter(),
    REFRESH_INTERVAL,
  );
}

/** Parse ?token= from WCA callback URL before fetching current user */
export function processWcaCallbackToken() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const tokenStr = params.get("token");
  if (!tokenStr) return;
  saveToken({ token: tokenStr, expire: "", status: "" });
  const url = new URL(window.location.href);
  url.searchParams.delete("token");
  window.history.replaceState({}, "", url.toString());
}
