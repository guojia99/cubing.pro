import { Tag } from "antd";
import type { ReactNode } from "react";

import { Auth, hasAuth } from "@/lib/auth";
import { useI18n } from "@/contexts/I18nProvider";

function AuthLabel({ role }: { role: "superAdmin" | "admin" | "delegate" | "organizer" | "player" }) {
  const { t } = useI18n();
  return t(`competitionAdmin.${role}`);
}

export function authTags(userAuth: number): ReactNode[] {
  const out: ReactNode[] = [];
  if (hasAuth(userAuth, Auth.AuthSuperAdmin)) {
    out.push(
      <Tag key="super" color="orange">
        <AuthLabel role="superAdmin" />
      </Tag>,
    );
  }
  if (hasAuth(userAuth, Auth.AuthAdmin)) {
    out.push(
      <Tag key="admin" color="magenta">
        <AuthLabel role="admin" />
      </Tag>,
    );
  }
  if (hasAuth(userAuth, Auth.AuthDelegates)) {
    out.push(
      <Tag key="delegate" color="gold">
        <AuthLabel role="delegate" />
      </Tag>,
    );
  }
  if (hasAuth(userAuth, Auth.AuthOrganizers)) {
    out.push(
      <Tag key="org" color="purple">
        <AuthLabel role="organizer" />
      </Tag>,
    );
  }
  if (hasAuth(userAuth, Auth.AuthPlayer)) {
    out.push(
      <Tag key="player" color="green">
        <AuthLabel role="player" />
      </Tag>,
    );
  }
  return out;
}
