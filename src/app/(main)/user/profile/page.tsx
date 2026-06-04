import type { Metadata } from "next";

import { ProfilePage } from "@/views/admin/ProfilePage";

export const metadata: Metadata = {
  title: "个人中心",
};

export default function Page() {
  return <ProfilePage />;
}
