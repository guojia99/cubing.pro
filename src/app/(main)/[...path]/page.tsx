import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlaceholderPage } from "@/components/pages/PlaceholderPage";
import { matchRoute } from "@/config/routes";
import { getAllCatchAllStaticParams } from "@/lib/staticExportPaths";
import { AlgsListView } from "@/views/Algs/AlgsListView";
import { AlgsDetailView } from "@/views/Algs/AlgsDetailView";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getAllCatchAllStaticParams();
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

  if (route.id === "algs-list") {
    return <AlgsListView />;
  }

  if (route.id === "algs-detail" && path.length >= 3) {
    const cube = path[1];
    const classId = decodeURIComponent(path.slice(2).join("/"));
    return <AlgsDetailView cube={cube} classId={classId} />;
  }

  return <PlaceholderPage route={route} />;
}
