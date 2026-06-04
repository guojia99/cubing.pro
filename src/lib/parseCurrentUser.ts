import type { AxiosResponse } from "axios";

import type { CurrentUserData } from "@/services/cubing-pro/auth/types";

function isUserRecord(value: unknown): value is CurrentUserData {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as CurrentUserData).id === "number"
  );
}

/** 兼容 { data: User } 与 { data: { data: User } } 两种后端结构 */
export function parseCurrentUserData(
  response: AxiosResponse<unknown>,
): CurrentUserData | null {
  const body = response.data;
  if (!body || typeof body !== "object") return null;

  const layer1 = (body as { data?: unknown }).data;
  if (isUserRecord(layer1)) return layer1;
  if (layer1 && typeof layer1 === "object") {
    const layer2 = (layer1 as { data?: unknown }).data;
    if (isUserRecord(layer2)) return layer2;
  }

  return null;
}
