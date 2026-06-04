"use client";

import { Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { useI18n } from "@/contexts/I18nProvider";

export function BrandLogo() {
  const { t } = useI18n();

  return (
    <Text
      asChild
      fontWeight="bold"
      fontSize={{ base: "lg", md: "xl" }}
      lineHeight="1.2"
      color="fg"
      letterSpacing="-0.02em"
      flexShrink={0}
    >
      <NextLink href="/welcome">{t("app.name")}</NextLink>
    </Text>
  );
}
