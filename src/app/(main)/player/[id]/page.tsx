import type { Metadata } from "next";
import { Suspense } from "react";

import { matchRoute } from "@/config/routes";
import { ExportPathMarker } from "@/components/routing/ExportPathMarker";
import { getGcPlayerStaticParams } from "@/lib/staticExportPaths";
import { GcPlayerView } from "@/views/GroupCompetitions/Player/GcPlayerView";

export const dynamic = "force-static";

/** `build:static` 前由 scripts/prepare-static-export.mjs 改为 false */
export const dynamicParams = true;

export async function generateStaticParams() {
  return getGcPlayerStaticParams();
}

interface GcPlayerPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: GcPlayerPageProps): Promise<Metadata> {
  const { id } = await params;
  const route = matchRoute(`/player/${id}`);
  return {
    title: route?.name ?? "站内选手",
  };
}

export default async function GcPlayerPage({ params }: GcPlayerPageProps) {
  const { id } = await params;

  return (
    <>
      <ExportPathMarker path={`/player/${id}`} />
      <Suspense fallback={null}>
        <GcPlayerView />
      </Suspense>
    </>
  );
}
