import { Tag } from "antd";
import type { ReactNode } from "react";

import { Auth, hasAuth } from "@/lib/auth";

export function authTags(userAuth: number): ReactNode[] {
  const out: ReactNode[] = [];
  if (hasAuth(userAuth, Auth.AuthSuperAdmin)) {
    out.push(
      <Tag key="super" color="orange">
        超级管理员
      </Tag>,
    );
  }
  if (hasAuth(userAuth, Auth.AuthAdmin)) {
    out.push(
      <Tag key="admin" color="magenta">
        管理员
      </Tag>,
    );
  }
  if (hasAuth(userAuth, Auth.AuthDelegates)) {
    out.push(
      <Tag key="delegate" color="gold">
        代表
      </Tag>,
    );
  }
  if (hasAuth(userAuth, Auth.AuthOrganizers)) {
    out.push(
      <Tag key="org" color="purple">
        主办
      </Tag>,
    );
  }
  if (hasAuth(userAuth, Auth.AuthPlayer)) {
    out.push(
      <Tag key="player" color="green">
        玩家
      </Tag>,
    );
  }
  return out;
}
