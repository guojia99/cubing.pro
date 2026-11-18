import type { Metadata } from "next";

import { ExportPathMarker } from "@/components/routing/ExportPathMarker";
import { getDefaultMetadata } from "@/lib/defaultMetadata";
import { ProfilePage } from "@/views/admin/ProfilePage";

export const metadata: Metadata = getDefaultMetadata("user-profile");

export default function Page() {
  return (
    <>
      <ExportPathMarker path="/user/profile" />
      <ProfilePage />
    </>
  );
}
