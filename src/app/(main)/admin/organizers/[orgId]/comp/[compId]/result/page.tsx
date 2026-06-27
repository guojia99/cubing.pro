import type { Metadata } from "next";
import { Suspense } from "react";

import { matchRoute } from "@/config/routes";
import { OrganizersResultsPageView } from "@/views/admin/OrganizersResultsPageView";

export const dynamic = "force-static";

export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

interface OrganizersResultPageProps {
  params: Promise<{ orgId: string; compId: string }>;
}

export async function generateMetadata({ params }: OrganizersResultPageProps): Promise<Metadata> {
  const { orgId, compId } = await params;
  const route = matchRoute(`/admin/organizers/${orgId}/comp/${compId}/result`);
  return {
    title: route?.name ?? "录入成绩",
  };
}

export default async function OrganizersResultPage({ params }: OrganizersResultPageProps) {
  const { orgId, compId } = await params;

  return (
    <Suspense fallback={null}>
      <OrganizersResultsPageView orgId={orgId} compId={compId} />
    </Suspense>
  );
}
