import { AuthHeader } from "@/services/cubing-pro/auth/token";
import { Request } from "@/services/cubing-pro/request";

export const USER_KV_MAX_BYTES = 2 * 1024 * 1024;

export const USER_KV_KEYS = {
  algorithm_config: "algorithm_config",
  website_ui_config: "website_ui_config",
  websize_ui_config: "websize_ui_config",
  group_timer_ui_config: "group_timer_ui_config",
} as const;

export type UserKvRecord = {
  id?: number;
  key: string;
  value: string;
  type: number;
  createdAt?: string;
  updatedAt?: string;
};

type ApiEnvelope<T> = {
  code: string;
  data: T;
  msg: string;
};

export function assertPayloadWithinLimit(raw: string): void {
  if (typeof Blob !== "undefined") {
    if (new Blob([raw]).size > USER_KV_MAX_BYTES) {
      throw new Error(`数据超过 ${USER_KV_MAX_BYTES} 字节上限`);
    }
  } else if (raw.length > USER_KV_MAX_BYTES) {
    throw new Error(`数据超过 ${USER_KV_MAX_BYTES} 字节上限`);
  }
}

/** GET /user/kv/:key 单条（含 value） */
export async function getUserKv(key: string): Promise<UserKvRecord> {
  const r = await Request.get<ApiEnvelope<UserKvRecord & { Value?: string }>>(
    `/user/kv/${encodeURIComponent(key)}`,
    { headers: AuthHeader() },
  );
  const row = r.data.data;
  return {
    ...row,
    value: row.value ?? row.Value ?? "",
  };
}

export async function setUserKv(
  key: string,
  value: string,
  type: number,
  options?: { onUploadProgress?: (percent: number) => void },
): Promise<void> {
  assertPayloadWithinLimit(value);
  await Request.post<ApiEnvelope<null>>(
    "/user/kv/",
    { key, value, type },
    {
      headers: AuthHeader(),
      onUploadProgress: (ev) => {
        if (ev.total && options?.onUploadProgress) {
          options.onUploadProgress(Math.round((ev.loaded * 100) / ev.total));
        }
      },
    },
  );
}
