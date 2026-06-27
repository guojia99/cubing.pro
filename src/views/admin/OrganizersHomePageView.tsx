"use client";

import { Heading, Stack, VStack } from "@chakra-ui/react";

import { AdminNavCards } from "@/components/admin/AdminNavCards";
import { OrganizersGuard } from "@/components/admin/OrganizersGuard";
import { useI18n } from "@/contexts/I18nProvider";

export function OrganizersHomePageView() {
  const { t } = useI18n();

  return (
    <OrganizersGuard>
      <VStack align="stretch" gap="6">
        <Stack gap="1">
          <Heading size="xl">{t("nav.admin.organizers")}</Heading>
        </Stack>
        <AdminNavCards
          groups={[
            {
              title: "比赛管理",
              children: [
                {
                  title: "比赛列表",
                  description: "展示你的比赛列表，进行操作等",
                  to: "/admin/organizers/comps",
                  avatar: "📋",
                },
                {
                  title: "创建比赛",
                  description: "新建一个比赛",
                  to: "/admin/organizers/comps/create",
                  avatar: "➕",
                },
              ],
            },
          ]}
        />
      </VStack>
    </OrganizersGuard>
  );
}
