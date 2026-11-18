"use client";

import { Badge, Button, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { FiCompass } from "react-icons/fi";
import { PageHeader, Surface } from "@/components/ui/page";
import { useI18n } from "@/contexts/I18nProvider";
import { getShellRouteKey, translateShell } from "@/i18n/messages/shell";

import type { AppRoute } from "@/config/routes";

interface PlaceholderPageProps {
  route: AppRoute;
}

export function PlaceholderPage({ route }: PlaceholderPageProps) {
  const { locale } = useI18n();
  const routeKey = getShellRouteKey(route.id);
  return (
    <Stack gap="5" maxW="var(--page-max)" mx="auto" w="full">
      <PageHeader eyebrow="CUBING PRO" title={routeKey ? translateShell(locale, routeKey) : route.name} />
      <Surface p={{ base: "6", md: "10" }}>
      <Stack gap="4" align="center" textAlign="center">
        <Text fontSize="4xl" color="accent" aria-hidden="true"><FiCompass /></Text>
        <Badge colorPalette="brand" size="lg" variant="subtle">
          {translateShell(locale, "shell.placeholder.badge")}
        </Badge>
        <Text color="fg.muted" maxW="md">
          {translateShell(locale, "shell.placeholder.description")}
        </Text>
        <Stack direction={{ base: "column", sm: "row" }} gap="2" w={{ base: "full", sm: "auto" }}>
          <Button asChild colorPalette="brand"><NextLink href="/algs">{translateShell(locale, "shell.algorithms")}</NextLink></Button>
          <Button asChild variant="outline"><NextLink href="/welcome">{translateShell(locale, "shell.home")}</NextLink></Button>
        </Stack>
      </Stack>
      </Surface>
    </Stack>
  );
}
