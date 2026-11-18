"use client";

import NextLink from "next/link";

export function PlayerLink(userId: unknown, name: string, color: string) {
  const linkColor = color !== "" ? color : "var(--accent)";

  return (
    <strong>
      <NextLink href={`/player/${userId}`} style={{ color: linkColor }}>
        {name}
      </NextLink>
    </strong>
  );
}

export function CompetitionLink(compsId: unknown, name: string) {
  return (
    <strong>
      <NextLink href={`/competition/${compsId}`} style={{ color: "var(--accent)" }}>{name}</NextLink>
    </strong>
  );
}
