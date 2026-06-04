import type { Metadata } from "next";

import { SettingsPage } from "@/views/SettingsPage";

export const metadata: Metadata = {
  title: "设置",
};

export default function Page() {
  return <SettingsPage />;
}
