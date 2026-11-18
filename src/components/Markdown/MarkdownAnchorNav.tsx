"use client";

import { Box, Text } from "@chakra-ui/react";

import type { MarkdownHeading } from "./markdownUtils";
import { useIntlMessage } from "@/hooks/useIntlMessage";

export function MarkdownAnchorNav({ headings }: { headings: MarkdownHeading[] }) {
  const { formatMessage: t } = useIntlMessage();
  if (headings.length === 0) return null;

  return (
    <Box className="markdown-detail-anchor">
      <Text fontSize="14px" fontWeight="semibold" color="fg.muted" mb="2">
        {t({ id: "shared.markdown.contents" })}
      </Text>
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className="markdown-detail-anchor-link"
          style={{ paddingLeft: h.level > 2 ? `${(h.level - 2) * 12}px` : 0 }}
        >
          {h.text}
        </a>
      ))}
    </Box>
  );
}
