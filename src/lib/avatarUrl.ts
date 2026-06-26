import { getAPIUrl, isLocal } from "@/services/cubing-pro/request";

export function avatarUrl(avatar: string | undefined) {
  if (!avatar) {
    return avatar;
  }
  let a = avatar;
  if (isLocal() && a.length > 0 && a[0] === "/") {
    a = getAPIUrl() + a;
  }
  return a;
}
