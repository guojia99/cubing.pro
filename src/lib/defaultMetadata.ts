import type { Metadata } from "next";

import { getShellRouteKey, translateShell } from "@/i18n/messages/shell";

/** Static HTML uses zh-CN; LocalizedMetadata applies the browser locale after mount. */
export function getDefaultMetadata(routeId: string = "welcome"): Metadata {
  const routeKey = getShellRouteKey(routeId);
  const title = translateShell("zh-CN", routeKey ?? "shell.notFound.title");

  return {
    title,
    description: routeKey
      ? translateShell("zh-CN", "shell.metadata.description").replace("{title}", () => title)
      : translateShell("zh-CN", "shell.notFound.description"),
  };
}
