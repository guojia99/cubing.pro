import type { Metadata } from "next";
import { Suspense } from "react";

import { matchRoute } from "@/config/routes";
import { getWcaPlayerStaticParams } from "@/lib/staticExportPaths";
import { WcaPlayerView } from "@/views/Wca/WcaPlayerView";

export const dynamic = "force-static";

/** `build:static` 前由 scripts/prepare-static-export.mjs 改为 false */
export const dynamicParams = true;

export async function generateStaticParams() {
  return getWcaPlayerStaticParams();
}

interface WcaPlayerPageProps {
  params: Promise<{ wcaId: string }>;
}

export async function generateMetadata({
  params,
}: WcaPlayerPageProps): Promise<Metadata> {
  const { wcaId } = await params;
  const route = matchRoute(`/wca/player/${wcaId}`);
  return {
    title: route?.name ?? "WCA 选手",
  };
}

export default function WcaPlayerPage() {
  return (
    <Suspense fallback={null}>
      <WcaPlayerView />
    </Suspense>
  );
}
