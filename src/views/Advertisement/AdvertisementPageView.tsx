"use client";

import { Button, EmptyState, Stack } from "@chakra-ui/react";
import NextLink from "next/link";
import { PageHeader, Surface } from "@/components/ui/page";
import { useSearchParams } from "next/navigation";

import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";
import { getAdByKey } from "@/views/Advertisement/config";

export function AdvertisementPageView() {
  const searchParams = useSearchParams();
  const key = searchParams?.get("key") || "";
  const { t, tf, locale } = useI18n();
  const sc = getSiteContent(locale);
  const ad = getAdByKey(key);

  if (!ad) {
    return (
      <Stack gap="5" maxW="var(--page-max)" w="full" mx="auto">
      <PageHeader eyebrow={sc("siteContent.partners")} title={sc("siteContent.community")} />
      <Surface p={{ base: "4", md: "6" }}><EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Title>{t("advertisement.notFound")}</EmptyState.Title>
          <EmptyState.Description>
            {tf("advertisement.notFoundDesc", { key: key || sc("siteContent.emptyKey") })}
          </EmptyState.Description>
          <Button asChild variant="outline" size="sm"><NextLink href="/welcome">{t("nav.home")}</NextLink></Button>
        </EmptyState.Content>
      </EmptyState.Root></Surface>
      </Stack>
    );
  }

  const FullContent = ad.FullContent;

  return (
    <Stack gap="5" maxW="var(--page-max)" w="full" mx="auto">
      <PageHeader eyebrow={sc("siteContent.partners")} title={key === "contact" ? t("advertisement.contactTitle") : sc("siteContent.cuberwenjun")} actions={<Button asChild variant="outline" size="sm"><NextLink href="/welcome">{t("nav.home")}</NextLink></Button>} />
      <FullContent />
    </Stack>
  );
}
