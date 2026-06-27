import type { Metadata } from "next";

import { Provider } from "@/components/ui/provider";
import { PALETTE_STORAGE_KEY } from "@/lib/websiteUiConfig";

export const metadata: Metadata = {
  title: {
    default: "Cubing Pro",
    template: "%s · Cubing Pro",
  },
  description: "Cubing Pro v4.0.0 — 魔方社区与工具平台",
};

const palettePrehydrateScript = `(function(){try{var p=localStorage.getItem("${PALETTE_STORAGE_KEY}")||"haitian";document.documentElement.dataset.palette=p;}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: palettePrehydrateScript }} />
      </head>
      <body suppressHydrationWarning>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
