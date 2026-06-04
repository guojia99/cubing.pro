import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlaceholderPage } from "@/components/pages/PlaceholderPage";
import { matchRoute } from "@/config/routes";
import { getCatchAllStaticParams } from "@/lib/staticExportPaths";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getCatchAllStaticParams();
}

interface CatchAllPageProps {
  params: Promise<{ path: string[] }>;
}

export async function generateMetadata({
  params,
}: CatchAllPageProps): Promise<Metadata> {
  const { path } = await params;
  const pathname = `/${path.join("/")}`;
  const route = matchRoute(pathname);
  return {
    title: route?.name ?? "页面",
  };
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { path } = await params;
  const pathname = `/${path.join("/")}`;
  const route = matchRoute(pathname);

  if (!route || route.id === "welcome") {
    notFound();
  }

  return <PlaceholderPage route={route} />;
}
