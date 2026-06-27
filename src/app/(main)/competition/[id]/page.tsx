import type { Metadata } from "next";
import { Suspense } from "react";

import { matchRoute } from "@/config/routes";
import { getCompetitionStaticParams } from "@/lib/staticExportPaths";
import { CompetitionView } from "@/views/Competition/CompetitionView";

export const dynamic = "force-static";

/** `build:static` 前由 scripts/prepare-static-export.mjs 改为 false */
export const dynamicParams = true;

export async function generateStaticParams() {
  return getCompetitionStaticParams();
}

interface CompetitionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CompetitionPageProps): Promise<Metadata> {
  const { id } = await params;
  const route = matchRoute(`/competition/${id}`);
  return {
    title: route?.name ?? "赛事详情",
  };
}

export default function CompetitionPage() {
  return (
    <Suspense fallback={null}>
      <CompetitionView />
    </Suspense>
  );
}
