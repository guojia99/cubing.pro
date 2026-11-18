"use client";

import { VStack } from "@chakra-ui/react";
import { PageHeader } from "@/components/ui/page";
import "./admin-ui.css";

import { AdminNavigation } from "./AdminNavigation";
import { OrganizersGuard } from "@/components/admin/OrganizersGuard";
import { useI18n } from "@/contexts/I18nProvider";

export function OrganizersHomePageView() {
  const { t } = useI18n();

  return (
    <OrganizersGuard>
      <VStack className="admin-page" align="stretch" gap="6">
        <PageHeader eyebrow={t('competitionAdmin.organizerWorkspace')} title={t("nav.admin.organizers")} />
        <AdminNavigation
          groups={[
            {
              title: t('competitionAdmin.competitionManagement'),
              children: [
                {
                  title: t('competitionAdmin.competitionList'),
                  description: t('competitionAdmin.manageYourCompetitions'),
                  to: "/admin/organizers/comps",
                  avatar: "📋",
                },
                {
                  title: t('competitionAdmin.createCompetition'),
                  description: t('competitionAdmin.createCompetitionHint'),
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
