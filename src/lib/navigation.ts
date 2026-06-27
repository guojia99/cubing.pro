import type { MessageKey } from "@/i18n";

export interface NavLinkDef {
  labelKey: MessageKey;
  href?: string;
  children?: NavLinkDef[];
}

export interface NavGroupDef {
  id: string;
  labelKey: MessageKey;
  href?: string;
  children?: NavLinkDef[];
}

export const MAIN_NAV: NavGroupDef[] = [
  { id: "welcome", labelKey: "nav.home", href: "/welcome" },
  { id: "algs", labelKey: "nav.algs", href: "/algs" },
  {
    id: "group-competitions",
    labelKey: "nav.groupCompetitions",
    children: [
      { labelKey: "nav.gc.static", href: "/group-competitions/static" },
      { labelKey: "nav.gc.records", href: "/group-competitions/records" },
      { labelKey: "nav.gc.events", href: "/group-competitions/events" },
      { labelKey: "nav.gc.competitions", href: "/group-competitions/competitions" },
      { labelKey: "nav.gc.players", href: "/group-competitions/players" },
      { labelKey: "nav.gc.pktimer", href: "/group-competitions/pktimer" },
    ],
  },
  {
    id: "wca",
    labelKey: "nav.wca",
    children: [
      { labelKey: "nav.wca.comps", href: "/wca/wca-comps" },
      { labelKey: "nav.wca.players", href: "/wca/players" },
      { labelKey: "nav.wca.statistics", href: "/wca/statistics" },
      { labelKey: "nav.wca.proportion", href: "/wca/proportion-estimation" },
    ],
  },
  {
    id: "tools",
    labelKey: "nav.tools",
    children: [
      { labelKey: "nav.tools.teamMatch", href: "/tools/team-match" },
      { labelKey: "nav.tools.fr", href: "/tools/floppy-reduction" },
      {
        labelKey: "nav.tools.draw",
        children: [
          { labelKey: "nav.tools.sq1", href: "/draw-tools/sq1-d" },
          { labelKey: "nav.tools.minx", href: "/draw-tools/minx-d" },
          { labelKey: "nav.tools.sk", href: "/draw-tools/sk-d" },
          { labelKey: "nav.tools.py", href: "/draw-tools/py-d" },
        ],
      },
      {
        labelKey: "nav.other",
        children: [
          { labelKey: "nav.other.recipes", href: "/other/recipes" },
          { labelKey: "nav.other.kitchen", href: "/other/kitchen-skills" },
          { labelKey: "nav.other.cocktails", href: "/other/cocktails" },
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
  if (item.href) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return item.children?.some((child) => isNavLinkActive(pathname, child)) ?? false;
}

export function isNavGroupActive(pathname: string, group: NavGroupDef): boolean {
  if (group.href) {
    return pathname === group.href || pathname.startsWith(`${group.href}/`);
  }
  return group.children?.some((item) => isNavLinkActive(pathname, item)) ?? false;
}

export function buildMainNav(): NavGroupDef[] {
  return MAIN_NAV;
}
