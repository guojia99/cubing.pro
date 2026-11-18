import type { Metadata } from "next";
import { Suspense } from "react";

import { ExportPathMarker } from "@/components/routing/ExportPathMarker";
import { getDefaultMetadata } from "@/lib/defaultMetadata";
import { WelcomePageView } from "@/views/Welcome/WelcomePageView";

export const metadata: Metadata = getDefaultMetadata("welcome");

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
