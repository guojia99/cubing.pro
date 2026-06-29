"use client";

import { Tabs } from "@chakra-ui/react";
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
}: {
  tabsKey: string;
  items: DrawTabItem[];
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const active = searchParams?.get(tabsKey) ?? items[0]?.key ?? "";

  return (
    <Tabs.Root
      value={active}
      onValueChange={(details) => {
        const params = new URLSearchParams(searchParams?.toString() ?? "");
        params.set(tabsKey, details.value);
        router.replace(`${pathname}?${params.toString()}`);
      }}
      variant="line"
      lazyMount
      unmountOnExit
    >
      <Tabs.List flexWrap="wrap" gap="1">
        {items.map((item) => (
          <Tabs.Trigger key={item.key} value={item.key} fontSize="xs" px="3" py="1.5" minH="28px">
            {item.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {items.map((item) => (
        <Tabs.Content key={item.key} value={item.key} pt="4">
          {item.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
