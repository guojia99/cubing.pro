"use client";

import "antd/dist/reset.css";

import { PageHeader } from "@/components/ui/page";
import "../competition-ui.css";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { KinCh } from "./Kinsor";
import { useI18n } from "@/contexts/I18nProvider";


export function GcStaticView() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams?.get("static_tabs");
    if (tab === "records") {
      router.replace("/group-competitions/records");
      return;
    }
    if (tab === "kinch_senior_sor") {
      router.replace("/wca/statistics?tab=wcaKinch");
      return;
    }
    if (tab === "stats") {
      router.replace("/wca/statistics");
      return;
    }
  }, [router, searchParams]);

  return (
    <div className="competition-page">
      <PageHeader eyebrow={t('competitionExtra.statistics')} title={t('competitionExtra.resultStatistics')} />
      <KinCh isSenior={false} isCountry={false} otherDataFn={undefined} />
    </div>
  );
}
