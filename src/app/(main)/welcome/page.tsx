import type { Metadata } from "next";
import { Suspense } from "react";

import { ExportPathMarker } from "@/components/routing/ExportPathMarker";
import { WelcomePageView } from "@/views/Welcome/WelcomePageView";

export const metadata: Metadata = {
  title: "欢迎",
};

export default function WelcomePage() {
  return (
    <>
      <ExportPathMarker path="/welcome" />
      <Suspense fallback={null}>
        <WelcomePageView />
      </Suspense>
    </>
  );
}
