import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthCallbackPage } from "@/views/admin/AuthCallbackPage";

export const metadata: Metadata = {
  title: "登录回调",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackPage />
    </Suspense>
  );
}
