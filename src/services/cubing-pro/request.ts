import axios, { type AxiosError, type AxiosResponse } from "axios";

import { siteMeta } from "@/config/defaultSettings";

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
 * - next dev（localhost）：同源 /v3/cube-api + rewrites
 * - 静态站点部署在 cubing.pro：同源 /v3/cube-api
 * - 其他静态预览 / CDN：NEXT_PUBLIC_API_BASE 完整 URL
 */
export function getAPIUrl() {
  if (typeof window === "undefined") {
    return REMOTE_API_BASE;
  }

  const hostname = window.location.hostname;
  if (isDevWithProxy(hostname) || isCubingProHost(hostname)) {
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
