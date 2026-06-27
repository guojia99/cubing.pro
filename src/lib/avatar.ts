import { getAPIUrl, isLocal } from "@/services/cubing-pro/request";

const API_PATH_PREFIX = "/v3/cube-api";

function resolveLocalAvatarPath(avatar: string): string {
  if (avatar.startsWith(API_PATH_PREFIX)) {
    const apiBase = getAPIUrl();
    if (apiBase.startsWith("http")) {
      const origin = apiBase.replace(/\/v3\/cube-api\/?$/, "");
      return `${origin}${avatar}`;
    }
    return avatar;
  }
  return getAPIUrl() + avatar;
}

export function resolveAvatarUrl(avatar: string | undefined): string | undefined {
  if (!avatar) return undefined;
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
  if (isLocal() && avatar.length > 0 && avatar[0] === "/") {
    return resolveLocalAvatarPath(avatar);
  }
  return avatar;
}

export function wcaPersonUrl(wcaId: string) {
  return `https://www.worldcubeassociation.org/persons/${wcaId}`;
}
