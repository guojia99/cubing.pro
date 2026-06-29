import { Suspense } from "react";
import type { Metadata } from "next";

import { ExportPathMarker } from "@/components/routing/ExportPathMarker";
import { AuthCallbackPage } from "@/views/admin/AuthCallbackPage";

export const metadata: Metadata = {
  title: "登录回调",
};

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
