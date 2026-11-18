"use client";

import "antd/dist/reset.css";
import { useCompetitionPublicI18n } from './i18n';

import Pagination from "@/components/Buttons/pagination_button";
import { NotFoundStatus } from "@/components/Status/NotFoundStatus";
import { NavTabs } from "@/components/Tabs/NavTabs";
import { apiComp } from "@/services/cubing-pro/comps/comp";
import type { CompAPI } from "@/services/cubing-pro/comps/typings";
import { isRequestCanceled } from "@/services/cubing-pro/request";
import {
  BuildOutlined,
  ProductOutlined,
  ProfileOutlined,
  TableOutlined,
} from "@ant-design/icons";
import { Alert, Button, Skeleton } from "antd";
import NextLink from "next/link";
import { useRouteParam } from "@/hooks/useRouteParam";
import { useSearchParams } from "next/navigation";
import React, { lazy, Suspense, useEffect, useState } from "react";

import CompetitionScrambles from "@/views/Competition/CompetitionComponents/CompetitionScrambles";
import { PageHeader } from "@/components/ui/page";
import "./Competition.css";

const CompetitionDetail = lazy(
  () => import("@/views/Competition/CompetitionComponents/CompetitionDetail"),
);
const CompetitionRegulations = lazy(
  () => import("@/views/Competition/CompetitionComponents/CompetitionRegulations"),
);
const CompetitionResults = lazy(
  () => import("@/views/Competition/CompetitionComponents/CompetitionResults"),
);

function TabContent({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  if (loading) {
    return (
      <div style={{ background: "var(--muted)", padding: 24 }}>
        <Skeleton active />
      </div>
    );
  }
  return <>{children}</>;
}

export function CompetitionView() {
  const { t, p } = useCompetitionPublicI18n();
  const id = useRouteParam("id");
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [is404, setIs404] = useState(false);
  const [failed, setFailed] = useState(false);
  const [request, setRequest] = useState(0);
  const [comp, setComp] = useState<CompAPI.CompResp>();

  useEffect(() => {
    if (!id) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    setIs404(false);
    setComp(undefined);

    apiComp(id, { signal: controller.signal })
      .then((value) => {
        setComp(value);
        setIs404(false);
        setLoading(false);
        if (typeof document !== "undefined" && value.data?.Name) {
          document.title = value.data.Name;
        }
      })
      .catch((error) => {
        if (isRequestCanceled(error)) {
          return;
        }
        console.error('Competition load failed', error);
        const notFound = typeof error === 'object' && error !== null && 'response' in error
          && (error.response as { status?: number } | undefined)?.status === 404;
        setIs404(notFound);
        setFailed(!notFound);
        setLoading(false);
      });

    return () => controller.abort();
  }, [id, request]);

  useEffect(() => {
    if (comp?.data?.Name && typeof document !== "undefined") {
      document.title = comp.data.Name;
    }
  }, [comp?.data?.Name]);

  const items = [
    {
      key: "detail",
      label: t("competitionAdmin.details"),
      children: (
        <TabContent loading={loading}>
          <Suspense fallback={<Skeleton active />}>
            <CompetitionDetail comp={comp} />
          </Suspense>
        </TabContent>
      ),
      icon: <ProductOutlined />,
    },
    {
      key: "regulations",
      label: t("competitionAdmin.rules"),
      children: (
        <TabContent loading={loading}>
          <Suspense fallback={<Skeleton active />}>
            <CompetitionRegulations comp={comp} />
          </Suspense>
        </TabContent>
      ),
      icon: <ProfileOutlined />,
    },
    {
      key: "results",
      label: t("competitionAdmin.results"),
      children: (
        <TabContent loading={loading}>
          <Suspense fallback={<Skeleton active />}>
            <CompetitionResults comp={comp} />
          </Suspense>
        </TabContent>
      ),
      icon: <TableOutlined />,
    },
    {
      key: "scrambles",
      label: t("competitionAdmin.scramble"),
      children: (
        <TabContent loading={loading}>
          <CompetitionScrambles comp={comp} />
        </TabContent>
      ),
      icon: <BuildOutlined />,
    },
  ];

  const queryString = searchParams?.toString() ?? '';
  const searchSuffix = queryString ? `?${queryString}` : "";

  let latest: React.ReactNode = null;
  let earliest: React.ReactNode = null;

  if (comp && comp.data.EarliestID !== 0) {
    earliest = (
      <NextLink href={`/competition/${comp?.data.EarliestID}${searchSuffix}`}>
        {"<"} {comp?.data.EarliestName}{" "}
      </NextLink>
    );
  }
  if (comp && comp.data.LatestID !== 0) {
    latest = (
      <NextLink href={`/competition/${comp?.data.LatestID}${searchSuffix}`}>
        {" "}
        {comp?.data.LatestName} {">"}
      </NextLink>
    );
  }

  if (is404) {
    return <NotFoundStatus title={t("competitionAdmin.notFound")} />;
  }

  if (failed) {
    return <Alert type="error" title={p('competitionPublic.competitionFailed')} action={<Button onClick={() => setRequest((n) => n + 1)}>{t('competitionAdmin.retry')}</Button>} />;
  }

  return (
    <div className="competition-workbench">
      <PageHeader title={comp ? comp.data.Name : t("competitionAdmin.loading")} />
      <NavTabs
        type="line"
        items={items}
        tabsKey="comps_tabs"
        indicator={{ size: (origin: number) => origin - 20, align: "center" }}
      />
      <Pagination Latest={latest} Earliest={earliest} />
    </div>
  );
}
