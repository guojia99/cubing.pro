"use client";

import { Menu, Portal } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import { Auth, hasAuth, isLoggedIn } from "@/lib/auth";
import { wcaPersonUrl } from "@/lib/avatar";
import { logout } from "@/services/cubing-pro/auth/auth";

export function UserMenu({ children }: { children: ReactNode }) {
  const { currentUser, setCurrentUser } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const loggedIn = isLoggedIn(currentUser?.id);
  const auth = currentUser?.Auth ?? 0;

  const handleSelect = async (key: string) => {
    if (key === "logout") {
      await logout();
      setCurrentUser(null);
      router.push("/login");
      return;
    }
    if (key === "login") {
      router.push("/login");
      return;
    }
    if (key === "wca") {
      const id = currentUser?.WcaID?.trim();
      if (id) window.open(wcaPersonUrl(id), "_blank", "noopener,noreferrer");
      return;
    }
    router.push(`/${key}`);
  };

  if (!loggedIn) {
    return <>{children}</>;
  }

  const items: { key: string; label: string; divider?: boolean }[] = [];

  if (currentUser?.CubeID) {
    items.push({ key: `player/${currentUser.CubeID}`, label: t("user.myHome") });
  }
  items.push({ key: "user/profile", label: t("user.profile") });
  if (currentUser?.WcaID?.trim()) {
    items.push({ key: "wca", label: t("user.wcaProfile") });
  }
  items.push({ key: "user/kv-data", label: t("user.kvData") });
  items.push({ key: "_d1", label: "", divider: true });

  if (hasAuth(auth, Auth.AuthOrganizers)) {
    items.push({ key: "admin/organizers", label: t("user.organizers") });
  }
  if (hasAuth(auth, Auth.AuthAdmin) || hasAuth(auth, Auth.AuthSuperAdmin)) {
    items.push({ key: "admin/admins", label: t("user.admins") });
  }
  if (items.some((i) => i.key.startsWith("admin/"))) {
    items.push({ key: "_d2", label: "", divider: true });
  }

  items.push({ key: "settings", label: t("user.settings") });
  items.push({ key: "logout", label: t("user.logout") });

  return (
    <Menu.Root positioning={{ placement: "bottom-end" }}>
      <Menu.Trigger asChild>{children}</Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="48">
            {items.map((item) =>
              item.divider ? (
                <Menu.Separator key={item.key} />
              ) : (
                <Menu.Item
                  key={item.key}
                  value={item.key}
                  onClick={() => void handleSelect(item.key)}
                >
                  {item.label}
                </Menu.Item>
              ),
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
