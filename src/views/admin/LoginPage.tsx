"use client";

import { Box, Button, Heading, Image, Text, VStack } from "@chakra-ui/react";
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
      <VStack gap="6" maxW="md" textAlign="center">
        <Image
          src="/WCA%20Logo.svg"
          alt="WCA"
          w="40"
          h="40"
          objectFit="contain"
        />
        <Heading size="lg" fontWeight="medium">
          {t("auth.loginTitle")}
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          {t("auth.loginHint")}
        </Text>
        <Button
          size="lg"
          colorPalette="green"
          bg="signal.success"
          _hover={{ bg: "accent.emphasis" }}
          onClick={handleWcaLogin}
        >
          {t("auth.loginButton")}
        </Button>
      </VStack>
    </Box>
  );
}
