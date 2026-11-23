import type { Metadata } from "next";

import { SiteAnnouncementDialog } from "@/components/layout/SiteAnnouncementDialog";
import { Provider } from "@/components/ui/provider";
import { getDefaultMetadata } from "@/lib/defaultMetadata";
import { PALETTE_STORAGE_KEY } from "@/lib/websiteUiConfig";

export const metadata: Metadata = {
  ...getDefaultMetadata(),
  title: {
    default: "Cubing Pro",
    template: "%s · Cubing Pro",
  },
  icons: "/CubingProMiniIcon.png",
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
        <Provider>
          {children}
          <SiteAnnouncementDialog />
        </Provider>
      </body>
    </html>
  );
}
