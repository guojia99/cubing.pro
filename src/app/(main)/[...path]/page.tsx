import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PlaceholderPage } from "@/components/pages/PlaceholderPage";
import { matchRoute } from "@/config/routes";
import { getAllCatchAllStaticParams } from "@/lib/staticExportPaths";
import { AlgsListView } from "@/views/Algs/AlgsListView";
import { AlgsDetailView } from "@/views/Algs/AlgsDetailView";
import { AdvertisementPageView } from "@/views/Advertisement/AdvertisementPageView";
import { BuyCoffeePageView } from "@/views/BuyCoffee/BuyCoffeePageView";
import { ExternalLinksPageView } from "@/views/ExternalLinks/ExternalLinksPageView";
import { AdminAcknowledgmentsPageView } from "@/views/admin/AdminAcknowledgmentsPageView";
import { AdminCompetitionGroupsPageView } from "@/views/admin/AdminCompetitionGroupsPageView";
import { AdminDiyRankingPageView } from "@/views/admin/AdminDiyRankingPageView";
import { AdminExternalLinksPageView } from "@/views/admin/AdminExternalLinksPageView";
import { AdminHomePageView } from "@/views/admin/AdminHomePageView";
import { AdminOrganizersPageView } from "@/views/admin/AdminOrganizersPageView";
import { AdminUsersPageView } from "@/views/admin/AdminUsersPageView";
import { OrganizersCompsPageView } from "@/views/admin/OrganizersCompsPageView";
import { OrganizersCreateCompsPageView } from "@/views/admin/OrganizersCreateCompsPageView";
import { OrganizersDetailsPageView } from "@/views/admin/OrganizersDetailsPageView";
import { OrganizersGroupPageView } from "@/views/admin/OrganizersGroupPageView";
import { OrganizersHomePageView } from "@/views/admin/OrganizersHomePageView";
import { OrganizersListPageView } from "@/views/admin/OrganizersListPageView";
import { OrganizersResultsPageView } from "@/views/admin/OrganizersResultsPageView";
import { MinxDrawView } from "@/views/DrawTools/MinxDrawView";
import { PyDrawView } from "@/views/DrawTools/PyDrawView";
import { SkDrawView } from "@/views/DrawTools/SkDrawView";
import { SQ1DrawView } from "@/views/DrawTools/SQ1DrawView";
import { FloppyReductionView } from "@/views/FloppyReduction/FloppyReductionView";
import { TeamMatchView } from "@/views/TeamMatch/TeamMatchView";
import { ChangelogPageView } from "@/views/Changelog/ChangelogPageView";
import { CocktailDetailView } from "@/views/Cocktails/CocktailDetailView";
import { CocktailListView } from "@/views/Cocktails/CocktailListView";
import { KitchenSkillDetailView } from "@/views/KitchenSkills/KitchenSkillDetailView";
import { KitchenSkillListView } from "@/views/KitchenSkills/KitchenSkillListView";
import { RecipeDetailView } from "@/views/Recipes/RecipeDetailView";
import { RecipeListView } from "@/views/Recipes/RecipeListView";
import { ProportionEstimationView } from "@/views/Wca/ProportionEstimation";
import { WcaCompsView } from "@/views/Wca/WcaComps/WcaCompsView";
import { WcaPlayersSearchView } from "@/views/Wca/WcaPlayersSearchView";
import { WcaStatisticsView } from "@/views/Wca/Statistics";
import { GcCompetitionsView } from "@/views/GroupCompetitions/Competitions/GcCompetitionsView";
import { GcEventsView } from "@/views/GroupCompetitions/Events/GcEventsView";
import { GcPktimerView } from "@/views/GroupCompetitions/Pktimer/GcPktimerView";
import { GcPlayersView } from "@/views/GroupCompetitions/Players/GcPlayersView";
import { GcRecordsView } from "@/views/GroupCompetitions/Records/GcRecordsView";
import { GcStaticView } from "@/views/GroupCompetitions/Static/GcStaticView";

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

function CatchAllContent({ routeId, path }: { routeId: string; path: string[] }) {
  switch (routeId) {
    case "algs-list":
      return <AlgsListView />;
    case "buy-coffee":
      return <BuyCoffeePageView />;
    case "external-links":
      return <ExternalLinksPageView />;
    case "advertisement":
      return <AdvertisementPageView />;
    case "admin-admins":
      return <AdminHomePageView />;
    case "admin-acknowledgments":
      return <AdminAcknowledgmentsPageView />;
    case "admin-other-links":
      return <AdminExternalLinksPageView />;
    case "admin-users":
      return <AdminUsersPageView />;
    case "admin-manage-organizers":
      return <AdminOrganizersPageView />;
    case "admin-manage-groups":
      return <AdminCompetitionGroupsPageView />;
    case "admin-diy-ranking":
      return <AdminDiyRankingPageView />;
    case "admin-organizers":
      return <OrganizersHomePageView />;
    case "admin-organizers-comps":
      return <OrganizersCompsPageView />;
    case "admin-organizers-create":
      return <OrganizersCreateCompsPageView />;
    case "admin-organizers-details":
      return <OrganizersDetailsPageView />;
    case "admin-organizers-group":
      return <OrganizersGroupPageView />;
    case "admin-organizers-list":
      return <OrganizersListPageView />;
    case "admin-organizers-result":
      return <OrganizersResultsPageView />;
    case "admin-organizers-comp-result":
      if (path.length >= 6) {
        return (
          <OrganizersResultsPageView orgId={path[2]} compId={path[4]} />
        );
      }
      return <OrganizersResultsPageView />;
    case "draw-sq1":
      return <SQ1DrawView />;
    case "draw-minx":
      return <MinxDrawView />;
    case "draw-sk":
      return <SkDrawView />;
    case "draw-py":
      return <PyDrawView />;
    case "tool-fr":
      return <FloppyReductionView />;
    case "tool-team-match":
      return <TeamMatchView />;
    case "changelog":
      return <ChangelogPageView />;
    case "wca-comps":
      return <WcaCompsView />;
    case "wca-players":
      return <WcaPlayersSearchView />;
    case "wca-statistics":
      return <WcaStatisticsView />;
    case "wca-proportion-estimation":
      return <ProportionEstimationView />;
    case "gc-events":
      return <GcEventsView />;
    case "gc-competitions":
      return <GcCompetitionsView />;
    case "gc-players":
      return <GcPlayersView />;
    case "gc-pktimer":
      return <GcPktimerView />;
    case "gc-static":
      return <GcStaticView />;
    case "gc-records":
      return <GcRecordsView />;
    case "recipes":
      return <RecipeListView />;
    case "recipe-detail":
      if (path.length >= 4) {
        return <RecipeDetailView category={path[2]} id={path.slice(3).join("/")} />;
      }
      return null;
    case "kitchen-skills":
      return <KitchenSkillListView />;
    case "kitchen-skill-detail":
      if (path.length >= 4) {
        return <KitchenSkillDetailView category={path[2]} id={path.slice(3).join("/")} />;
      }
      return null;
    case "cocktails":
      return <CocktailListView />;
    case "cocktail-detail":
      if (path.length >= 3) {
        return <CocktailDetailView slug={path.slice(2).join("/")} />;
      }
      return null;
    case "algs-detail":
      if (path.length >= 3) {
        const cube = path[1];
        const classId = decodeURIComponent(path.slice(2).join("/"));
        return <AlgsDetailView cube={cube} classId={classId} />;
      }
      return null;
    default:
      return null;
  }
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { path } = await params;
  const pathname = `/${path.join("/")}`;
  const route = matchRoute(pathname);

  if (!route || route.id === "welcome") {
    notFound();
  }

  const rendered = CatchAllContent({ routeId: route.id, path });

  if (rendered) {
    return <Suspense fallback={null}>{rendered}</Suspense>;
  }

  return <PlaceholderPage route={route} />;
}
