"use client";

import { Heading, Stack, VStack } from "@chakra-ui/react";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminNavCards } from "@/components/admin/AdminNavCards";
import { useI18n } from "@/contexts/I18nProvider";

export function AdminHomePageView() {
  const { t } = useI18n();

  return (
    <AdminGuard>
      <VStack align="stretch" gap="6">
        <Stack gap="1">
          <Heading size="xl">{t("nav.admin.admins")}</Heading>
        </Stack>
        <AdminNavCards
          groups={[
            {
              title: t("admin.admins.siteManagement"),
              children: [
                {
                  title: t("admin.admins.sponsor"),
                  description: t("admin.admins.sponsorDesc"),
                  to: "/admin/acknowledgments",
                  avatar: "❤️",
                },
                {
                  title: t("externalLinks.title"),
                  description: t("externalLinks.adminCardDesc"),
                  to: "/admin/other-links",
                  avatar: "🔗",
                },
              ],
            },
          ]}
        />
      </VStack>
    </AdminGuard>
  );
}
