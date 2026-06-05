"use client";

import NextLink from "next/link";

function extractChinese(text: string): string {
  const matches = text.match(/[\u4e00-\u9fff]/g);
  if (matches) return matches.join("");
  return text;
}

export function WCALink(wcaId: unknown, name: string | null = null) {
  if (wcaId === null || wcaId === undefined) {
    return <>-</>;
  }

  const wca = String(wcaId).toUpperCase();
  let dataName = wca;
  if (name !== null) {
    dataName = name;
  }

  if (wca !== undefined && wca !== "" && wca !== "-") {
    return (
      <strong>
        <NextLink href={`/wca/player/${wca}`}>{dataName}</NextLink>
      </strong>
    );
  }
  return <>-</>;
}

export function WCALinkWithCnName(wcaId: unknown, name: string | null = null) {
  if (name === null || name === "") {
    return WCALink(wcaId, name);
  }
  return WCALink(wcaId, extractChinese(name));
}
