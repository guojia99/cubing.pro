"use client";
import { useAdminManagement } from "@/views/admin/useAdminManagement";
import { useI18n } from "@/contexts/I18nProvider";

import { Text } from "@chakra-ui/react";
import { PageHeader, Surface } from "@/components/ui/page";

export function OrganizersListPageView() {
  const m = useAdminManagement();
  const { t } = useI18n();
  return <><PageHeader eyebrow={t("competitionAdmin.organizerWorkspace")} title={m("adminManagement.organizerList")} /><Surface p="6"><Text color="var(--muted-foreground)">{m("adminManagement.organizerListDevelopment")}</Text></Surface></>;
}
