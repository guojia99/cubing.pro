"use client";

import type { OtherLink } from "@/services/cubing-pro/public/types";
import {
  DEFAULT_LINK_ICON,
  parseLetterIconKey,
  resolveIconSrc,
} from "@/views/ExternalLinks/utils";

export function ExternalLinkIconMedia({
  link,
}: {
  link: Pick<OtherLink, "icon" | "icon_url">;
}) {
  const src = resolveIconSrc(link);
  const letter = parseLetterIconKey(link.icon);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="external-link-card__icon"
        onError={(e) => {
          (e.target as HTMLImageElement).src = DEFAULT_LINK_ICON;
        }}
      />
    );
  }

  if (letter) {
    return <span className="external-link-card__letterIcon">{letter}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={DEFAULT_LINK_ICON} alt="" className="external-link-card__icon" />
  );
}
