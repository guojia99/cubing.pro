"use client";

import type { ReactNode } from "react";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { Auth } from "@/lib/auth";

export function OrganizersGuard({ children }: { children: ReactNode }) {
  return (
    <AdminGuard required={[Auth.AuthOrganizers, Auth.AuthAdmin, Auth.AuthSuperAdmin]}>
      {children}
    </AdminGuard>
  );
}
