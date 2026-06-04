"use client";

import { Grid, Heading, Spinner, Text, VStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import { Auth, hasAuth, isLoggedIn } from "@/lib/auth";
import { getToken } from "@/services/cubing-pro/auth/token";
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
      void refreshUser();
      return;
    }
    router.replace(`/login?redirect=${encodeURIComponent("/user/profile")}`);
  }, [currentUser?.id, loading, refreshUser, router]);

  if (loading) {
    return <Spinner size="lg" color="brand.solid" />;
  }

  if (!currentUser || !isLoggedIn(currentUser.id)) {
    if (getToken()?.token) {
      return <Spinner size="lg" color="brand.solid" />;
    }
    return <Text color="fg.muted">{t("auth.needLogin")}</Text>;
  }

  if (!hasAuth(currentUser.Auth, Auth.AuthPlayer)) {
    return <Text color="fg.muted">{t("auth.noPermission")}</Text>;
  }

  return (
    <VStack align="stretch" gap="6">
      <Heading size="xl">{t("profile.title")}</Heading>
      <Grid templateColumns={{ base: "1fr", lg: "320px 1fr" }} gap="6">
        <ProfileAvatar user={currentUser} onUpdated={() => void refreshUser()} />
        <ProfileUserInfo
          initialUser={currentUser}
          onUpdated={() => void refreshUser()}
        />
      </Grid>
    </VStack>
  );
}
