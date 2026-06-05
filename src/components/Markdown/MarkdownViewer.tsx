"use client";

import { Box, Dialog, Portal } from "@chakra-ui/react";
import { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { resolveMarkdownImageSrc } from "./markdownUtils";

import "@/components/Markdown/github-markdown.css";
import "@/components/Markdown/detail.css";

interface MarkdownViewerProps {
  content: string;
  imageBase?: string;
  headingIds?: string[];
  isInternalLink?: (href: string) => boolean;
  onInternalLink?: (href: string) => void;
  className?: string;
}

export function MarkdownViewer({
  content,
  imageBase = "",
  headingIds = [],
  isInternalLink,
  onInternalLink,
  className,
}: MarkdownViewerProps) {
  const headingIndexRef = useRef(0);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const getHeadingId = () => {
    const idx = headingIndexRef.current;
    headingIndexRef.current += 1;
    return headingIds[idx] ?? `h-${idx}`;
  };

  headingIndexRef.current = 0;

  const components = useMemo((): Components => {
    return {
      a({ href, children, ...props }) {
        if (href && isInternalLink?.(href)) {
          return (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onInternalLink?.(href);
              }}
              style={{ color: "var(--chakra-colors-accent)" }}
              {...props}
            >
              {children}
            </a>
          );
        }
        if (href?.startsWith("#")) {
          return (
            <a href={href} {...props}>
              {children}
            </a>
          );
        }
        return (
          <a href={href} target="_blank" rel="noreferrer" {...props}>
            {children}
          </a>
        );
      },
      img({ src, alt }) {
        if (!src || typeof src !== "string") return null;
        const fullSrc = imageBase ? resolveMarkdownImageSrc(src, imageBase) : src;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fullSrc}
            alt={alt || ""}
            style={{ maxWidth: "100%", borderRadius: 8, cursor: "pointer" }}
            onClick={() => setPreviewSrc(fullSrc)}
          />
        );
      },
      h1({ children, ...props }) {
        const id = getHeadingId();
        return (
          <h1 id={id} {...props}>
            {children}
          </h1>
        );
      },
      h2({ children, ...props }) {
        const id = getHeadingId();
        return (
          <h2 id={id} {...props}>
            {children}
          </h2>
        );
      },
      h3({ children, ...props }) {
        const id = getHeadingId();
        return (
          <h3 id={id} {...props}>
            {children}
          </h3>
        );
      },
      h4({ children, ...props }) {
        const id = getHeadingId();
        return (
          <h4 id={id} {...props}>
            {children}
          </h4>
        );
      },
    };
    // headingIds length drives remount via key on parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageBase, isInternalLink, onInternalLink, headingIds.length]);

  return (
    <>
      <Box
        className={`markdown-body markdown-detail-content ${className ?? ""}`}
        p={{ base: 4, md: 6 }}
        borderRadius="xl"
        bg="bg"
        borderWidth="1px"
        borderColor="border"
      >
        <ReactMarkdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]} components={components}>
          {content}
        </ReactMarkdown>
      </Box>

      <Dialog.Root open={!!previewSrc} onOpenChange={(e) => !e.open && setPreviewSrc(null)} size="lg">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Body textAlign="center" p="4">
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc} alt="" style={{ maxWidth: "100%", borderRadius: 8 }} />
                ) : null}
              </Dialog.Body>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
