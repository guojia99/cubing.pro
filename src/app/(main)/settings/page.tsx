import type { Metadata } from "next";

import { ExportPathMarker } from "@/components/routing/ExportPathMarker";
import { getDefaultMetadata } from "@/lib/defaultMetadata";
import { SettingsPage } from "@/views/SettingsPage";

export const metadata: Metadata = getDefaultMetadata("settings");

export default function Page() {
  return (
    <>
      <ExportPathMarker path="/settings" />
      <SettingsPage />
    </>
  );
}
