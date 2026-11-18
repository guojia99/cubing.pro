"use client";

import { Box } from "@chakra-ui/react";
import { PageHeader } from "@/components/ui/page";
import type { ReactNode } from "react";
import "./groupCompetition.css";
import { useI18n } from "@/contexts/I18nProvider";

export function GroupCompetitionShell({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  const { t } = useI18n();
  return <Box className="group-competition" maxW="1440px" mx="auto" w="full">
    <PageHeader eyebrow={t('competitionAdmin.competitionManagement')} title={title} description={description} />
    {children}
  </Box>;
}
