import type { Metadata } from "next";

import { ExportPathMarker } from "@/components/routing/ExportPathMarker";
import { SettingsPage } from "@/views/SettingsPage";

export const metadata: Metadata = {
  title: "设置",
};

export default function Page() {
  return (
    <>
      <ExportPathMarker path="/settings" />
      <SettingsPage />
    </>
  );
}
