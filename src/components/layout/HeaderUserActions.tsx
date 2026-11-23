"use client";

import { Avatar, Box, Button, HStack, Skeleton, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { LuLogIn } from "react-icons/lu";

import { UserMenu } from "@/components/auth/UserMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NAV_FONT_SIZE } from "@/components/layout/navStyles";
import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import { resolveAvatarUrl } from "@/lib/avatar";
import { isLoggedIn } from "@/lib/auth";

export function HeaderUserActions() {
  const { currentUser, loading } = useAuth();
  const { t } = useI18n();

  if (loading) {
    return <Skeleton boxSize="8" borderRadius="full" />;
  }

  if (!isLoggedIn(currentUser?.id)) {
    return (
      <HStack gap={{ base: "0", md: "1" }}>
      <NotificationBell />
      <Button asChild size="sm" fontSize={NAV_FONT_SIZE} colorPalette="brand" variant="solid" borderRadius="lg" minW={{ base: "9", md: "auto" }} px={{ base: "0", md: "4" }}>
        <NextLink href="/login" aria-label={t("user.login")}>
          <Box as="span" display={{ base: "inline-flex", md: "none" }} aria-hidden="true"><LuLogIn size={18} /></Box>
          <Text as="span" display={{ base: "none", md: "inline" }}>{t("user.login")}</Text>
        </NextLink>
      </Button>
      </HStack>
    );
  }

  const avatarSrc = resolveAvatarUrl(currentUser?.Avatar);

  return (
    <HStack gap={{ base: "0", md: "1" }}>
    <NotificationBell />
    <UserMenu>
      <Button
        aria-label={currentUser?.Name || t("user.profile")}
        variant="ghost"
        size="sm"
        gap="2"
        borderRadius="lg"
        px="1"
        minW="9"
        _hover={{ bg: "bg.muted" }}
      >
        <Text
          fontWeight="semibold"
          fontSize={NAV_FONT_SIZE}
          lineClamp={1}
          display={{ base: "none", "2xl": "block" }}
          maxW="24"
        >
          {currentUser?.Name}
        </Text>
        <Avatar.Root size="sm" flexShrink={0}>
          {avatarSrc ? (
            <Avatar.Image src={avatarSrc} alt={currentUser?.Name} />
          ) : null}
          <Avatar.Fallback name={currentUser?.Name ?? "U"} />
        </Avatar.Root>
      </Button>
    </UserMenu>
    </HStack>
  );
}
