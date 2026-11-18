"use client";

import { Box, Image } from "@chakra-ui/react";
import NextLink from "next/link";

import { useI18n } from "@/contexts/I18nProvider";

export function BrandLogo() {
  const { t } = useI18n();

  return (
    <Box
      asChild
      display="inline-flex"
      alignItems="center"
      flexShrink={0}
      borderRadius="lg"
      focusVisibleRing="outside"
      focusRingColor="accent"
    >
      <NextLink href="/" aria-label={`${t("app.name")} · ${t("nav.home")}`}>
        <Image
          src="/CubingProLogo.png"
          alt={t("app.name")}
          width={{ base: "96px", sm: "132px", xl: "144px" }}
          height={{ base: "32px", sm: "44px", xl: "48px" }}
          flexShrink={0}
          htmlWidth={2172}
          htmlHeight={724}
          objectFit="contain"
          loading="eager"
          fetchPriority="high"
        />
      </NextLink>
    </Box>
  );
}
