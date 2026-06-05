"use client";

import { Spinner, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import { Auth, hasAnyAuth, isLoggedIn } from "@/lib/auth";
import { getToken } from "@/services/cubing-pro/auth/token";

export function AdminGuard({
  children,
  required = [Auth.AuthAdmin, Auth.AuthSuperAdmin],
}: {
  children: ReactNode;
  required?: Auth[];
}) {
  const { t } = useI18n();
  const { currentUser, loading, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (isLoggedIn(currentUser?.id) && hasAnyAuth(currentUser?.Auth ?? 0, required)) return;
    if (getToken()?.token) {
      void refreshUser();
      return;
    }
    router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  }, [currentUser, loading, refreshUser, required, router]);

  if (loading) {
    return <Spinner size="lg" color="brand.solid" />;
  }

  if (!currentUser || !isLoggedIn(currentUser.id)) {
    if (getToken()?.token) return <Spinner size="lg" color="brand.solid" />;
    return <Text color="fg.muted">{t("auth.needLogin")}</Text>;
  }

  if (!hasAnyAuth(currentUser.Auth, required)) {
    return <Text color="fg.muted">{t("auth.noPermission")}</Text>;
  }

  return children;
}
