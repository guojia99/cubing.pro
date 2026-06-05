import type { Metadata } from "next";
import { Suspense } from "react";

import { WelcomePageView } from "@/views/Welcome/WelcomePageView";

export const metadata: Metadata = {
  title: "欢迎",
};

export default function WelcomePage() {
  return (
    <Suspense fallback={null}>
      <WelcomePageView />
    </Suspense>
  );
}
