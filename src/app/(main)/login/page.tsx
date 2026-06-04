import { Suspense } from "react";
import type { Metadata } from "next";

import { LoginPage } from "@/views/admin/LoginPage";

export const metadata: Metadata = {
  title: "WCA 登录",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
