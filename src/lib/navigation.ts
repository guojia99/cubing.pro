import type { MessageKey } from "@/i18n";

export interface NavLinkDef {
  labelKey: MessageKey;
  href?: string;
  /** Related detail routes that live outside the navigation link's URL. */
  activePaths?: string[];
  children?: NavLinkDef[];
}

export interface NavGroupDef extends NavLinkDef {
  id: string;
}

export const MAIN_NAV: NavGroupDef[] = [
  { id: "welcome", labelKey: "nav.home", href: "/welcome" },
  { id: "algs", labelKey: "nav.algs", href: "/algs" },
  {
    id: "group-competitions",
    labelKey: "nav.groupCompetitions",
    activePaths: ["/group-competitions"],
    children: [
      { labelKey: "nav.gc.static", href: "/group-competitions/static" },
      { labelKey: "nav.gc.records", href: "/group-competitions/records" },
      { labelKey: "nav.gc.events", href: "/group-competitions/events" },
      { labelKey: "nav.gc.competitions", href: "/group-competitions/competitions", activePaths: ["/competition"] },
      { labelKey: "nav.gc.players", href: "/group-competitions/players", activePaths: ["/player"] },
      { labelKey: "nav.gc.pktimer", href: "/group-competitions/pktimer" },
    ],
  },
  {
    id: "wca",
    labelKey: "nav.wca",
    activePaths: ["/wca"],
    children: [
      { labelKey: "nav.wca.comps", href: "/wca/wca-comps" },
      { labelKey: "nav.wca.players", href: "/wca/players", activePaths: ["/wca/player"] },
      { labelKey: "nav.wca.statistics", href: "/wca/statistics" },
      { labelKey: "nav.wca.proportion", href: "/wca/proportion-estimation" },
    ],
  },
  {
    id: "tools",
    labelKey: "nav.tools",
    activePaths: ["/tools", "/draw-tools"],
    children: [
      { labelKey: "nav.tools.teamMatch", href: "/tools/team-match" },
      { labelKey: "nav.tools.fr", href: "/tools/floppy-reduction" },
      { labelKey: "nav.tools.twoSolver", href: "/tools/solver/222" },
      {
        labelKey: "nav.tools.draw",
        children: [
          { labelKey: "nav.tools.sq1", href: "/draw-tools/sq1-d" },
          { labelKey: "nav.tools.minx", href: "/draw-tools/minx-d" },
          { labelKey: "nav.tools.sk", href: "/draw-tools/sk-d" },
          { labelKey: "nav.tools.py", href: "/draw-tools/py-d" },
          { labelKey: "nav.tools.fto", href: "/draw-tools/fto-d" },
        ],
      },
    ],
  },
  {
    id: "more",
    labelKey: "nav.more",
    children: [
      { labelKey: "nav.more.links", href: "/external-links" },
      { labelKey: "nav.more.changelog", href: "/changelog" },
      { labelKey: "nav.more.coffee", href: "/buy-coffee" },
      { labelKey: "nav.more.settings", href: "/settings" },
    ],
  },
];

export function isNavLinkActive(pathname: string, item: NavLinkDef): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (item.href === "/welcome" && path === "/") return true;
  if ([item.href, ...(item.activePaths ?? [])].some((href) =>
    href && (path === href || (href !== "/" && path.startsWith(`${href}/`))),
  )) return true;
  return item.children?.some((child) => isNavLinkActive(pathname, child)) ?? false;
}

export function isNavGroupActive(pathname: string, group: NavGroupDef): boolean {
  return isNavLinkActive(pathname, group);
}

export function buildMainNav(): NavGroupDef[] {
  return MAIN_NAV;
}
