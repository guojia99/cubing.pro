/**
 * 路由表 — 对齐 docs/features/_index.md（原 Umi config/routes.ts 契约）
 */

export type ImplType =
  | "frontend-only"
  | "frontend-heavy"
  | "api-driven"
  | "hybrid";

export type RenderMode = "client-spa" | "static-first" | "tab-shell";

export interface AppRoute {
  id: string;
  name: string;
  /** 路由模式，如 /algs/:cube/:class */
  pattern: string;
  implType: ImplType;
  renderMode: RenderMode;
  pageComponent: string;
  hidden?: boolean;
  tags?: string[];
}

export const APP_ROUTES: AppRoute[] = [
  { id: "welcome", name: "欢迎页", pattern: "/welcome", implType: "hybrid", renderMode: "client-spa", pageComponent: "Welcome.tsx" },
  { id: "buy-coffee", name: "赞助", pattern: "/buy-coffee", implType: "frontend-only", renderMode: "client-spa", pageComponent: "BuyCoffee/index.tsx" },
  { id: "changelog", name: "更新日志", pattern: "/changelog", implType: "frontend-only", renderMode: "static-first", pageComponent: "Changelog/index.tsx" },
  { id: "external-links", name: "外链", pattern: "/external-links", implType: "api-driven", renderMode: "client-spa", pageComponent: "ExternalLinks/ExternalLinksPage.tsx" },
  { id: "advertisement", name: "广告", pattern: "/advertisement", implType: "frontend-only", renderMode: "client-spa", pageComponent: "Advertisement/index.tsx", hidden: true },
  { id: "settings", name: "设置", pattern: "/settings", implType: "hybrid", renderMode: "client-spa", pageComponent: "Settings.tsx" },
  { id: "user-kv-data", name: "用户 KV", pattern: "/user/kv-data", implType: "api-driven", renderMode: "client-spa", pageComponent: "UserData/PersonalKvList.tsx" },
  { id: "login", name: "WCA 登录", pattern: "/login", implType: "frontend-only", renderMode: "client-spa", pageComponent: "Admin/Login.tsx", hidden: true, tags: ["admin"] },
  { id: "auth-callback", name: "WCA 回调", pattern: "/auth/callback", implType: "frontend-only", renderMode: "client-spa", pageComponent: "Admin/AuthCallback.tsx", hidden: true },
  { id: "old-login", name: "旧版登录", pattern: "/old-login", implType: "frontend-only", renderMode: "client-spa", pageComponent: "Admin/OldLogin.tsx", hidden: true },
  { id: "user-profile", name: "个人中心", pattern: "/user/profile", implType: "api-driven", renderMode: "client-spa", pageComponent: "Admin/Profile.tsx" },
  { id: "admin-organizers", name: "主办首页", pattern: "/admin/organizers", implType: "frontend-only", renderMode: "client-spa", pageComponent: "Admin/Organizers.tsx", tags: ["admin"] },
  { id: "admin-organizers-comps", name: "主办比赛列表", pattern: "/admin/organizers/comps", implType: "api-driven", renderMode: "client-spa", pageComponent: "Admin/OrganizersComponent/OrganizersComps.tsx", tags: ["admin"] },
  { id: "admin-organizers-create", name: "创建比赛", pattern: "/admin/organizers/comps/create", implType: "api-driven", renderMode: "client-spa", pageComponent: "Admin/OrganizersComponent/CreateComps.tsx", tags: ["admin"] },
  { id: "admin-organizers-details", name: "主办详情", pattern: "/admin/organizers/details", implType: "frontend-only", renderMode: "client-spa", pageComponent: "Admin/OrganizersComponent/OrganizersDetails.tsx", tags: ["admin"] },
  { id: "admin-organizers-group", name: "群组管理", pattern: "/admin/organizers/group", implType: "api-driven", renderMode: "client-spa", pageComponent: "Admin/OrganizersComponent/OrganizersGroup.tsx", tags: ["admin"] },
  { id: "admin-organizers-result", name: "成绩管理", pattern: "/admin/organizers/result", implType: "api-driven", renderMode: "client-spa", pageComponent: "Admin/OrganizersComponent/OrganizersResults.tsx", tags: ["admin"] },
  { id: "admin-organizers-list", name: "主办团队", pattern: "/admin/organizers/list", implType: "api-driven", renderMode: "client-spa", pageComponent: "Admin/OrganizersComponent/OrganizersList.tsx", tags: ["admin"] },
  { id: "admin-organizers-comp-result", name: "录入成绩", pattern: "/admin/organizers/:orgId/comp/:compId/result", implType: "api-driven", renderMode: "client-spa", pageComponent: "Admin/OrganizersComponent/OrganizersResults.tsx", tags: ["admin"] },
  { id: "admin-admins", name: "后台首页", pattern: "/admin/admins", implType: "frontend-only", renderMode: "client-spa", pageComponent: "Admin/Admin.tsx", tags: ["admin"] },
  { id: "admin-users", name: "用户管理", pattern: "/admin/users", implType: "api-driven", renderMode: "client-spa", pageComponent: "Admin/AdminComponent/Users.tsx", tags: ["admin"] },
  { id: "admin-manage-organizers", name: "管理主办", pattern: "/admin/manage/organizers", implType: "api-driven", renderMode: "client-spa", pageComponent: "Admin/AdminComponent/AdminOrganizers.tsx", tags: ["admin"] },
  { id: "admin-manage-groups", name: "管理群组", pattern: "/admin/manage/groups", implType: "api-driven", renderMode: "client-spa", pageComponent: "Admin/AdminComponent/AdminCompetitionGroups.tsx", tags: ["admin"] },
  { id: "admin-diy-ranking", name: "DIY 榜单", pattern: "/admin/diy-ranking", implType: "api-driven", renderMode: "client-spa", pageComponent: "Admin/AdminComponent/DiyRanking.tsx", tags: ["admin"] },
  { id: "admin-acknowledgments", name: "致谢管理", pattern: "/admin/acknowledgments", implType: "api-driven", renderMode: "client-spa", pageComponent: "Admin/AdminComponent/AdminAcknowledgments.tsx", tags: ["admin"] },
  { id: "admin-other-links", name: "外链管理", pattern: "/admin/other-links", implType: "api-driven", renderMode: "client-spa", pageComponent: "Admin/AdminComponent/AdminExternalLinks.tsx", tags: ["admin"] },
  { id: "admin-sports", name: "体育赛事", pattern: "/admin/sports", implType: "api-driven", renderMode: "client-spa", pageComponent: "Admin/SportsComponents/Sports.tsx", tags: ["admin"] },
  { id: "admin-sports-events", name: "体育项目", pattern: "/admin/sports/events", implType: "api-driven", renderMode: "client-spa", pageComponent: "Admin/SportsComponents/Events.tsx", tags: ["admin"] },
  { id: "algs-list", name: "公式列表", pattern: "/algs", implType: "frontend-heavy", renderMode: "client-spa", pageComponent: "Algs/AlgsList.tsx" },
  { id: "algs-detail", name: "公式详情", pattern: "/algs/:cube/:class", implType: "hybrid", renderMode: "client-spa", pageComponent: "Algs/AlgsDetail.tsx" },
  { id: "recipes", name: "菜谱", pattern: "/other/recipes", implType: "frontend-only", renderMode: "static-first", pageComponent: "Recipes/RecipeList.tsx" },
  { id: "recipe-detail", name: "菜谱详情", pattern: "/other/recipes/:category/:id", implType: "frontend-only", renderMode: "static-first", pageComponent: "Recipes/RecipeDetail.tsx" },
  { id: "kitchen-skills", name: "厨房技巧", pattern: "/other/kitchen-skills", implType: "frontend-only", renderMode: "static-first", pageComponent: "KitchenSkills/KitchenSkillList.tsx" },
  { id: "kitchen-skill-detail", name: "技巧详情", pattern: "/other/kitchen-skills/:category/:id", implType: "frontend-only", renderMode: "static-first", pageComponent: "KitchenSkills/KitchenSkillDetail.tsx" },
  { id: "cocktails", name: "鸡尾酒", pattern: "/other/cocktails", implType: "frontend-only", renderMode: "static-first", pageComponent: "Cocktails/CocktailList.tsx" },
  { id: "cocktail-detail", name: "鸡尾酒详情", pattern: "/other/cocktails/:slug", implType: "frontend-only", renderMode: "static-first", pageComponent: "Cocktails/CocktailDetail.tsx" },
  { id: "tool-bld-d", name: "BLD 练习", pattern: "/tools/bld-d", implType: "frontend-only", renderMode: "client-spa", pageComponent: "Tools/Bld/BldMeor.tsx", tags: ["tool"] },
  { id: "tool-bld-pingyin", name: "BLD 拼音", pattern: "/tools/bld-pingyin", implType: "frontend-only", renderMode: "client-spa", pageComponent: "Tools/Bld/BldPingYin.tsx", tags: ["tool"] },
  { id: "tool-associative-words", name: "BLD 联想词", pattern: "/tools/associative-words", implType: "frontend-only", renderMode: "client-spa", pageComponent: "Tools/Bld/Bld_Associative_Words.tsx", tags: ["tool"] },
  { id: "tool-mbld-d", name: "MBLD", pattern: "/tools/mbld-d", implType: "frontend-only", renderMode: "client-spa", pageComponent: "Tools/Bld/MBld.tsx", tags: ["tool"] },
  { id: "tool-team-match", name: "团体赛", pattern: "/tools/team-match", implType: "hybrid", renderMode: "client-spa", pageComponent: "TeamMatch/TeamMatchView.tsx", tags: ["tool"] },
  { id: "draw-sq1", name: "SQ1 绘图", pattern: "/draw-tools/sq1-d", implType: "frontend-only", renderMode: "client-spa", pageComponent: "Tools/Draws/SQ1Draw.tsx", tags: ["tool"] },
  { id: "draw-minx", name: "五魔方绘图", pattern: "/draw-tools/minx-d", implType: "frontend-only", renderMode: "client-spa", pageComponent: "Tools/Draws/MinxDraw.tsx", tags: ["tool"] },
  { id: "draw-sk", name: "Skewb 绘图", pattern: "/draw-tools/sk-d", implType: "frontend-only", renderMode: "client-spa", pageComponent: "Tools/Draws/SkDraw.tsx", tags: ["tool"] },
  { id: "draw-py", name: "Pyraminx 绘图", pattern: "/draw-tools/py-d", implType: "frontend-only", renderMode: "client-spa", pageComponent: "Tools/Draws/PyDraw.tsx", tags: ["tool"] },
  { id: "tool-fr", name: "Floppy Reduction", pattern: "/tools/floppy-reduction", implType: "frontend-only", renderMode: "client-spa", pageComponent: "FloppyReduction/FloppyReductionView.tsx", tags: ["tool"] },
  { id: "test", name: "测试", pattern: "/test", implType: "frontend-only", renderMode: "client-spa", pageComponent: "Tests/Test.tsx" },
  { id: "wca-comps", name: "WCA 赛事", pattern: "/wca/wca-comps", implType: "api-driven", renderMode: "client-spa", pageComponent: "Tools/Comps/WCAComps.tsx", tags: ["wca"] },
  { id: "wca-player", name: "WCA 选手", pattern: "/wca/player/:wcaId", implType: "api-driven", renderMode: "client-spa", pageComponent: "WCA/Player.tsx", tags: ["wca"] },
  { id: "wca-players", name: "选手搜索", pattern: "/wca/players", implType: "api-driven", renderMode: "client-spa", pageComponent: "WCA/Players.tsx", tags: ["wca"] },
  { id: "wca-proportion-estimation", name: "比例拟合", pattern: "/wca/proportion-estimation", implType: "api-driven", renderMode: "client-spa", pageComponent: "WCA/ProportionEstimation.tsx", tags: ["wca"] },
  { id: "wca-statistics", name: "WCA 统计", pattern: "/wca/statistics", implType: "api-driven", renderMode: "tab-shell", pageComponent: "WCA/Statistics/index.tsx", tags: ["wca"] },
  { id: "competition-detail", name: "赛事详情", pattern: "/competition/:id", implType: "hybrid", renderMode: "tab-shell", pageComponent: "Competition/Competition.tsx" },
  { id: "player-detail", name: "站内选手", pattern: "/player/:id", implType: "api-driven", renderMode: "client-spa", pageComponent: "Player/Player.tsx" },
  { id: "gc-static", name: "排行", pattern: "/group-competitions/static", implType: "api-driven", renderMode: "tab-shell", pageComponent: "Static/Static.tsx" },
  { id: "gc-records", name: "纪录", pattern: "/group-competitions/records", implType: "api-driven", renderMode: "client-spa", pageComponent: "Static/Record.tsx" },
  { id: "gc-events", name: "项目", pattern: "/group-competitions/events", implType: "api-driven", renderMode: "client-spa", pageComponent: "Events/Events.tsx" },
  { id: "gc-competitions", name: "比赛列表", pattern: "/group-competitions/competitions", implType: "api-driven", renderMode: "client-spa", pageComponent: "Competition/Competitions.tsx" },
  { id: "gc-players", name: "选手列表", pattern: "/group-competitions/players", implType: "api-driven", renderMode: "client-spa", pageComponent: "Player/Players.tsx" },
  { id: "gc-pktimer", name: "PK 计时器", pattern: "/group-competitions/pktimer", implType: "api-driven", renderMode: "client-spa", pageComponent: "Static/Pktimers.tsx" },
];

const patternToRegex = (pattern: string) => {
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/:[^/]+/g, "[^/]+");
  return new RegExp(`^${escaped}$`);
};

/** 将路由模式中的 :param 与 pathname 匹配，提取动态段（静态导出占位页回退后由客户端读取） */
export function extractRouteParams(
  pattern: string,
  pathname: string,
): Record<string, string> | null {
  const paramNames: string[] = [];
  const regexSource = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/:([^/]+)/g, (_, name: string) => {
      paramNames.push(name);
      return "([^/]+)";
    });

  const normalized = pathname.replace(/\/$/, "") || "/";
  const match = normalized.match(new RegExp(`^${regexSource}$`));
  if (!match) return null;

  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    const raw = match[index + 1] ?? "";
    try {
      params[name] = decodeURIComponent(raw);
    } catch {
      params[name] = raw;
    }
  });
  return params;
}

export function matchRoute(pathname: string): AppRoute | undefined {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return APP_ROUTES.find((route) => patternToRegex(route.pattern).test(normalized));
}

export function pathnameToHref(pathname: string) {
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}
