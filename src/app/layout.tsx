import type { Metadata } from "next";

import { Provider } from "@/components/ui/provider";

export const metadata: Metadata = {
  title: {
    default: "Cubing Pro",
    template: "%s · Cubing Pro",
  },
  description: "Cubing Pro v4.0.0 — 魔方社区与工具平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
