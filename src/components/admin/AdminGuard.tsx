"use client";

import { Button, Spinner, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { Surface } from "@/components/ui/page";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import { Auth, hasAnyAuth, isLoggedIn } from "@/lib/auth";
import { getToken, removeToken } from "@/services/cubing-pro/auth/token";

export function AdminGuard({
  children,
  required = [Auth.AuthAdmin, Auth.AuthSuperAdmin],
}: {
  children: ReactNode;
  required?: Auth[];
}) {
  const { t } = useI18n();
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (isLoggedIn(currentUser?.id)) return;
    if (getToken()?.token) {
      removeToken();
    }
    router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)}`);
  }, [currentUser?.id, loading, router]);

  if (loading) {
    return <Surface py="12" textAlign="center"><Spinner size="lg" color="brand.solid" /></Surface>;
  }

  if (!currentUser || !isLoggedIn(currentUser.id)) {
    return <Surface py="12" textAlign="center"><Text color="fg.muted" role="status">{t("auth.needLogin")}</Text></Surface>;
  }

  if (!hasAnyAuth(currentUser.Auth, required)) {
    return <Surface py="12"><Stack gap="5" align="center"><Text color="fg.muted" role="status">{t("auth.noPermission")}</Text><Button asChild variant="outline"><NextLink href="/">{t("nav.home")}</NextLink></Button></Stack></Surface>;
  }

  return children;
}
