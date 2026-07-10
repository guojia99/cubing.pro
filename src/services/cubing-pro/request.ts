import axios, { type AxiosError, type AxiosResponse } from "axios";

import { siteMeta } from "@/config/defaultSettings";

/** 本地 Go 后端（监听 0.0.0.0:20000；浏览器用 127.0.0.1 访问） */
export const LOCAL_DEV_API_BASE = "http://127.0.0.1:20000/v3/cube-api";

/** 线上 API 根地址 */
export const REMOTE_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  process.env.CUBE_API_UPSTREAM ??
  "https://cubing.pro/v3/cube-api";

function isDevWithProxy(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0"
  );
}

function isCubingProHost(hostname: string) {
  return hostname === "cubing.pro" || hostname.endsWith(".cubing.pro");
}

/**
 * - next dev（localhost）：优先直连完整 API URL（避免 trailingSlash 代理丢失尾斜杠导致 404）
 *   本地 Go 后端可在 `.env.local` 设置 `NEXT_PUBLIC_DEV_API_BASE`，或执行 `make dev`
 * - 静态站点部署在 cubing.pro：同源 /v3/cube-api
 * - 其他静态预览 / CDN：NEXT_PUBLIC_API_BASE 完整 URL
 */
export function getAPIUrl() {
  if (typeof window === "undefined") {
    return REMOTE_API_BASE;
  }

  const hostname = window.location.hostname;

  if (isDevWithProxy(hostname) || isLocal()) {
    const devApi = process.env.NEXT_PUBLIC_DEV_API_BASE?.replace(/\/$/, "");
    if (devApi?.startsWith("http")) {
      return devApi;
    }
    // 相对 /v3/cube-api 经 Next rewrite 时，POST …/admin/users/ 等尾斜杠可能被去掉 → 404
    return REMOTE_API_BASE.replace(/\/$/, "");
  }

  if (isCubingProHost(hostname)) {
    return siteMeta.apiPrefix;
  }

  return REMOTE_API_BASE;
}

export function isLocal(): boolean {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  if (isDevWithProxy(hostname)) return true;
  return /^192\.168/.test(hostname) || /^10./.test(hostname);
}

export type ErrorMsg = {
  code: number;
  http_code: number;
  message: string;
  level: string;
  ref: string;
  line: string;
  data: unknown;
  error?: string;
};

export function getApiErrorDisplayMessage(body: unknown): string | undefined {
  if (body === null || typeof body !== "object") return undefined;
  const d = body as Record<string, unknown>;
  if (typeof d.data === "string" && d.data.trim()) return d.data.trim();
  if (typeof d.error === "string" && d.error.trim()) return d.error.trim();
  if (typeof d.message === "string" && d.message.trim()) return d.message.trim();
  return undefined;
}

export type ApiRequestConfig = {
  signal?: AbortSignal;
};

/** useEffect cleanup 中 abort 后，可用来忽略 CanceledError */
export function isRequestCanceled(error: unknown): boolean {
  if (axios.isCancel(error)) return true;
  if (error instanceof Error && error.name === "CanceledError") return true;
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ERR_CANCELED"
  ) {
    return true;
  }
  return false;
}

export const Request = axios.create({
  timeout: 900_000,
});

Request.interceptors.request.use((config) => {
  if (!config.baseURL) {
    config.baseURL = getAPIUrl();
  }
  return config;
});

Request.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => Promise.reject(error),
);
