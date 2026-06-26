"use client";

import "antd/dist/reset.css";

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
import { Skeleton } from "antd";
import NextLink from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import React, { lazy, Suspense, useEffect, useState } from "react";

import CompetitionScrambles from "@/views/Competition/CompetitionComponents/CompetitionScrambles";

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
      <div style={{ background: "#fafafa", padding: 24 }}>
        <Skeleton active />
      </div>
    );
  }
  return <>{children}</>;
}

export function CompetitionView() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [is404, setIs404] = useState(false);
  const [comp, setComp] = useState<CompAPI.CompResp>();

  useEffect(() => {
    if (!id) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);

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
        setIs404(true);
        setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (comp?.data?.Name && typeof document !== "undefined") {
      document.title = comp.data.Name;
    }
  }, [comp?.data?.Name]);

  const items = [
    {
      key: "detail",
      label: "详情",
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
      label: "规则",
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
      label: "赛果",
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
      label: "打乱",
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

  if (comp?.data.EarliestID !== 0) {
    earliest = (
      <NextLink href={`/competition/${comp?.data.EarliestID}${searchSuffix}`}>
        {"<"} {comp?.data.EarliestName}{" "}
      </NextLink>
    );
  }
  if (comp?.data.LatestID !== 0) {
    latest = (
      <NextLink href={`/competition/${comp?.data.LatestID}${searchSuffix}`}>
        {" "}
        {comp?.data.LatestName} {">"}
      </NextLink>
    );
  }

  if (is404) {
    return <NotFoundStatus title="比赛不存在" />;
  }

  return (
    <>
      <h1 style={{ textAlign: "center" }}>{comp ? comp.data.Name : "比赛加载中"}</h1>
      <NavTabs
        type="line"
        items={items}
        tabsKey="comps_tabs"
        indicator={{ size: (origin: number) => origin - 20, align: "center" }}
      />
      <Pagination Latest={latest} Earliest={earliest} />
    </>
  );
}
