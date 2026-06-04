import { AuthHeader } from "@/services/cubing-pro/auth/token";
import { Request } from "@/services/cubing-pro/request";

export const USER_KV_MAX_BYTES = 2 * 1024 * 1024;

export const USER_KV_KEYS = {
  website_ui_config: "website_ui_config",
  websize_ui_config: "websize_ui_config",
} as const;

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

export async function setUserKv(
  key: string,
  value: string,
  type: number,
): Promise<void> {
  assertPayloadWithinLimit(value);
  await Request.post<ApiEnvelope<null>>(
    "/user/kv/",
    { key, value, type },
    { headers: AuthHeader() },
  );
}
