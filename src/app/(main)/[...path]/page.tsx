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
import { AdminExternalLinksPageView } from "@/views/admin/AdminExternalLinksPageView";
import { AdminHomePageView } from "@/views/admin/AdminHomePageView";
import { MinxDrawView } from "@/views/DrawTools/MinxDrawView";
import { PyDrawView } from "@/views/DrawTools/PyDrawView";
import { SkDrawView } from "@/views/DrawTools/SkDrawView";
import { SQ1DrawView } from "@/views/DrawTools/SQ1DrawView";
import { ChangelogPageView } from "@/views/Changelog/ChangelogPageView";
import { CocktailDetailView } from "@/views/Cocktails/CocktailDetailView";
import { CocktailListView } from "@/views/Cocktails/CocktailListView";
import { KitchenSkillDetailView } from "@/views/KitchenSkills/KitchenSkillDetailView";
import { KitchenSkillListView } from "@/views/KitchenSkills/KitchenSkillListView";
import { RecipeDetailView } from "@/views/Recipes/RecipeDetailView";
import { RecipeListView } from "@/views/Recipes/RecipeListView";
import { WcaPlayersSearchView } from "@/views/Wca/WcaPlayersSearchView";

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
    case "draw-sq1":
      return <SQ1DrawView />;
    case "draw-minx":
      return <MinxDrawView />;
    case "draw-sk":
      return <SkDrawView />;
    case "draw-py":
      return <PyDrawView />;
    case "changelog":
      return <ChangelogPageView />;
    case "wca-players":
      return <WcaPlayersSearchView />;
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
