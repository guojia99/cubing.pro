"use client";

import "antd/dist/reset.css";

import { Typography } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { KinCh } from "./Kinsor";

const { Title } = Typography;

export function GcStaticView() {
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
    <>
      <Title level={2} style={{ textAlign: "center", marginBottom: 16 }}>
        成绩统计
      </Title>
      <KinCh isSenior={false} isCountry={false} otherDataFn={undefined} />
    </>
  );
}
