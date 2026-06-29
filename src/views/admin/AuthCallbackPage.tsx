"use client";

import { Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import { processWcaCallbackToken } from "@/services/cubing-pro/auth/token";

export function AuthCallbackPage() {
  const { t } = useI18n();
  const { refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") || "/user/profile";
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    void (async () => {
      processWcaCallbackToken();
      const user = await refreshUser();
      const targetPath = next.startsWith("/") ? next : `/${next}`;

      if (user) {
        router.replace(targetPath);
        return;
      }

      router.replace(
        `/login?redirect=${encodeURIComponent(targetPath)}`,
      );
    })();
  }, [next, refreshUser, router]);

  return (
    <Center minH="40vh">
      <VStack gap="4">
        <Spinner size="lg" color="brand.solid" />
        <Text color="fg.muted">{t("auth.callbackLoading")}</Text>
      </VStack>
    </Center>
  );
}
