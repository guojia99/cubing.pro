import { Suspense } from "react";
import type { Metadata } from "next";

import { ExportPathMarker } from "@/components/routing/ExportPathMarker";
import { getDefaultMetadata } from "@/lib/defaultMetadata";
import { AuthCallbackPage } from "@/views/admin/AuthCallbackPage";

export const metadata: Metadata = getDefaultMetadata("auth-callback");

export default function Page() {
  return (
    <>
      <ExportPathMarker path="/auth/callback" />
      <Suspense fallback={null}>
        <AuthCallbackPage />
      </Suspense>
    </>
  );
}
