import { Auth, hasAuth, isLoggedIn } from "@/lib/auth";
import type { MessageKey } from "@/i18n";
import type { CurrentUserData } from "@/services/cubing-pro/auth/types";

export interface NavLinkDef {
  labelKey: MessageKey;
  href: string;
  /** Require login */
  login?: boolean;
  /** Require any of these auth bits */
  auth?: Auth[];
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
      { labelKey: "nav.tools.bldD", href: "/tools/bld-d" },
      { labelKey: "nav.tools.bldPingyin", href: "/tools/bld-pingyin" },
      { labelKey: "nav.tools.associative", href: "/tools/associative-words" },
      { labelKey: "nav.tools.mbld", href: "/tools/mbld-d" },
      { labelKey: "nav.tools.sq1", href: "/draw-tools/sq1-d" },
      { labelKey: "nav.tools.minx", href: "/draw-tools/minx-d" },
      { labelKey: "nav.tools.sk", href: "/draw-tools/sk-d" },
      { labelKey: "nav.tools.py", href: "/draw-tools/py-d" },
    ],
  },
  {
    id: "other",
    labelKey: "nav.other",
    children: [
      { labelKey: "nav.other.recipes", href: "/other/recipes" },
      { labelKey: "nav.other.kitchen", href: "/other/kitchen-skills" },
      { labelKey: "nav.other.cocktails", href: "/other/cocktails" },
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

const ADMIN_NAV_ITEMS: NavLinkDef[] = [
  {
    labelKey: "nav.admin.profile",
    href: "/user/profile",
    login: true,
  },
  {
    labelKey: "nav.admin.organizers",
    href: "/admin/organizers",
    auth: [Auth.AuthOrganizers],
  },
  {
    labelKey: "nav.admin.admins",
    href: "/admin/admins",
    auth: [Auth.AuthAdmin, Auth.AuthSuperAdmin],
  },
];

function canSeeNavItem(user: CurrentUserData | null, item: NavLinkDef): boolean {
  if (item.login && !isLoggedIn(user?.id)) return false;
  if (item.auth?.length) {
    if (!isLoggedIn(user?.id)) return false;
    const auth = user?.Auth ?? 0;
    return item.auth.some((a) => hasAuth(auth, a));
  }
  return true;
}

export function buildAdminNavGroup(
  user: CurrentUserData | null,
): NavGroupDef | null {
  const children = ADMIN_NAV_ITEMS.filter((item) => canSeeNavItem(user, item));
  if (!children.length) return null;
  return {
    id: "admin",
    labelKey: "nav.admin",
    children,
  };
}

export function buildMainNav(user: CurrentUserData | null): NavGroupDef[] {
  const admin = buildAdminNavGroup(user);
  return admin ? [...MAIN_NAV, admin] : MAIN_NAV;
}
