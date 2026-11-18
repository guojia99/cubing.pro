"use client";

import { Button, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useI18n } from "@/contexts/I18nProvider";
import { Surface } from "@/components/ui/page";

export function NotFoundStatus({ title }: { title: string }) {
  const { t } = useI18n();
  return (
    <Surface py={{ base: "10", md: "16" }}>
      <Stack align="center" gap="5" textAlign="center">
        <Text fontSize="4xl" color="accent" fontWeight="semibold">404</Text>
        <Text as="h1" fontSize="xl" fontWeight="semibold">{title}</Text>
        <Button asChild variant="outline"><NextLink href="/">{t("nav.home")}</NextLink></Button>
      </Stack>
    </Surface>
  );
}
