import type { Metadata } from "next";
import { Suspense } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { ExportPathMarker } from "@/components/routing/ExportPathMarker";
import { WelcomePageView } from "@/views/Welcome/WelcomePageView";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "欢迎",
};

/**
 * 静态导出时根路径直接渲染欢迎页，避免 `redirect("/welcome")` 写入
 * index.html 的 NEXT_REDIRECT；若 Web 服务器将所有路径 fallback 到根 index.html，
 * 客户端重定向会与 /welcome 形成无限刷新。
 */
export default function HomePage() {
  return (
    <>
      <ExportPathMarker path="/" />
      <AppShell>
        <Suspense fallback={null}>
          <WelcomePageView />
        </Suspense>
      </AppShell>
    </>
  );
}
