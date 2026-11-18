import { Suspense } from "react";
import type { Metadata } from "next";

import { ExportPathMarker } from "@/components/routing/ExportPathMarker";
import { getDefaultMetadata } from "@/lib/defaultMetadata";
import { LoginPage } from "@/views/admin/LoginPage";

export const metadata: Metadata = getDefaultMetadata("login");

export default function Page() {
  return (
    <>
      <ExportPathMarker path="/login" />
      <Suspense fallback={null}>
        <LoginPage />
      </Suspense>
    </>
  );
}
