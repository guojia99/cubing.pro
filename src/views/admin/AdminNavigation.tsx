"use client";

import { Box, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import type { AdminNavGroup } from "@/components/admin/AdminNavCards";
import { FeatureLink, SectionHeader, Surface } from "@/components/ui/page";
import { useI18n } from "@/contexts/I18nProvider";

export function AdminNavigation({ groups }: { groups: AdminNavGroup[] }) {
  const { t } = useI18n();
  return <Stack gap="8">
    {groups.map((group) => <Box as="section" key={group.title}>
      <SectionHeader title={group.title} />
      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="4">
        {group.children.map((item) => item.to && !item.disabled ? (
          <FeatureLink key={item.title} href={item.to} title={item.title} description={item.description} icon={item.avatar} />
        ) : (
          <Surface key={item.title} p="5" opacity={0.6} aria-disabled="true">
            <Text fontSize="sm" color="var(--muted-foreground)" mb="3">{t("competitionAdmin.development")}</Text>
            <Text fontWeight="semibold" mb="2">{item.title}</Text>
            <Text fontSize="sm" color="var(--muted-foreground)">{item.description}</Text>
          </Surface>
        ))}
      </SimpleGrid>
    </Box>)}
  </Stack>;
}
