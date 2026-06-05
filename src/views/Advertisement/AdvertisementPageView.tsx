"use client";

import { EmptyState } from "@chakra-ui/react";
import { useSearchParams } from "next/navigation";

import { useI18n } from "@/contexts/I18nProvider";
import { getAdByKey } from "@/views/Advertisement/config";

export function AdvertisementPageView() {
  const searchParams = useSearchParams();
  const key = searchParams?.get("key") || "";
  const { t, tf } = useI18n();
  const ad = getAdByKey(key);

  if (!ad) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Title>{t("advertisement.notFound")}</EmptyState.Title>
          <EmptyState.Description>
            {tf("advertisement.notFoundDesc", { key: key || "(empty)" })}
          </EmptyState.Description>
        </EmptyState.Content>
      </EmptyState.Root>
    );
  }

  const FullContent = ad.FullContent;

  return <FullContent />;
}
