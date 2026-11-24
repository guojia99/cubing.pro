import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PlaceholderPage } from "@/components/pages/PlaceholderPage";
import { ExportPathMarker } from "@/components/routing/ExportPathMarker";
import { matchRoute } from "@/config/routes";
import { getDefaultMetadata } from "@/lib/defaultMetadata";
import { getAllCatchAllStaticParams } from "@/lib/staticExportPaths";
import { FormulaModerationPage, FormulaRepliesPage } from "@/views/Algs/forum/ForumLists";
import { FormulaDiscussionsPage, MyCommentsPage } from "@/views/Algs/forum/PersonalForumLists";
import { NotificationsPage } from "@/views/Notifications/NotificationsPage";
import { AlgsListView } from "@/views/Algs/AlgsListView";
import { AlgsDetailView } from "@/views/Algs/AlgsDetailView";
import { AdvertisementPageView } from "@/views/Advertisement/AdvertisementPageView";
import { BuyCoffeePageView } from "@/views/BuyCoffee/BuyCoffeePageView";
import { ExternalLinksPageView } from "@/views/ExternalLinks/ExternalLinksPageView";
import { AdminAcknowledgmentsPageView } from "@/views/admin/AdminAcknowledgmentsPageView";
import { AdminSiteAnnouncementPageView } from "@/views/admin/AdminSiteAnnouncementPageView";
import { AdminAdvertisementsPageView } from "@/views/admin/AdminAdvertisementsPageView";
import { AdminCompetitionGroupsPageView } from "@/views/admin/AdminCompetitionGroupsPageView";
import { AdminDiyRankingPageView } from "@/views/admin/AdminDiyRankingPageView";
import { AdminExternalLinksPageView } from "@/views/admin/AdminExternalLinksPageView";
import { AdminHomePageView } from "@/views/admin/AdminHomePageView";
import { AdminOrganizersPageView } from "@/views/admin/AdminOrganizersPageView";
import { AdminUsersPageView } from "@/views/admin/AdminUsersPageView";
import { AdminCompetitionApprovalsPageView, OrganizersCompsPageView } from "@/views/admin/OrganizersCompsPageView";
import { OrganizersCreateCompsPageView } from "@/views/admin/OrganizersCreateCompsPageView";
import { OrganizersDetailsPageView } from "@/views/admin/OrganizersDetailsPageView";
import { OrganizersGroupPageView } from "@/views/admin/OrganizersGroupPageView";
import { OrganizersHomePageView } from "@/views/admin/OrganizersHomePageView";
import { OrganizersListPageView } from "@/views/admin/OrganizersListPageView";
import { OrganizersResultsPageView } from "@/views/admin/OrganizersResultsPageView";
import { FtoDrawView } from "@/views/DrawTools/FtoDrawView";
import { MinxDrawView } from "@/views/DrawTools/MinxDrawView";
import { PyDrawView } from "@/views/DrawTools/PyDrawView";
import { SkDrawView } from "@/views/DrawTools/SkDrawView";
import { SQ1DrawView } from "@/views/DrawTools/SQ1DrawView";
import { FloppyReductionView } from "@/views/FloppyReduction/FloppyReductionView";
import TwoSolverView from "@/views/TwoSolver/TwoSolverView";
import { TeamMatchView } from "@/views/TeamMatch/TeamMatchView";
import { ChangelogPageView } from "@/views/Changelog/ChangelogPageView";
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
import { CompetitionView } from "@/views/Competition/CompetitionView";
import { GcPlayerView } from "@/views/GroupCompetitions/Player/GcPlayerView";
import { WcaPlayerView } from "@/views/Wca/WcaPlayerView";

export const dynamic = "force-static";

/** `build:static` 前由 scripts/prepare-static-export.mjs 改为 false */
export const dynamicParams = true;

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
  return getDefaultMetadata(route?.id ?? "");
}

function CatchAllContent({ routeId, path }: { routeId: string; path: string[] }) {
  switch (routeId) {
    case "admin-formula-comments":
      return <FormulaModerationPage />;
    case "user-formula-discussions":
      return <FormulaDiscussionsPage />;
    case "user-comments":
      return <MyCommentsPage />;
    case "user-notifications":
      return <NotificationsPage />;
    case "user-formula-replies":
      return <FormulaRepliesPage />;
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
    case "admin-competition-approvals":
      return <AdminCompetitionApprovalsPageView />;
    case "admin-competition-manage":
      return <OrganizersResultsPageView admin />;
    case "admin-acknowledgments":
      return <AdminAcknowledgmentsPageView />;
    case "admin-site-announcement":
      return <AdminSiteAnnouncementPageView />;
    case "admin-advertisements":
      return <AdminAdvertisementsPageView />;
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
      return <OrganizersResultsPageView />;
    case "draw-sq1":
      return <SQ1DrawView />;
    case "draw-minx":
      return <MinxDrawView />;
    case "draw-sk":
      return <SkDrawView />;
    case "draw-py":
      return <PyDrawView />;
    case "draw-fto":
      return <FtoDrawView />;
    case "tool-fr":
      return <FloppyReductionView />;
    case "tool-two-solver":
      return <TwoSolverView />;
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
    case "competition-detail":
      return <CompetitionView />;
    case "player-detail":
      return <GcPlayerView />;
    case "wca-player":
      return <WcaPlayerView />;
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
    return (
      <>
        <ExportPathMarker path={pathname} />
        <Suspense fallback={null}>{rendered}</Suspense>
      </>
    );
  }

  return (
    <>
      <ExportPathMarker path={pathname} />
      <PlaceholderPage route={route} />
    </>
  );
}
