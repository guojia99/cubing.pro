"use client";

import { Grid, Spinner, Text, VStack } from "@chakra-ui/react";
import { PageHeader } from "@/components/ui/page";
import "./admin-ui.css";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import { Auth, hasAuth, isLoggedIn } from "@/lib/auth";
import { getToken, removeToken } from "@/services/cubing-pro/auth/token";
import { ProfileAvatar } from "@/views/admin/ProfileAvatar";
import { ProfileUserInfo } from "@/views/admin/ProfileUserInfo";

export function ProfilePage() {
  const { t } = useI18n();
  const { currentUser, loading, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (isLoggedIn(currentUser?.id)) return;
    if (getToken()?.token) {
      removeToken();
    }
    router.replace(`/login?redirect=${encodeURIComponent("/user/profile")}`);
  }, [currentUser?.id, loading, router]);

  if (loading) {
    return <Spinner size="lg" color="brand.solid" />;
  }

  if (!currentUser || !isLoggedIn(currentUser.id)) {
    return <Text color="fg.muted">{t("auth.needLogin")}</Text>;
  }

  if (!hasAuth(currentUser.Auth, Auth.AuthPlayer)) {
    return <Text color="fg.muted">{t("auth.noPermission")}</Text>;
  }

  return (
    <VStack className="admin-page" align="stretch" gap="6">
      <PageHeader eyebrow={t("profile.infoTitle")} title={t("profile.title")} />
      <Grid templateColumns={{ base: "minmax(0, 1fr)", lg: "320px minmax(0, 1fr)" }} gap="6">
        <ProfileAvatar user={currentUser} onUpdated={() => void refreshUser()} />
        <ProfileUserInfo
          initialUser={currentUser}
          onUpdated={() => void refreshUser()}
        />
      </Grid>
    </VStack>
  );
}
