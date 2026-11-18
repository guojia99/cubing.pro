"use client";

import { Box, Button, Image } from "@chakra-ui/react";
import { PageHeader, Surface } from "@/components/ui/page";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import { isLoggedIn } from "@/lib/auth";
import { getWcaLoginUrl } from "@/services/cubing-pro/auth/auth";

export function LoginPage() {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect");

  useEffect(() => {
    if (isLoggedIn(currentUser?.id)) {
      router.replace(redirect || "/user/profile");
    }
  }, [currentUser?.id, redirect, router]);

  const handleWcaLogin = () => {
    const nextPath = redirect || "/user/profile";
    const nextParam = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`;
    window.location.href = getWcaLoginUrl(callbackUrl);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minH="50vh"
      py="12"
      px="4"
    >
      <Surface display="flex" flexDirection="column" alignItems="center" gap="6" w="full" maxW="lg" p={{ base: "6", md: "10" }}>
        <Image
          src="/images/wca.svg"
          alt="WCA"
          w="24"
          h="24"
          objectFit="contain"
        />
        <PageHeader eyebrow="CUBING PRO" title={t("auth.loginTitle")} description={t("auth.loginHint")} />
        <Button
          size="lg"
          w="full"
          bg="var(--accent)"
          color="var(--accent-foreground)"
          _hover={{ filter: "brightness(1.08)" }}
          onClick={handleWcaLogin}
        >
          {t("auth.loginButton")}
        </Button>
      </Surface>
    </Box>
  );
}
