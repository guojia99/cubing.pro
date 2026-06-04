"use client";

import { Avatar, Button, HStack, Skeleton, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { UserMenu } from "@/components/auth/UserMenu";
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
      <Button asChild size="sm" colorPalette="brand" variant="solid">
        <NextLink href="/login">{t("user.login")}</NextLink>
      </Button>
    );
  }

  const avatarSrc = resolveAvatarUrl(currentUser?.Avatar);

  return (
    <UserMenu>
      <HStack
        gap="2"
        cursor="pointer"
        borderRadius="lg"
        px="1"
        py="0.5"
        _hover={{ bg: "bg.muted" }}
      >
        <Text
          fontWeight="semibold"
          fontSize="sm"
          lineClamp={1}
          display={{ base: "none", sm: "block" }}
          maxW="32"
        >
          {currentUser?.Name}
        </Text>
        <Avatar.Root size="sm" flexShrink={0}>
          {avatarSrc ? (
            <Avatar.Image src={avatarSrc} alt={currentUser?.Name} />
          ) : null}
          <Avatar.Fallback name={currentUser?.Name ?? "U"} />
        </Avatar.Root>
      </HStack>
    </UserMenu>
  );
}
