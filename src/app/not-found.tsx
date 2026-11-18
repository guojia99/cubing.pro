"use client";

import { Box, Button, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Surface } from "@/components/ui/page";
import { useI18n } from "@/contexts/I18nProvider";
import { translateShell } from "@/i18n/messages/shell";

export default function NotFound() {
  const { locale } = useI18n();
  return (
      <AppShell>
        <Box textAlign="center" py={{ base: 12, md: 20 }}>
          <Surface maxW="40rem" mx="auto" py="12">
          <Stack gap="4" align="center">
            <Text fontSize="5xl" color="accent" fontWeight="semibold">404</Text>
            <PageHeader title={translateShell(locale, "shell.notFound.title")} description={translateShell(locale, "shell.notFound.description")} />
            <Button asChild colorPalette="brand">
              <NextLink href="/">{translateShell(locale, "shell.home")}</NextLink>
            </Button>
          </Stack>
          </Surface>
        </Box>
      </AppShell>
  );
}
