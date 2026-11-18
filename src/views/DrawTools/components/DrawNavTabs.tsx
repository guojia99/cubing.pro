"use client";

import { Box, Tabs } from "@chakra-ui/react";
import { PageHeader } from "@/components/ui/page";
import { useI18n } from "@/contexts/I18nProvider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

export type DrawTabItem = {
  key: string;
  label: ReactNode;
  content: ReactNode;
};

export function DrawNavTabs({
  tabsKey,
  items,
  title,
  description,
}: {
  tabsKey: string;
  items: DrawTabItem[];
  title: ReactNode;
  description?: ReactNode;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const active = searchParams?.get(tabsKey) ?? items[0]?.key ?? "";

  return (
    <Box maxW="1440px" mx="auto" py={{ base: 4, md: 8 }} minW="0">
    <PageHeader eyebrow={t("nav.tools.draw")} title={title} description={description} />
    <Tabs.Root
      value={active}
      onValueChange={(details) => {
        const params = new URLSearchParams(searchParams?.toString() ?? "");
        params.set(tabsKey, details.value);
        router.replace(`${pathname}?${params.toString()}`);
      }}
      variant="plain"
      colorPalette="brand"
      minW="0"
      lazyMount
      unmountOnExit
    >
      <Tabs.List flexWrap="wrap" gap="2" bg="bg.elevated" borderWidth="1px" borderColor="border" borderRadius="var(--radius-card)" p="2" mb="2" boxShadow="var(--shadow-card)">
        {items.map((item) => (
          <Tabs.Trigger key={item.key} value={item.key} fontSize="sm" px="4" py="2" minH="44px" borderRadius="12px" flex={{ base: "1 1 auto", md: "0 1 auto" }} whiteSpace="normal" _selected={{ bg: "accent.soft", color: "accent", fontWeight: "semibold" }}>
            {item.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {items.map((item) => (
        <Tabs.Content key={item.key} value={item.key} pt="4" minW="0">
          {item.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
    </Box>
  );
}
