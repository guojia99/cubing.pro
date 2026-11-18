import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

// Run against the already-running Next server. All API traffic is fulfilled here.
const origin = process.env.VISUAL_ORIGIN || "http://localhost:3000";
const chartWidth = Number(process.env.VISUAL_CHART_WIDTH || 390);
const output = process.env.VISUAL_OUTPUT || "/var/folders/p8/b3ryxj6s1bd4wgsspxzhfnw40000gn/T/opencode/wca-gc-admin-visual";
await mkdir(output, { recursive: true });
const name = "视觉测试选手";
const longName = "海蓝群赛视觉检查包含较长名称的测试比赛";
const user = { id: 1, Auth: 31, Name: name, EnName: "Visual Fixture", CubeID: "visual0001", WcaID: "2020TEST01", Avatar: "", QQ: "123456", QQUniID: "fixture-long-unique-id-for-wrap-check-1234567890", Email: "fixture@example.invalid", Sex: 1, Birthdate: "2000-01-01", Sign: "离线视觉验证", Level: 1, Experience: 100, createdAt: "2020-01-01T00:00:00Z", Detail: { Matches: 2, RestoresNum: 5, SuccessesNum: 5, PodiumNum: 1 }, BestResults: { Single: {}, Avgs: {} } };
const events = ["333", "222", "444"].map((id, idx) => ({ id, idx, name: id, cn: id, otherNames: "测试项目", isComp: true, isWCA: true, base_route_typ: 7, scrambleValue: "", autoScrambleKey: id }));
const comp = { id: 42, Name: longName, Status: "Running", IsDone: false, OrganizersID: 7, OrganizersName: "海蓝测试团队", GroupId: 70, GroupName: "海蓝测试群组", Genre: 5, Count: 100, CanPreResult: true, CompStartTime: "2026-11-13T00:00:00+08:00", CompEndTime: "2026-11-14T00:00:00+08:00", EventMin: "333;222;444", comp_json: { Events: events.map((ev) => ({ Key: ev.id, EventID: ev.id, EventName: ev.id, EventRoute: 7, Schedule: [{ RoundNum: 1, Round: "决赛", IsRunning: true, Competitors: 0, TimeLimit: 0, Cutoff: 0, CutoffNumber: 0, Scrambles: [], Format: "ao5" }] })), Cost: { BaseCost: { Value: 0 } }, Description: "离线视觉测试" } };
const groupResult = { id: 1, EventID: "333", EventName: "333", EventRoute: 7, CompetitionID: 42, CompetitionName: longName, PersonName: name, CubeID: user.CubeID, Round: "决赛", RoundNumber: 1, Best: 10, Average: 12, Result: [10, 11, 12, 13, 14], Penalty: [], createdAt: "2026-11-13T00:00:00Z", Finish: false, FinishDetail: "wait", Source: "web-api" };
const record = { id: 1, EventId: "333", EventRoute: 7, ResultId: 1, UserId: 1, CubeId: user.CubeID, UserName: name, CompsId: 42, CompsName: longName, CompsGenre: 5, Best: 10, Average: 12, Type: "CR", ThisResults: "10 11 12 13 14", createdAt: "2026-11-13T00:00:00Z" };
const kinch = { PlayerId: 1, CubeId: user.CubeID, Rank: 1, wca_id: user.WcaID, WcaName: name, PlayerName: name, CountryIso2: "CN", Result: 70, Results: [{ Event: "333", Result: 70, IsBest: true, UseSingle: false, ResultString: "12.00" }] };
const country = { id: "China", name: "China", continent_id: "_Asia", iso2: "CN" };
const wcaComp = { id: "Visual2026", name: longName, city: "Shanghai", country_iso2: "CN", country_id: "China", start_date: "2026-10-01", end_date: "2026-10-02", event_ids: ["333", "222", "444"], venue: "离线测试场馆", registration_open: "2026-01-01T00:00:00Z", registration_close: "2026-09-01T00:00:00Z" };
const wcaResult = { id: 1, pos: 1, round_id: 1, best: 1000, average: 1200, name, wca_id: user.WcaID, country_iso2: "CN", competition_id: wcaComp.id, competition_name: wcaComp.name, competition_time: "2026-10-01", event_id: "333", round_type_id: "f", format_id: "a", attempts: [1000, 1100, 1200, 1300, 1400], best_index: 0, worst_index: 4, regional_single_record: "NR", regional_average_record: "NR" };
const rank = { wcaId: user.WcaID, wcaName: name, eventId: "333", year: 2026, month: 10, single: 1000, average: 1200, country: "China", singleCountryRank: 1, singleWorldRank: 10, singleContinentRank: 3, avgCountryRank: 1, avgWorldRank: 10, avgContinentRank: 3 };
const profile = { name, wcaId: user.WcaID, countryId: "China", gender: "m", thumb_url: "", country_iso2: "CN", competition_count: 1, personal_records: { "333": { single: { best: 1000, world_rank: 10, continent_rank: 3, country_rank: 1 }, average: { best: 1200, world_rank: 10, continent_rank: 3, country_rank: 1 } } }, medals: { gold: 1, silver: 0, bronze: 0, total: 1 }, records: { national: 2, continental: 0, world: 0, total: 2 }, geos: [] };
if (process.env.VISUAL_CHART_THEME === "1") profile.geos = [{ iso2: "CN", countryId: "China", province: "Shanghai", city: "Shanghai", count: 1 }];
const org = { id: 7, Name: "海蓝测试团队", Status: "Using", LeaderID: user.CubeID, Introduction: "离线视觉测试团队", Email: "fixture@example.invalid", AssOrganizerUsers: "" };
const group = { id: 70, name: "海蓝测试群组", Name: "海蓝测试群组", OrganizersID: 7, qq_groups: ["123456"], qq_group_uid: [], wechat_groups: [] };
const envelope = (data) => ({ code: "200", data });
const paged = (items, total = items.length) => ({ items, total, next: false });
const unknown = new Set();
function fixture(path) {
  if (path === "/auth/current") return envelope(user);
  if (path.startsWith("/user/kv/")) return envelope({ value: "" });
  if (path === "/wca/country") return [country];
  if (path === "/wca/grand-slam") return [{ wcaID: user.WcaID, wcaName: name, country: "China", eventID: "333", best: 1000, average: 1200, hasWR: true, worldChampionshipRank: 1, continentChampionshipRank: 1, countryChampionshipRank: 1, worldChampionshipName: "世界测试锦标赛", continentChampionshipName: "亚洲测试锦标赛", countryChampionshipName: "中国测试锦标赛" }];
  if (path.startsWith("/wca/players/")) return [{ wca_id: user.WcaID, name, iso2: "CN", country_id: "China", gender: "m" }];
  if (path === `/wca/player/${user.WcaID}`) return profile;
  if (path.endsWith("/rank_timers")) return envelope([rank]);
  if (path.endsWith("/best_ranks")) return Object.fromEntries(["withNR", "withCR", "withWR"].map((k) => [k, { best: {}, average: {} }]));
  if (path.startsWith("/wca/player/") && path.endsWith("/results")) return [wcaResult];
  if (path.startsWith("/wca/player/") && path.endsWith("/competitions")) return [wcaComp];
  if (path === "/wca/extend/resultProportionEstimation") return envelope({ persons: [user.WcaID], events: ["444", "555", "666", "777"], segments: [{ anchor_min: 1000, anchor_max: 3000, n_persons: 100, ratio: { "444": 1, "555": 2, "666": 4, "777": 6 } }], global_ratio: { "444": 1, "555": 2, "666": 4, "777": 6 }, curve_samples: [10, 20, 30].map((s) => ({ anchor_sec: s, estimates: { "444": s, "555": s * 2, "666": s * 4, "777": s * 6 } })), sample_count: 100 });
  if (path.includes("/wca/ranks/historical/full")) return { data: [rank], total: 1 };
  if (path.includes("/wca/ranks/success_rate")) return { data: [{ ...rank, solved: 100, attempted: 110, percentage: 90.91 }], total: 1 };
  if (path.includes("all-events-achiever")) return { data: [{ wcaId: user.WcaID, name, country: "China", doneEventList: ["333"], lackNum: 16, isDone: false, useDate: 100, useCompNum: 3 }], total: 1 };
  if (path.includes("diy_events")) return { data: [{ wcaId: user.WcaID, name, country: "China", rank: 1, count: 10, rankEntries: [{ personId: user.WcaID, eventId: "333", rank: 10 }] }], total: 1 };
  if (path.includes("rank-with-start-comp-year")) return { data: [{ personID: user.WcaID, personName: name, countryID: "China", year: 2020, isAvg: false, eventID: "333", best: 1000, rank: 1, worldRank: 10, countryRank: 1 }], total: 1 };
  if (path.startsWith("/wca/ranks/")) return { data: [wcaResult], total: 1 };
  if (path === "/public/events") return envelope({ Events: events, UpdateTime: "2026-11-18" });
  if (path === "/public/comps/") return envelope(paged([comp]));
  if (["/public/player/", "/admin/users/"].includes(path)) return envelope(paged([user]));
  if (path === `/public/player/${user.CubeID}`) return envelope(user);
  if (path.startsWith("/public/player/")) {
    if (path.endsWith("/results")) return envelope({ All: [groupResult] });
    if (path.endsWith("/records")) return envelope([record]);
    if (path.endsWith("/comps")) return envelope(paged([comp]));
    if (path.endsWith("/sor")) return envelope(kinch);
    if (path.endsWith("/nemesis")) return envelope([]);
  }
  if (path.includes("/statistics/kinch")) return envelope(paged([kinch]));
  if (path === "/public/statistics/records") return envelope({ Records: [record], Best: { "333": [record] }, Average: { "333": [record] } });
  if (path === "/public/comp_groups") return envelope(paged([group]));
  if (path === "/public/pkTimers") return envelope(paged([{ id: 1, createdAt: "2026-11-13T00:00:00Z", groupName: group.name, pkResults: { count: 5, event: events[0], players: [{ userName: name, userId: 1, best: 10, average: 12, results: [10, 11, 12, 13, 14] }] } }]));
  if (path === "/admin/competition/filters") return envelope({ organizers: [org], groups: [group], organizersNext: false, groupsNext: false });
  if (path === "/organizers/me") return envelope(paged([org]));
  if (path === "/admin/competition/organizers") return envelope(paged([org]));
  if (path.endsWith("/groups")) return envelope(paged([group]));
  if (path === "/admin/competition/organizers/7") return envelope({ organizer: org, groups: [group] });
  if (path.endsWith("/approvals/comps") || path === "/organizers/7/comp/") return envelope(paged([{ ...comp, Status: "Reviewing", PendingCount: 1 }], 42));
  if (path === "/admin/competition/comps/42" || path === "/organizers/7/comp/42") return envelope(comp);
  if (path.endsWith("/all_players")) return envelope(paged([user]));
  if (path.endsWith("/players")) return envelope([{ id: 1, UserID: 1, UserName: name, Status: "Running", Events: "333" }]);
  if (path.endsWith("/pre_results")) return envelope(paged([groupResult]));
  if (path.endsWith("/result")) return envelope([groupResult]);
  if (path.includes("acknowledgments")) return [];
  if (path.includes("otherLinks")) return { groups: [], group_map: {}, tops: [], links: [] };
  if (path.includes("diy")) return envelope([]);
  unknown.add(path);
  return envelope(paged([]));
}

const routes = [
  ["wca-comps", "/wca/wca-comps", ".wca-comps-card"],
  ["wca-search", "/wca/players", ".wca-page input"],
  ["wca-player", `/wca/player/${user.WcaID}`, ".wca-result-table-card"],
  ...["competitions", "eventStats", "milestones", "litCities"].map((tab) => [`wca-player-${tab}`, `/wca/player/${user.WcaID}?tab=${tab}`, ".wca-player-statics-tab .ant-tabs-tabpane-active"]),
  ["wca-player-history", `/wca/player/${user.WcaID}`, ".wca-result-table-card"],
  ["wca-player-byComp", `/wca/player/${user.WcaID}`, ".wca-player-statics-tab"],
  ...["grandSlam", "historical", "full", "yearlyFull", "compYear", "successRate", "allEventsAchievement", "multiEventRank", "wcaKinch"].map((tab) => [`stats-${tab}`, `/wca/statistics?tab=${tab}`, ".stats-content .ant-table"]),
  ["proportion", "/wca/proportion-estimation", ".proportion-section"],
  ["gc-comps", "/group-competitions/competitions", ".competition-page .ant-table"],
  ["gc-players", "/group-competitions/players", ".competition-page .ant-table"],
  ["gc-events", "/group-competitions/events", ".competition-page .ant-table"],
  ["gc-records", "/group-competitions/records", ".competition-page .ant-table"],
  ["gc-history", "/group-competitions/records?mode=history", ".competition-page .ant-table"],
  ["gc-static", "/group-competitions/static", ".competition-page .ant-table"],
  ["gc-pk", "/group-competitions/pktimer", ".competition-page .ant-table"],
  ["gc-player", `/player/${user.CubeID}`, ".player-results-panel"],
  ...["comps", "record", "nemesis", "kin_ch_sor"].map((tab) => [`gc-player-${tab}`, `/player/${user.CubeID}?player_result_tabs=${tab}`, ".player-results-panel .ant-tabs-tabpane-active:visible"]),
  ["admin-home", "/admin/admins", ".admin-page .feature-link"],
  ["organizer-home", "/admin/organizers", ".admin-page .feature-link"],
  ["admin-users", "/admin/users", ".admin-users-table"],
  ["admin-organizers", "/admin/manage/organizers", ".admin-page .ant-table"],
  ["admin-groups", "/admin/manage/groups", ".admin-page .ant-select"],
  ["admin-diy", "/admin/diy-ranking", ".admin-page .ant-table"],
  ["admin-thanks", "/admin/acknowledgments", ".admin-page"],
  ["admin-links", "/admin/other-links", ".admin-page"],
  ["admin-approvals", "/admin/competition/approvals", ".group-competition .ant-table"],
  ["organizer-comps", "/admin/organizers/comps", ".group-competition .ant-table"],
  ["admin-manage", "/admin/competition/manage?compId=42&input_tabs=manage", ".group-competition .ant-tabs"],
  ["admin-review", "/admin/competition/manage?compId=42&input_tabs=pre_result", ".group-competition .ant-table:visible"],
  ["admin-single", "/admin/competition/manage?compId=42&input_tabs=one", ".group-competition .ant-form:visible"],
  ["admin-batch", "/admin/competition/manage?compId=42&input_tabs=multi", ".group-competition textarea:visible"],
  ["organizer-create", "/admin/organizers/comps/create", ".group-competition .ant-form"],
  ...["details", "group", "list"].map((view) => [`organizer-${view}`, `/admin/organizers/${view}`, "main h1"]),
  ["profile", "/user/profile", ".admin-page input"],
  ["login", "/login", "main h1"],
].filter(([id]) => !process.env.VISUAL_FILTER || new RegExp(process.env.VISUAL_FILTER).test(id));

const browser = await chromium.launch({ headless: true });
const results = [];
const errors = [];
const external = new Set();
const apiRequests = [];
const mutations = [];
async function probe(page, id, mode, width, suffix = "") {
  await page.waitForFunction(() => {
    const header = [...document.querySelectorAll('main .ant-table-thead th')].find((el) => el.getBoundingClientRect().height > 1);
    if (!header) return true;
    const expected = document.createElement('span'); expected.style.color='var(--muted)'; document.body.append(expected);
    const color=getComputedStyle(expected).color; expected.remove();
    return getComputedStyle(header).backgroundColor === color;
  }, undefined, {timeout:10000});
  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const css = getComputedStyle(root);
    const sample = (node) => {
      const el = node?.tagName === "TH" ? visibleHeader : node?.tagName === "TD" ? visibleCell : node;
      if (!el) return null;
      const color = getComputedStyle(el).color;
      let background = getComputedStyle(el).backgroundColor;
      for (let parent = el.parentElement; background === "rgba(0, 0, 0, 0)" && parent; parent = parent.parentElement) background = getComputedStyle(parent).backgroundColor;
      // Canvas resolves color(srgb), color-mix and alpha compositing like the browser.
      const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1;
      const paint = canvas.getContext("2d", {willReadFrequently:true});
      const layers = []; for (let node = el; node; node = node.parentElement) layers.unshift(getComputedStyle(node).backgroundColor);
      paint.fillStyle = "white"; paint.fillRect(0,0,1,1);
      for (const layer of layers) { paint.fillStyle = layer; paint.fillRect(0,0,1,1); }
      const luminance = (rgb) => [...rgb].slice(0,3).map((v) => { const n=v/255; return n<=.04045?n/12.92:((n+.055)/1.055)**2.4; }).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
      const bg = luminance(paint.getImageData(0,0,1,1).data);
      paint.fillStyle=color; paint.fillRect(0,0,1,1);
      const fg = luminance(paint.getImageData(0,0,1,1).data);
      const rect = el.getBoundingClientRect();
      return { tag: el.tagName, class: el.className, parentClass: el.parentElement.className, color, background, contrast: (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05), left: rect.left, right: rect.right, clientWidth: el.clientWidth, scrollWidth: el.scrollWidth };
    };
    const resolve = (token) => { const node = document.createElement("span"); node.style.color = `var(${token})`; document.body.append(node); const value = getComputedStyle(node).color; node.remove(); return value; };
    const modal = [...document.querySelectorAll(".ant-modal-container")].find((el) => el.getBoundingClientRect().height > 0) || [...document.querySelectorAll("[role=dialog]")].find((el) => el.getBoundingClientRect().height > 0);
    const visibleHeader = [...document.querySelectorAll("main .ant-table-thead th")].find((el) => el.getBoundingClientRect().height > 1 && !el.closest('.ant-table-measure-row'));
    const visibleCell = [...document.querySelectorAll("main .ant-table-tbody td.ant-table-cell")].find((el) => el.getBoundingClientRect().height > 1 && !el.closest('.ant-table-measure-row'));
    for (const container of document.querySelectorAll("main .ant-table-content, main .ant-table-body")) {
      if (container.scrollWidth > container.clientWidth + 5 && container.clientWidth > 0) {
        container.scrollLeft = 100;
        if (container.scrollLeft === 0) throw new Error("wide table cannot scroll");
        container.scrollLeft = 0;
      }
    }
    return { width: innerWidth, scrollWidth: root.scrollWidth, dark: root.classList.contains("dark"), foreground: resolve("--foreground"), card: resolve("--card"), muted: resolve("--muted"), header: sample(document.querySelector("main .ant-table-thead th")), cell: sample(document.querySelector("main .ant-table-tbody td")), modal: sample(modal), tables: [...document.querySelectorAll("main .ant-table-content, main .ant-table-body")].map((el) => ({ client: el.clientWidth, scroll: el.scrollWidth })), overflow: [...document.querySelectorAll("main *")].filter((el) => { const rect = el.getBoundingClientRect(); return rect.width > 0 && rect.right > innerWidth + 2 && !el.closest(".ant-table, .ant-table-container, .ant-select-dropdown, .ant-tabs-nav, .milestone-scale-viewport"); }).slice(0, 8).map((el) => ({ tag: el.tagName, class: el.className, right: Math.round(el.getBoundingClientRect().right) })), radius: css.getPropertyValue("--radius-card").trim() };
  });
  const key = `${id}-${width}-${mode}${suffix}`;
  await page.screenshot({ path: `${output}/${key}.png`, fullPage: true });
  const failures = [];
  if (metrics.scrollWidth > width + 1) failures.push("document overflow");
  if (metrics.dark !== (mode === "dark")) failures.push("wrong mode");
  if (metrics.header && metrics.header.background !== metrics.muted) failures.push("table header theme mismatch");
  if (metrics.header && metrics.header.contrast < 4.5) failures.push("header contrast below 4.5");
  if (metrics.cell && metrics.cell.contrast < 4.5) failures.push("cell contrast below 4.5");
  if (suffix.startsWith("-modal") && (!metrics.modal || metrics.modal.background !== metrics.card)) failures.push("modal theme mismatch");
  if (suffix.startsWith("-modal") && metrics.modal && metrics.modal.contrast < 4.5) failures.push("modal contrast below 4.5");
  if (suffix.startsWith("-modal") && metrics.modal && (metrics.modal.left < -1 || metrics.modal.right > width + 1 || metrics.modal.scrollWidth > metrics.modal.clientWidth + 1)) failures.push("modal horizontal overflow");
  results.push({ key, ...metrics, failures });
  console.log(`${failures.length ? "FAIL" : "PASS"} ${key} ${JSON.stringify({ scrollWidth: metrics.scrollWidth, failures, overflow: metrics.overflow })}`);
}

function readLiveCharts() {
  const nodes = [...document.querySelectorAll('.echarts-for-react')].filter((el) => el.getBoundingClientRect().height > 0);
  if (!nodes.length) return null;
  const charts = [];
  for (const el of nodes) {
    let fiber = el[Object.keys(el).find((key) => key.startsWith('__reactFiber$'))];
    while (fiber && !fiber.stateNode?.getEchartsInstance) fiber = fiber.return;
    if (!fiber) return null;
    const instance = fiber.stateNode.getEchartsInstance();
    if (!instance || instance.isDisposed()) return null;
    const option = instance.getOption();
    if (!option || !option.series?.length) return null;
    const heatmap=option.visualMap?.[0]?.inRange?.color;
    if(heatmap) {
      for(const color of heatmap) if(!fiber.stateNode.echarts.color.parse(color)) throw new Error(`ECharts cannot parse map color: ${color}`);
      // Exercise the same interpolation path that crashes on CSS color-mix().
      fiber.stateNode.echarts.color.lerp(.5,heatmap);
    }
    charts.push({ owned: !!fiber.stateNode.props.option.textStyle?.color, data: JSON.stringify(option.series.map((series) => series.data)), text: option.textStyle?.color, legend: option.legend?.[0]?.textStyle?.color, xAxis: option.xAxis?.[0]?.axisLabel?.color, yAxis: option.yAxis?.[0]?.axisLabel?.color, tooltip: option.tooltip?.[0]?.backgroundColor, accent: option.color?.[0], seriesColors: option.series.map((series) => series.itemStyle?.color), heatmap: option.visualMap?.[0]?.inRange?.color });
  }
  const css = getComputedStyle(document.documentElement);
  return {foreground:css.getPropertyValue('--foreground').trim(),muted:css.getPropertyValue('--muted-foreground').trim(),card:css.getPropertyValue('--card').trim(),accent:css.getPropertyValue('--accent').trim(),charts};
}

async function verifyLiveChartTheme(page, id, mode) {
  await page.waitForFunction(readLiveCharts, undefined, {timeout:15000});
  const beforeRequests = apiRequests.length;
  const pageIdentity = await page.evaluate(() => { window.__chartThemePageIdentity ??= crypto.randomUUID(); return window.__chartThemePageIdentity; });
  const initial = await page.evaluate(readLiveCharts);
  const dataBefore = initial.charts.map((chart)=>chart.data);
  for (const next of [{ mode: "light", palette: "haitian" }, { mode: "dark", palette: "haitian" }, { mode: "dark", palette: "qingdai" }, { mode: "light", palette: "qingdai" }]) {
    await page.evaluate((next) => {
      const root = document.documentElement;
      root.classList.remove("light", "dark"); root.classList.add(next.mode);
      root.dataset.palette = next.palette;
    }, next);
    await page.waitForFunction(({read,count})=>{
      const snapshot=(0,eval)(`(${read})`)();
      return snapshot && snapshot.charts.length===count && snapshot.charts.filter(c=>c.owned).every(c=>c.text===snapshot.foreground && (!c.legend||c.legend===snapshot.muted) && (!c.xAxis||c.xAxis===snapshot.muted) && (!c.yAxis||c.yAxis===snapshot.muted) && (!c.tooltip||c.tooltip===snapshot.card));
    }, {read:readLiveCharts.toString(),count:initial.charts.length}, {timeout:15000});
    const snapshot = await page.evaluate(readLiveCharts);
    assert.deepEqual(snapshot.charts.map(c=>c.data),dataBefore,`${id}: theme switch changed chart data`);
    snapshot.charts=snapshot.charts.filter(c=>c.owned);
    assert.ok(snapshot.charts.length, `${id}: no chart mounted`);
    for (const chart of snapshot.charts) {
      assert.equal(chart.text, snapshot.foreground, `${id}: stale chart text ${JSON.stringify({next,chart,snapshot})}`);
      if (chart.legend) assert.equal(chart.legend, snapshot.muted, `${id}: stale legend`);
      if (chart.xAxis) assert.equal(chart.xAxis, snapshot.muted, `${id}: stale x axis`);
      if (chart.yAxis) assert.equal(chart.yAxis, snapshot.muted, `${id}: stale y axis`);
      if (chart.tooltip) assert.equal(chart.tooltip, snapshot.card, `${id}: stale tooltip`);
      if (id.startsWith('proportion')) assert.equal(chart.seriesColors[3], snapshot.accent, `${id}: stale series palette`);
      if (id.startsWith('wca-player') && !id.includes('litCities')) assert.equal(chart.accent, snapshot.accent, `${id}: stale series palette`);
      if (id === 'wca-player-litCities') assert.equal(chart.heatmap.at(-1), snapshot.accent, `${id}: stale map palette`);
    }
    if(id.includes('litCities')) {
      const chart=page.locator('.wca-lit-cities .echarts-for-react:visible');
      await chart.scrollIntoViewIfNeeded();
      const box=await chart.boundingBox();
      for(const offset of [30,60,90]) await page.mouse.move(box.x+35,box.y+box.height-offset);
      await page.waitForTimeout(100);
    }
    console.log(`PASS live chart ${id} ${next.mode}/${next.palette}: ${snapshot.charts.length} instances`);
    results.push({ key: `${id}-live-${next.mode}-${next.palette}-${mode}`, failures: [], liveChart: snapshot });
  }
  assert.equal(await page.evaluate(() => window.__chartThemePageIdentity), pageIdentity, 'theme switch must not reload');
  const dataAfter = (await page.evaluate(readLiveCharts)).charts.map(c=>c.data);
  assert.deepEqual(dataAfter, dataBefore, `${id}: theme switch changed chart data`);
  assert.equal(apiRequests.length, beforeRequests, `${id}: theme switch refetched API data`);
  await page.evaluate((mode) => { document.documentElement.classList.remove('light','dark'); document.documentElement.classList.add(mode); document.documentElement.dataset.palette='haitian'; }, mode);
  await page.waitForFunction(({read})=>{const s=(0,eval)(`(${read})`)();return s&&s.charts.filter(c=>c.owned).every(c=>c.text===s.foreground);},{read:readLiveCharts.toString()});
}

try {
  for (const mode of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width: chartWidth, height: 900 }, colorScheme: mode, serviceWorkers: "block" });
    await context.addInitScript(({ mode }) => {
      localStorage.setItem("cubing-pro-theme", mode);
      localStorage.setItem("cubing-pro-palette", "haitian");
      localStorage.setItem("cubing_pro_websize_ui_config", JSON.stringify({ palette: "haitian" }));
      localStorage.setItem("authToken_cubing_pro", JSON.stringify({ token: "offline-visual-fixture", expire: "2099-01-01" }));
    }, { mode });
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const marker = "/v3/cube-api";
      const apiIndex = url.pathname.indexOf(marker);
      if (apiIndex >= 0) {
        const path = decodeURI(url.pathname.slice(apiIndex + marker.length));
        apiRequests.push({ method: request.method(), path });
        if (!["GET", "HEAD", "OPTIONS"].includes(request.method()) && !["/public/comps/", "/public/player/", "/admin/users/", "/public/statistics/kinch", "/public/statistics/kinch/senior", "/public/statistics/records"].includes(path) && !path.startsWith("/wca/rank")) mutations.push({ method: request.method(), path });
        return route.fulfill({ status: 200, headers: { "access-control-allow-origin": origin, "access-control-allow-headers": "*", "access-control-allow-methods": "*" }, contentType: "application/json", body: JSON.stringify(fixture(path)) });
      }
      if (url.hostname.includes("worldcubeassociation")) return route.fulfill({ status: 200, headers: { "access-control-allow-origin": "*" }, contentType: "application/json", body: JSON.stringify(url.pathname.includes("competition") ? [wcaComp] : { person: { avatar: { thumb_url: "" } } }) });
      if (url.origin === origin || url.origin === origin.replace("localhost", "127.0.0.1")) return route.continue();
      external.add(url.origin);
      return route.abort();
    });
    const page = await context.newPage();
    let active = "";
    page.on("pageerror", (error) => errors.push({ route: active, mode, message: error.message, stack:error.stack }));
    for (const [id, path, ready] of routes) {
      active = id;
      await page.setViewportSize({ width: chartWidth, height: 900 });
      if (id === "login") await page.addInitScript(() => localStorage.removeItem("authToken_cubing_pro"));
      try {
        const response = await page.goto(`${origin}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
        assert.equal(response.status(), 200);
        await page.locator(ready).first().waitFor({ timeout: 15000 });
        await page.waitForTimeout(1000);
        if (id === "wca-search") { await page.locator(".wca-page input").fill("Test"); await page.getByRole("cell", { name: "视觉测试选手", exact: true }).waitFor({ timeout: 10000 }); }
        if (id === "wca-player-history") { await page.locator(".view-mode-toggle .toggle-option").nth(1).click(); await page.locator(".historical-sort-toggle").waitFor(); }
        if (id === "wca-player-byComp") { await page.locator('.wca-result-group-tabs > .ant-tabs-nav [role=tab]').nth(1).click(); await page.locator('.wca-by-comp-comp-card').waitFor(); }
        if (id === "admin-groups") { await page.locator('.admin-page .ant-select').click(); await page.locator('.ant-select-item-option:visible').filter({hasText: org.Name}).click(); await page.locator('.admin-page .ant-table').waitFor(); }
        await page.waitForTimeout(350);
        if (process.env.VISUAL_CHART_THEME === "1" && ["proportion", "wca-player", "gc-player", "wca-player-litCities"].includes(id)) {
          if (id !== "gc-player") await verifyLiveChartTheme(page, id, mode);
          if (id === "wca-player") {
            await page.getByRole('tab', {name: '单次成绩分布', exact: true}).click();
            await verifyLiveChartTheme(page, `${id}-distribution`, mode);
          }
          if (id === "gc-player") {
            for (const label of ['成绩分位(单次)', '成绩分位(平均)', '成绩分布']) {
              await page.getByRole('tab', {name:label, exact:true}).click();
              await verifyLiveChartTheme(page, `${id}-${label}`, mode);
            }
          }
          if (id === "wca-player-litCities") {
            await page.locator('.wca-lit-cities .ant-segmented').nth(1).locator('.ant-segmented-item').nth(1).click();
            await page.locator('.wca-lit-cities-chart-host--china .echarts-for-react').waitFor();
            await verifyLiveChartTheme(page, `${id}-china`, mode);
            const chinaChart=page.locator('.wca-lit-cities-chart-host--china .echarts-for-react');
            const point=await chinaChart.evaluate((el)=>{
              let fiber=el[Object.keys(el).find(k=>k.startsWith('__reactFiber$'))];
              while(fiber&&!fiber.stateNode?.getEchartsInstance) fiber=fiber.return;
              return fiber.stateNode.getEchartsInstance().convertToPixel({seriesIndex:0},[121.47,31.23]);
            });
            await chinaChart.click({position:{x:point[0],y:point[1]}});
            await page.locator('.wca-lit-cities-chart-host--province .echarts-for-react').waitFor();
            await verifyLiveChartTheme(page,`${id}-province`,mode);
            await page.getByRole('button',{name:'返回中国地图',exact:true}).click();
            await page.locator('.wca-lit-cities-chart-host--china .echarts-for-react').waitFor();
            await verifyLiveChartTheme(page,`${id}-china-return`,mode);
            for (let i=0;i<4;i++) {
              await page.locator('.wca-lit-cities .ant-segmented').nth(1).locator('.ant-segmented-item').nth(0).click();
              await page.waitForFunction(readLiveCharts);
              await page.locator('.wca-lit-cities .ant-segmented').nth(1).locator('.ant-segmented-item').nth(1).click();
              await page.waitForFunction(readLiveCharts);
            }
            await verifyLiveChartTheme(page,`${id}-china-repeated`,mode);
          }
        }
        for (const width of [390, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          await page.waitForTimeout(120);
          await probe(page, id, mode, width);
        }
        if (["admin-users", "admin-organizers", "admin-groups", "admin-diy", "admin-thanks", "admin-links", "profile", "proportion"].includes(id)) {
          const label = {"admin-users":"创建用户", "admin-organizers":"新建团队", "admin-groups":"新建群组", "admin-diy":"添加", "admin-thanks":"新增", "admin-links":"添加分组", "profile":"更新头像", "proportion":"算法"}[id];
          const button = page.getByRole("button", { name: new RegExp(label.split("").join("\\s*")) });
          assert.ok(await button.count(), `modal trigger missing: ${id}`);
          {
            await button.first().click();
            await page.locator('[role=dialog]:visible').last().waitFor();
            await page.waitForTimeout(350);
            for (const width of [390, 1440]) { await page.setViewportSize({ width, height: 900 }); await page.waitForTimeout(200); await probe(page, id, mode, width, "-modal"); }
            await page.keyboard.press("Escape");
          }
        }
        if (id === "admin-users") {
          await page.locator(".ant-modal:visible").waitFor({state:"hidden"});
          await page.getByRole("button", {name:/软\s*删\s*除/, exact:true}).first().click();
          await page.locator(".ant-modal-confirm:visible").waitFor();
          await page.waitForTimeout(350);
          for (const width of [390, 1440]) { await page.setViewportSize({width,height:900}); await page.waitForTimeout(150); await probe(page,id,mode,width,"-modal-confirm"); }
          await page.getByRole("button",{name:/取\s*消/,exact:true}).last().click();
          await page.locator(".ant-modal:visible").waitFor({state:"hidden"});
          const switched = mode === "dark" ? "light" : "dark";
          await page.evaluate((next) => { document.documentElement.classList.remove("light","dark"); document.documentElement.classList.add(next); }, switched);
          await page.waitForTimeout(250);
          await page.getByRole("button", {name:/软\s*删\s*除/,exact:true}).first().click();
          await page.locator(".ant-modal-confirm:visible").waitFor();
          await page.waitForTimeout(350);
          await probe(page,id,switched,1440,"-modal-theme-switch");
          await page.getByRole("button",{name:/取\s*消/,exact:true}).last().click();
          await page.evaluate((next) => { document.documentElement.classList.remove("light","dark"); document.documentElement.classList.add(next); }, mode);
        }
      } catch (error) {
        results.push({ key: `${id}-${mode}`, failures: [error.message] });
        console.log(`ERROR ${id}-${mode}: ${error.message}`);
        console.log(await page.locator("main").innerText().catch(() => "no main"));
        await page.screenshot({ path: `${output}/${id}-${mode}-failure.png`, fullPage: true }).catch(() => {});
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
  const report = { origin, results, errors, unknown: [...unknown], blockedExternalOrigins: [...external], apiRequestCount: apiRequests.length, mutationsIntercepted: mutations };
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ screenshots: results.filter((r) => r.width).length, failed: results.filter((r) => r.failures.length).length, errors, unknown: [...unknown], apiRequestCount: apiRequests.length, mutations, report: `${output}/report.json` }, null, 2));
}
process.exitCode = results.some((r) => r.failures.length) || errors.length ? 1 : 0;
