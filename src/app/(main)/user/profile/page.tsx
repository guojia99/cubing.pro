import type { Metadata } from "next";

import { ExportPathMarker } from "@/components/routing/ExportPathMarker";
import { ProfilePage } from "@/views/admin/ProfilePage";

export const metadata: Metadata = {
  title: "个人中心",
};

export default function Page() {
  return (
    <>
      <ExportPathMarker path="/user/profile" />
      <ProfilePage />
    </>
  );
}
