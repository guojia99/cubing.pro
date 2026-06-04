import { getAPIUrl, isLocal } from "@/services/cubing-pro/request";

export function resolveAvatarUrl(avatar: string | undefined): string | undefined {
  if (!avatar) return undefined;
  if (isLocal() && avatar.length > 0 && avatar[0] === "/") {
    return getAPIUrl() + avatar;
  }
  return avatar;
}

export function wcaPersonUrl(wcaId: string) {
  return `https://www.worldcubeassociation.org/persons/${wcaId}`;
}
