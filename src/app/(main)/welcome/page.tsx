import type { Metadata } from "next";
import { Box } from "@chakra-ui/react";

export const metadata: Metadata = {
  title: "欢迎",
};

/**
 * 欢迎页 — 仅保留导航（见 AppShell），正文区域预留给后续模块。
 * @see docs/features/detail/welcome.md
 */
export default function WelcomePage() {
  return (
    <Box
      minH={{ base: "40vh", md: "50vh" }}
      aria-label="欢迎页内容区"
      role="region"
    />
  );
}
