import assert from "node:assert/strict";
import { createServer } from "node:http";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const noNetwork = () => { throw new Error("Node network disabled in browser tests"); };
http.request = noNetwork; http.get = noNetwork; https.request = noNetwork; https.get = noNetwork;
net.connect = noNetwork; net.createConnection = noNetwork; net.Socket.prototype.connect = noNetwork;
globalThis.fetch = noNetwork;

// Entirely offline: bundles live in memory, Axios uses a local adapter, and
// Playwright blocks every origin except this harness. No Next/build artifacts.
const root = fileURLToPath(new URL("../../../", import.meta.url));
const navigation = `
import { useSyncExternalStore } from 'react';
const subscribe = (fn) => { addEventListener('popstate', fn); return () => removeEventListener('popstate', fn); };
const move = (url, replace = false) => { history[replace ? 'replaceState' : 'pushState']({}, '', url); dispatchEvent(new PopStateEvent('popstate')); };
const router = { push: (url) => move(url), replace: (url) => move(url, true), back: () => history.back() };
export const useRouter = () => router;
export const usePathname = () => useSyncExternalStore(subscribe, () => location.pathname);
export const useSearchParams = () => new URLSearchParams(useSyncExternalStore(subscribe, () => location.search));
export const useParams = () => ({});
`;
const auth = `export const useAuth = () => ({ currentUser: sessionStorage.getItem('test-unauthenticated') ? null : { id: 1, Auth: Number(new URLSearchParams(location.search).get('auth') || 8) }, loading: false });`;
const editor = `import React from 'react'; export default function Editor({ value, onChange }) { return <textarea aria-label="description" value={value || ''} onChange={(e) => onChange(e.target.value)} />; }`;
const entry = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from '@/theme';
import { usePathname } from 'next/navigation';
import { AdminCompetitionApprovalsPageView, OrganizersCompsPageView } from '@/views/admin/OrganizersCompsPageView';
import { OrganizersResultsPageView } from '@/views/admin/OrganizersResultsPageView';
import { OrganizersCreateCompsPageView } from '@/views/admin/OrganizersCreateCompsPageView';
import { Request } from '@/services/cubing-pro/request';
import { Table } from 'antd';
import { CompsTableColumns } from '@/components/Data/cube_comps/comps_tables';
import CompetitionDetail from '@/views/Competition/CompetitionComponents/CompetitionDetail';
import '@/styles/tokens.css';
window.__requests = [];
window.__reviewFixtures = [];
const s = (RoundNum, IsRunning) => ({ RoundNum, IsRunning, Round: RoundNum === 1 ? '初赛' : '决赛', Competitors: 0, TimeLimit: 0, Cutoff: 0, CutoffNumber: 0, Scrambles: [], Format: 'ao5' });
const ev = (id) => ({ Key: id, EventID: id, EventName: id, EventRoute: id === '333mbf' ? 8 : 7, Schedule: [s(1, true), { ...s(2, false), Competitors: 8, NoRestrictions: id === '333' }] });
const detail = { id: 42, Name: '隔离测试群赛', Status: 'Running', IsDone: false, OrganizersID: 7, GroupId: 70, Genre:5, Count: 500, CanPreResult: true, CompStartTime: '2026-11-13T00:00:00+08:00', CompEndTime: '2026-11-14T00:00:00+08:00', comp_json: { Events: [ev('333'), ev('222'), ev('333mbf')], Cost: { BaseCost: { Value: 0 } } } };
if (sessionStorage.getItem('test-status')) detail.Status = sessionStorage.getItem('test-status');
const legacy = { ...detail, id:43, Name:'原有非群线上比赛', Genre:3, GroupId:70, IsDone:true, CompStartTime:'2020-01-01T09:12:13.123456+09:00', CompEndTime:'2020-01-03T19:22:23.654321-07:00', comp_json: { ...detail.comp_json, Events:[{...ev('333'),Schedule:[s(1,false)]}] } };
const pending = [101,102].map((id) => ({ id, createdAt: '2026-11-13T01:00:00Z', updatedAt: '2026-11-13T01:00:00Z', CubeID: 'cube-7', PersonName: '测试选手', EventID: '333', EventRoute: 7, Round: '初赛', RoundNumber: 1, Result: [1,2,3,4,5], Finish: false, FinishDetail: 'wait', Source: 'web-api' }));
Request.defaults.adapter = async (config) => {
  const body = config.data ? JSON.parse(config.data) : undefined;
  const req = { method: config.method, url: config.url, params: config.params, body };
  window.__requests.push(req);
  let data;
  const url = config.url;
  const longNames = sessionStorage.getItem('test-long-names');
  if (url === '/public/events') data = { UpdateTime: '2026-11-13T00:00:00Z', Events: ['333','222','333mbf'].map((id) => ({ id, cn: id, isComp: true, base_route_typ: id === '333mbf' ? 8 : 7 })) };
  else if (url.includes('/public/competition/events')) throw new Error('Unexpected event URL');
  else if (url === '/organizers/me') data = { items: sessionStorage.getItem('test-no-team') ? [] : [{id:7, Name:'团队七'}, {id:8, Name:'团队八'}], total:2 };
  else if (url === '/organizers/7/comp/43') {
    if (config.method === 'post') Object.assign(legacy,body);
    data = legacy;
  }
  else if (url === '/organizers/7/comp/43/result' && config.method === 'post') data = null;
  else if (url.startsWith('/admin/competition/comps/43')) throw new Error('Non-group competition incorrectly used admin group-only service');
  else if (url === '/admin/competition/filters') data = { organizers:[{id:7, Name:'团队七'}, {id:8, Name:'团队八'}], groups:[{id:70,Name:'群七',OrganizersID:7},{id:80,Name:'群八',OrganizersID:8}] };
  else if (url.endsWith('/groups')) data = { items: [{id:url.includes('/7/') ? 70 : 80, name:'群组测试'}], total:1 };
  else if (url === '/admin/competition/approvals/comps' || /^\\/organizers\\/\\d+\\/comp\\/$/.test(url) && config.method === 'get') data = { items: [{ ...detail, Status: 'Reviewing', OrganizersName: '团队七', GroupId:70, GroupName:'群七', PendingCount:2, EventMin:'333;222' }], total:42, next:true };
  else if (url.endsWith('/refresh_event')) {
    if (body.All && sessionStorage.getItem('test-round-http-error')) {
      sessionStorage.removeItem('test-round-http-error');
      throw Object.assign(new Error('Request failed with status code 400'), { response: { status: 400, data: { error: '开放失败：测试接口参数错误' } } });
    }
    if (body.All) detail.comp_json.Events.forEach((ev) => ev.Schedule.forEach((round) => { round.IsRunning = true; }));
    else {
      const ev = detail.comp_json.Events.find((ev) => ev.EventID === body.EventID);
      ev.Schedule.find((round) => round.RoundNum === body.RoundNumber).IsRunning = body.Open;
    }
    data = null;
  }
  else if (url.endsWith('/pre_results')) {
    const params = config.params;
    const status = params.review_status;
    const terminal = params.finishDetail || (status === 'passed' ? 'ok' : status === 'rejected' ? 'not' : '');
    if (terminal && params.finish === 'false') return {data:{code:'400', error:'终态筛选与finish=false冲突'}, status:200, headers:{}, config};
    let rows = [...pending, ...window.__reviewFixtures];
    const finish = terminal ? 'true' : params.finish || 'false';
    if (finish === 'false') rows = rows.filter((r) => !r.Finish);
    if (finish === 'true') rows = rows.filter((r) => r.Finish);
    if (terminal) rows = rows.filter((r) => r.FinishDetail === terminal);
    const page = Number(params.page || 1), size = Number(params.size || 20);
    data = {items:rows.slice((page - 1) * size, page * size), total:rows.length, next:page * size < rows.length};
  }
  else if (url.includes('/pre_results/') && url.endsWith('/approval')) {
    await new Promise((resolve) => setTimeout(resolve, 180));
    const id = Number(url.split('/').at(-2));
    if (detail.Status !== 'Running') return {data:{code:'400', error:'比赛未审批'}, status:200, headers:{}, config};
    if (id === 102 && body.FinishDetail === 'ok' && !window.__retryApprovals) return {data:{code:'400', error:'旧单资格不合法'}, status:200, headers:{}, config};
    const row = pending.find((r) => r.id === id); row.Finish = true; row.FinishDetail = body.FinishDetail; if (body.HistoricalConfirmed) row.Detail = 'ok; HistoricalConfirmed=true; ReviewReason=' + body.ReviewReason; data = null;
  }
  else if (url.endsWith('/end')) {
    if (!detail.IsDone) {
      detail.IsDone = true;
      detail.comp_json.ResultClosedAt = new Date(Date.now()).toISOString();
      detail.comp_json.Events.forEach((ev) => ev.Schedule.forEach((s) => { s.IsRunning = false; }));
    }
    if (window.__legacyCutoff) delete detail.comp_json.ResultClosedAt;
    data = null;
  }
  else if (url.endsWith('/players')) data = [{id:11, UserID:2, UserName:'测试选手', Status:'wait_apply', Events:'["333"]'}];
  else if (url.includes('/players/approval/')) data = null;
  else if (url === '/public/player/') data = { items: body.page === 1 ? [{CubeID:'cube-7', Name:'测试选手'}] : [{CubeID:'cube-8', Name:'另一位选手'}], total:2 };
  else if (url.endsWith('/result') && config.method === 'post') {
    if (detail.Status !== 'Running') return {data:{code:'400', error:'比赛未审批'}, status:200, headers:{}, config};
    await new Promise((resolve) => setTimeout(resolve, 180));
    if (body.EventId === '222' && !window.__retryResults) return {data:{code:'400', error:'资格不足'}, status:200, headers:{}, config};
    data = null;
  }
   else if (url.endsWith('/result/501') && config.method === 'delete') data = null;
   else if (url.endsWith('/result')) data = [{ id: 501, PersonName: '历史正式选手', CubeID: 'history-player', EventID: config.params.event_id || '333', Round: '历史轮次', EventRoute: 7, Result: [11,12,13,14,15], Best: 11, Average: 13 }];
  else if (url.endsWith('/approval')) data = null;
  else if (/\\/(?:comp|comps)\\/42$/.test(url)) {
    if (config.method === 'post') Object.assign(detail, body);
    data = detail;
  }
  else if (/\\/organizers\\/\\d+\\/comp\\/$/.test(url) && config.method === 'post') data = detail;
  else if (url.endsWith('/update_name')) { detail.Name = body.newName; data = null; }
  else throw new Error('Unmocked request: ' + url);
  if (url.startsWith('/organizers/') && url.endsWith('/comp/') && config.method === 'get') data.items.push(legacy);
  if (longNames && url.endsWith('/approvals/comps')) {
    data.items[0].Name = '这是一个用于检查二十到三十字符名称完整显示的测试群赛名称';
    data.items[0].OrganizersName = '这是一个用于检查二十到三十字符名称完整显示的主办团队名称';
    data.items[0].GroupName = '这是一个用于检查二十到三十字符名称完整显示的比赛群组名称';
  }
  return { data:{code:'200', data:JSON.parse(JSON.stringify(data))}, status:200, statusText:'OK', headers:{}, config };
};
function App() {
  const pathname = usePathname();
  if (pathname === '/login') return <div>Isolated login redirect</div>;
  if (pathname === '/public-probe') {
    const base = {...detail, EventMin:'333', OrganizersID:0, CompEndTime:'2026-11-12T00:00:00+08:00', Genre:5};
    const group = {...base, id:10, GroupId:70, Name:'公共群赛'};
    const legacy = {...base, id:11, GroupId:0, Name:'原有线上赛'};
    return <ChakraProvider value={system}><section id="public-list"><Table columns={CompsTableColumns} dataSource={[group, legacy]} rowKey="id" /></section><section id="group-detail"><CompetitionDetail comp={{data:group}} /></section><section id="legacy-detail"><CompetitionDetail comp={{data:legacy}} /></section></ChakraProvider>;
  }
  const view = pathname.includes('/create') ? <OrganizersCreateCompsPageView /> : pathname.includes('/approvals') ? <AdminCompetitionApprovalsPageView /> : pathname.replace(/\\/$/, '').endsWith('/comps') ? <OrganizersCompsPageView /> : <OrganizersResultsPageView admin={pathname.includes('/competition/manage')} />;
  return <ChakraProvider value={system}><main style={{padding:16, minWidth:0}}>{view}</main></ChakraProvider>;
}
createRoot(document.getElementById('root')).render(<App />);
`;
const bundle = await build({
  stdin: { contents: entry, loader: "tsx", resolveDir: root }, bundle: true, write: false,
  outfile: "harness.js", platform: "browser", format: "iife", jsx: "automatic",
  loader: { ".woff": "dataurl" },
  define: { "process.env.NODE_ENV": '"test"', "process.env.NEXT_PUBLIC_API_BASE": '"http://offline.invalid"', "process.env.NEXT_PUBLIC_DEV_API_BASE": '"http://offline.invalid"' },
  tsconfig: path.join(root, "tsconfig.json"),
  plugins: [{ name: "isolated-context", setup(build) {
    build.onResolve({ filter: /^next\/(navigation|link)$/ }, ({ path }) => ({ path, namespace: "harness" }));
    build.onResolve({ filter: /contexts\/(AuthProvider|I18nProvider)$/ }, ({ path }) => ({ path, namespace: "harness" }));
    build.onResolve({ filter: /components\/Markdown\/editer$/ }, ({ path }) => ({ path, namespace: "harness" }));
    build.onLoad({ filter: /.*/, namespace: "harness" }, ({ path: name }) => ({ contents: name === "next/navigation" ? navigation : name === "next/link" ? `import React from 'react'; export default function Link(props) {return <a {...props} />;}` : name.endsWith("AuthProvider") ? auth : name.endsWith("I18nProvider") ? `export const useI18n = () => ({ t: (key) => key });` : editor + `export const EditorView = (value) => <div>{value}</div>;`, loader: "tsx", resolveDir: root }));
  } }],
});
const js = bundle.outputFiles.find((file) => file.path.endsWith(".js")).text;
const css = bundle.outputFiles.find((file) => file.path.endsWith(".css"))?.text ?? "";
const server = createServer((req, res) => {
  res.setHeader("Content-Type", req.url === "/harness.js" ? "text/javascript" : "text/html; charset=utf-8");
  res.end(req.url === "/harness.js" ? js : `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script src="/harness.js"></script></body></html>`);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, args: ["--disable-background-networking", "--disable-component-update", "--disable-domain-reliability", "--disable-sync", "--no-pings", "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: "America/Los_Angeles", serviceWorkers: "block" });
const blocked = [];
await context.route("**/*", (route) => {
  if (new URL(route.request().url()).origin === origin) return route.continue();
  blocked.push(route.request().url());
  return route.abort();
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.addInitScript(() => {
  const started = performance.now();
  Date.now = () => (Number(sessionStorage.getItem("test-now")) || Date.parse("2026-11-13T08:00:00Z")) + Math.floor(performance.now() - started);
});
const requests = () => page.evaluate(() => window.__requests);
const waitRequest = async (predicate) => {
  await page.waitForFunction(`(${predicate.toString()})(window.__requests)`);
};
try {
  await page.goto(`${origin}/admin/competition/approvals?name=测试&groupId=70&page=2&size=20`);
  await page.getByRole("heading", { name: "管理员群赛审批" }).waitFor();
  await page.getByRole('link', { name: '隔离测试群赛', exact: true }).waitFor();
  assert.ok((await requests()).every((r) => !r.url.startsWith("/organizers/")), "admin must not require team membership");
  const initial = (await requests()).find((r) => r.url.endsWith("/approvals/comps"));
  assert.equal(initial.params.name, "测试"); assert.equal(initial.params.page, 2); assert.equal(initial.params.status, "Reviewing");
  const managementLink = new URL(await page.getByRole("link", { name: "比赛管理", exact: true }).getAttribute("href"), origin);
  assert.equal(managementLink.pathname, "/admin/competition/manage");
  assert.equal(managementLink.searchParams.get("returnTo"), "/admin/competition/approvals?name=%E6%B5%8B%E8%AF%95&groupId=70&page=2&size=20");
  await page.locator('#orgId').fill('团队七');
  await page.locator('.ant-select-item-option:visible').filter({ hasText: /^团队七$/ }).click();
  await page.locator('#groupId').fill('群七');
  await page.locator('.ant-select-item-option:visible').filter({ hasText: /^群七$/ }).click();
  await page.locator('button').filter({ hasText: /^查询$/ }).click();
  await waitRequest((rows) => rows.some((r) => r.url.endsWith('/approvals/comps') && r.params.orgId === '7' && r.params.groupId === '70'));
  assert.ok((await requests()).some((r) => r.url === '/admin/competition/filters'), 'ordinary admin loads read-only options without super-admin APIs');
  await page.waitForFunction(() => [...document.querySelectorAll('.ant-select-dropdown')].every((el) => getComputedStyle(el).display === 'none'));
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `list overflow ${width}`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "驳回", exact: true }).click();
  await page.locator(".ant-modal-confirm textarea").fill("申请材料不完整");
  await page.locator(".ant-modal-confirm").getByRole("button", { name: /驳\s*回/ }).click();
  await waitRequest((rows) => rows.some((r) => r.body?.Ok === false));
  assert.equal((await requests()).find((r) => r.body?.Ok === false).body.RejectMsg, "申请材料不完整");
  console.log("PASS admin global list, URL filters, rejection and responsive cards");

  await page.goto(`${origin}/admin/competition/manage?compId=42&input_tabs=manage`);
  await page.getByRole("heading", { name: "#42 隔离测试群赛" }).waitFor();
  await page.getByText(/团队七 · 群七 ·/).waitFor();
  const switcher = page.locator('.ant-card').filter({ hasText: '按团队 / 群组选择审批比赛' });
  await switcher.locator('#orgId').fill('团队七');
  await page.locator('.ant-select-item-option:visible').filter({ hasText: /^团队七$/ }).click();
  await switcher.locator('#groupId').fill('群七');
  await page.locator('.ant-select-item-option:visible').filter({ hasText: /^群七$/ }).click();
  await switcher.locator('button').filter({ hasText: '查找比赛' }).click();
  await waitRequest((rows) => rows.some((r) => r.url.endsWith('/approvals/comps') && r.params.orgId === '7' && r.params.groupId === '70'));
  await page.getByRole("button", { name: "关闭轮次", exact: true }).first().click();
  await page.locator(".ant-modal-confirm").getByRole("button", { name: /确\s*认/ }).click();
  await waitRequest((rows) => rows.some((r) => r.url.endsWith("refresh_event") && r.body.Open === false));
  await page.locator(".ant-modal-confirm").waitFor({ state: "hidden" });
  await page.evaluate(() => sessionStorage.setItem('test-round-http-error', '1'));
  await page.getByRole("button", { name: "一键开放全部轮次", exact: true }).click();
  await page.locator(".ant-modal-confirm").getByRole("button", { name: /确\s*认/ }).click();
  await page.getByText('开放失败：测试接口参数错误', { exact: true }).waitFor();
  await page.locator(".ant-modal-confirm").waitFor({ state: "hidden" });
  assert.equal(errors.length, 0, 'HTTP 400 must be handled without an unhandled rejection');
  assert.equal(await page.getByRole("button", { name: "一键开放全部轮次", exact: true }).isEnabled(), true);
  await page.getByRole("button", { name: "一键开放全部轮次", exact: true }).click();
  await page.locator(".ant-modal-confirm").getByRole("button", { name: /确\s*认/ }).click();
  await waitRequest((rows) => rows.some((r) => r.url.endsWith("refresh_event") && r.body.All === true && r.body.Open === true));
  await page.locator(".ant-modal-confirm").waitFor({ state: "hidden" });
  await page.waitForFunction(() => [...document.querySelectorAll('button')].find((button) => button.textContent === '一键开放全部轮次')?.disabled);
  assert.equal(await page.getByRole("button", { name: "开放轮次", exact: true }).count(), 0);
  await page.getByRole("button", { name: "关闭轮次", exact: true }).first().click();
  await page.locator(".ant-modal-confirm").getByRole("button", { name: /确\s*认/ }).click();
  await page.locator(".ant-modal-confirm").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "开放轮次", exact: true }).first().click();
  await page.locator(".ant-modal-confirm").getByRole("button", { name: /确\s*认/ }).click();
  await waitRequest((rows) => rows.some((r) => r.url.endsWith("refresh_event") && r.body.Open === true));
  await page.locator(".ant-modal-confirm").waitFor({ state: "hidden" });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `management overflow ${width}`);
  }
  console.log("PASS admin team-independent detail and manual round open/close");

  await page.locator('button').filter({ hasText: /^安排赛程$/ }).first().click();
  const scheduleModal = page.locator('.ant-modal').filter({ hasText: '后续轮次默认按晋级名单' });
  await scheduleModal.getByText('无限制', { exact: true }).waitFor();
  await scheduleModal.getByText('无限制不会校验晋级名单；如需限制人数，请选择按晋级名单。', { exact: true }).waitFor();
  await scheduleModal.getByRole('spinbutton', { name: '第 2 轮晋级人数', exact: true }).fill('6');
  await scheduleModal.locator('.ant-modal-footer button').last().click();

  await page.locator("#Name").fill("隔离测试群赛改名");
  await page.locator("#Count").fill("123");
  await page.locator("button").filter({ hasText: "保存比赛" }).click();
  await page.getByRole("heading", { name: "#42 隔离测试群赛改名" }).waitFor();
  const edited = (await requests()).find((r) => r.method === 'post' && r.url === '/admin/competition/comps/42');
  assert.equal(edited.body.Count, 123);
  assert.equal(edited.body.comp_json.Events[0].Schedule[0].IsRunning, true);
  assert.equal(edited.body.comp_json.Events[0].Schedule[0].Scrambles.length, 0);
  assert.equal(edited.body.CompStartTime, '2026-11-13T00:00:00+08:00');
  assert.equal(edited.body.comp_json.Events[0].Schedule[1].NoRestrictions, true, 'explicit unrestricted value survives number edit');
  assert.equal(edited.body.comp_json.Events[0].Schedule[1].Competitors, 6);
  assert.equal(edited.body.comp_json.Events[1].Schedule[1].NoRestrictions, false, 'explicit restricted value is preserved');
  console.log("PASS full competition edit, comp_json and separate rename");

  await page.getByRole("tab", { name: "批量录入" }).click();
  const panel = page.getByRole("tabpanel", { name: "批量录入" });
  await panel.getByPlaceholder("输入 CubeID，或搜索姓名后选择").fill("cube-7");
  await panel.locator("textarea").fill("333[1] 1 2 3 4 5\n222[1] 1 2 3 4 5");
  await panel.getByRole("button", { name: "确认录入 2 条" }).click();
  await panel.getByText("已处理 2/2 · 失败 1", { exact: true }).waitFor();
  assert.equal(await panel.locator("textarea").inputValue(), "222[1] 1 2 3 4 5");
  assert.ok((await requests()).filter((r) => r.url.endsWith("/result") && r.method === "post").every((r) => r.url.startsWith("/admin/competition/comps/42")));
  await page.evaluate(() => { window.__retryResults = true; });
  await panel.getByRole("button", { name: "确认录入 1 条" }).click();
  await panel.getByText("已处理 1/1 · 失败 0", { exact: true }).waitFor();
  assert.equal(await panel.locator("textarea").inputValue(), "");
  console.log("PASS batch real progress, partial failure, failed-only retry and admin result API");

  await page.getByRole("tab", { name: "成绩审批" }).click();
  const prePanel = page.getByRole("tabpanel", { name: "成绩审批" });
  await prePanel.getByText("#101", { exact: true }).waitFor();
  await prePanel.locator("thead input[type=checkbox]").check();
  await prePanel.getByRole("button", { name: "通过", exact: true }).click();
  await page.locator(".ant-modal-confirm").getByRole("button", { name: /确\s*认/ }).click();
  await prePanel.getByText("已处理 2/2 · 失败 1", { exact: true }).waitFor();
  await page.locator(".ant-modal-confirm").waitFor({ state: "hidden" });
  await prePanel.getByText("#102", { exact: true }).waitFor();
  assert.equal(await prePanel.getByText("#101", { exact: true }).count(), 0);
  await prePanel.locator("#finish").click();
  await page.locator(".ant-select-item-option").filter({ hasText: "已通过" }).click();
  await prePanel.locator("button").filter({ hasText: /^查询$/ }).click();
  await prePanel.getByText("#101", { exact: true }).waitFor();
  assert.equal(await prePanel.getByText("#102", { exact: true }).count(), 0);
  assert.ok(page.url().includes("pre_finish=ok"));
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `approval overflow ${width}`);
  }
  console.log("PASS approval progress, partial errors, refreshed pending selection and mobile table");

  await page.getByRole("tab", { name: "单条录入" }).click();
  const onePanel = page.getByRole("tabpanel", { name: "单条录入" });
  const playerInput = onePanel.getByPlaceholder("输入 CubeID，或搜索姓名后选择");
  await playerInput.fill("");
  await playerInput.click();
  await page.locator('.ant-select-item-option:visible').filter({ hasText: '测试选手 · cube-7' }).waitFor();
  await page.locator('.ant-select-item-option:visible').filter({ hasText: '另一位选手 · cube-8' }).waitFor();
  const playerRequestCount = (await requests()).filter((r) => r.url === '/public/player/').length;
  await playerInput.fill('另一位');
  assert.equal(await page.locator('.ant-select-item-option:visible').count(), 1);
  await playerInput.fill('CUBE-7');
  await page.locator('.ant-select-item-option:visible').filter({ hasText: '测试选手 · cube-7' }).click();
  assert.equal(await playerInput.inputValue(), 'cube-7');
  assert.equal((await requests()).filter((r) => r.url === '/public/player/').length, playerRequestCount, 'typing filters the complete list locally');
  await onePanel.locator(".ant-cascader").click();
  await page.locator(".ant-cascader-menu-item-content").filter({ hasText: "333 333" }).click();
  await page.locator(".ant-cascader-menu-item-content").filter({ hasText: "1 · 初赛" }).click();
  const scoreInputs = onePanel.getByPlaceholder("12.34 / 1:02.34 / DNF / DNS");
  for (let i = 0; i < 5; i++) await scoreInputs.nth(i).fill(String(i + 1));
  const beforeOne = (await requests()).filter((r) => r.url.endsWith("/result") && r.method === "post").length;
  await onePanel.getByRole("button", { name: "确认录入", exact: true }).click();
  await page.waitForFunction((before) => window.__requests.filter((r) => r.url.endsWith('/result') && r.method === 'post').length > before, beforeOne);
  assert.deepEqual((await requests()).filter((r) => r.url.endsWith("/result") && r.method === "post").at(-1).body.Results, [1,2,3,4,5]);
  await page.waitForFunction(() => !document.querySelector('.ant-tabs-tabpane-active .ant-btn-loading'));
  console.log("PASS single result input and exact attempt count");

  await onePanel.locator('.ant-cascader').click();
  await page.locator('.ant-cascader-menu-item-content').filter({ hasText: /^333mbf 333mbf$/ }).click();
  await page.locator('.ant-cascader-menu-item-content').filter({ hasText: '1 · 初赛' }).click();
  const mbInput = onePanel.getByPlaceholder('3/4 10:00 / 3/4 DNF / 0/0 DNS');
  for (const [text, expected] of [['0/0 DNS', [0,0,-10001]], ['3/4 DNF', [3,4,-10000]]]) {
    await mbInput.fill(text);
    const before = (await requests()).filter((r) => r.url.endsWith('/result') && r.method === 'post').length;
    await onePanel.locator('button').filter({ hasText: /^确认录入$/ }).click();
    await page.waitForFunction((n) => window.__requests.filter((r) => r.url.endsWith('/result') && r.method === 'post').length === n + 1, before);
    await page.waitForFunction(() => !document.querySelector('.ant-tabs-tabpane-active .ant-btn-loading'));
    assert.deepEqual((await requests()).filter((r) => r.url.endsWith('/result') && r.method === 'post').at(-1).body.Results, expected);
  }
  await mbInput.fill('3/4 -1');
  const beforeInvalid = (await requests()).filter((r) => r.url.endsWith('/result') && r.method === 'post').length;
  await onePanel.locator('button').filter({ hasText: /^确认录入$/ }).click();
  await page.getByText('成绩格式错误：-1', { exact: true }).waitFor();
  assert.equal((await requests()).filter((r) => r.url.endsWith('/result') && r.method === 'post').length, beforeInvalid);
  await page.getByRole('tab', { name: '批量录入' }).click();
  await panel.locator('textarea').fill('333mbf[1] 0/0 DNS');
  await panel.locator('button').filter({ hasText: '确认录入 1 条' }).click();
  await panel.getByText('已处理 1/1 · 失败 0', { exact: true }).waitFor();
  await page.waitForFunction(() => !document.querySelector('.ant-tabs-tabpane-active .ant-btn-loading'));
  console.log('PASS multi-blind single/batch DNS and DNF; invalid negative never submitted');

  await page.getByRole('tab', { name: '比赛管理' }).click();
  await page.locator('button').filter({ hasText: /^结束比赛$/ }).click();
  assert.equal(await page.locator('.ant-modal-confirm').getByText(/允许存在待审成绩/).count(), 1);
  await page.locator('.ant-modal-confirm').getByRole('button', { name: /确\s*认/, exact: true }).click();
  await page.locator('.ant-modal-confirm').waitFor({ state: 'hidden' });
  await page.getByText('群赛已审批通过，可新增、覆盖、修改、删除成绩和审批，不受赛期、结束标记或轮次开放状态限制。', { exact: true }).waitFor();
  await page.getByRole('tab', { name: '单条录入' }).click();
  assert.equal(await onePanel.locator('button').filter({ hasText: /^确认录入$/ }).isDisabled(), false);
  const queryHistory = async (queryPanel) => {
    await queryPanel.getByPlaceholder('输入 CubeID，或搜索姓名后选择').fill('history-player');
    await queryPanel.locator('.ant-cascader').click();
    await page.locator('.ant-cascader-menu-item-content').filter({ hasText: /^333 333$/ }).click();
    await page.locator('.ant-cascader-menu-item-content').filter({ hasText: '2 · 决赛（关闭）' }).click();
    assert.equal(await queryPanel.getByPlaceholder('12.34 / 1:02.34 / DNF / DNS').first().isDisabled(), false);
    const before = (await requests()).filter((r) => r.url.endsWith('/result') && r.method === 'get').length;
    await queryPanel.locator('button').filter({ hasText: '查询 / 刷新成绩' }).click();
    await queryPanel.getByText('历史正式选手 history-player', { exact: true }).waitFor();
    const queries = (await requests()).filter((r) => r.url.endsWith('/result') && r.method === 'get');
    assert.equal(queries.length, before + 1);
    assert.deepEqual(queries.at(-1).params, { event_id: '333', round_num: 2 });
    assert.equal(await queryPanel.locator('button').filter({ hasText: /^确认录入$/ }).isDisabled(), false);
  };
  await queryHistory(onePanel);
  await page.getByRole('tab', { name: '批量录入' }).click();
  assert.equal(await panel.locator('button').filter({ hasText: /确认录入/ }).isDisabled(), false);
  await panel.getByPlaceholder('输入 CubeID，或搜索姓名后选择').fill('history-player');
  await panel.locator('button').filter({ hasText: '查询 / 刷新成绩' }).click();
  await panel.getByText('历史正式选手 history-player', { exact: true }).waitFor();
  assert.deepEqual((await requests()).filter((r) => r.url.endsWith('/result') && r.method === 'get').at(-1).params, { cube_id: 'history-player' });
  console.log('PASS explicitly ended competition can query closed rounds and player results');
  await page.getByRole('tab', { name: '成绩审批' }).click();
  await prePanel.locator('button').filter({ hasText: /^重置$/ }).click();
  await prePanel.getByText('#102', { exact: true }).waitFor();
  await page.evaluate(() => { window.__retryApprovals = true; });
  await prePanel.locator('tr[data-row-key="102"] input[type=checkbox]').check();
  await prePanel.getByRole('button', { name: '通过', exact: true }).click();
  await page.locator('.ant-modal-confirm').getByRole('button', { name: /确\s*认/, exact: true }).click();
  await page.locator('.ant-modal-confirm').waitFor({ state: 'hidden' });
  await prePanel.getByText('成绩审批 · 共 0 条', { exact: true }).waitFor();
  const endedRequests = await requests();
  const endIndex = endedRequests.findIndex((r) => r.url.endsWith('/end'));
  assert.ok(endIndex >= 0);
  assert.ok(endedRequests.slice(endIndex + 1).some((r) => r.url.endsWith('/pre_results/102/approval') && r.body.FinishDetail === 'ok'));
  assert.ok(endedRequests.slice(endIndex + 1).every((r) => !(r.url.endsWith('/result') && r.method === 'post')));
  console.log('PASS End with pending leaves new input and normal approval enabled');

  await page.evaluate(() => {
    window.__reviewFixtures = ['ok', 'not', 'timeout'].flatMap((status, group) => Array.from({ length: 25 }, (_, i) => ({ id: 1000 + group * 100 + i, Finish: true, FinishDetail: status, EventID: '333', EventRoute: 7, Result: [1,2,3,4,5], PersonName: '筛选测试', CubeID: 'cube-7' })));
  });
  for (const [value, label, reviewStatus, finishDetail, expectedTotal] of [['ok', '已通过', 'passed', undefined, 27], ['not', '已驳回', 'rejected', undefined, 25], ['timeout', '已超时', undefined, 'timeout', 25]]) {
    const before = (await requests()).filter((r) => r.url.endsWith('/pre_results')).length;
    await prePanel.locator('#finish').click();
    await page.locator('.ant-select-item-option').filter({ hasText: new RegExp(`^${label}$`) }).click();
    await prePanel.locator('button').filter({ hasText: /^查询$/ }).click();
    await prePanel.getByText(`成绩审批 · 共 ${expectedTotal} 条`, { exact: true }).waitFor();
    const filtered = (await requests()).filter((r) => r.url.endsWith('/pre_results'));
    assert.equal(filtered.length, before + 1, 'one server page per filter, even when next=true');
    assert.equal(filtered.at(-1).params.finish, 'true');
    assert.equal(filtered.at(-1).params.review_status, reviewStatus);
    assert.equal(filtered.at(-1).params.finishDetail, finishDetail);
    assert.equal(filtered.at(-1).params.page, 1);
    assert.equal(filtered.at(-1).params.size, 20);
    assert.ok(page.url().includes(`pre_finish=${value}`));
    await prePanel.locator('.ant-pagination-item-2').click();
    await page.waitForFunction((n) => window.__requests.filter((r) => r.url.endsWith('/pre_results')).length === n, filtered.length + 1);
    await page.waitForFunction(() => !document.querySelector('.ant-tabs-tabpane-active .ant-spin-spinning'));
    const paged = (await requests()).filter((r) => r.url.endsWith('/pre_results'));
    assert.equal(paged.at(-1).params.page, 2);
    assert.equal(paged.at(-1).params.size, 20);
    assert.equal(await prePanel.locator('tbody tr[data-row-key]').count(), expectedTotal - 20);
  }
  console.log('PASS passed/rejected/timeout server totals and pagination without full scans');

  await page.reload();
  await page.getByRole('heading', { name: '#42 隔离测试群赛' }).waitFor();
  await page.evaluate(() => { window.__legacyCutoff = true; });
  await page.getByRole('tab', { name: '比赛管理' }).click();
  await page.locator('button').filter({ hasText: /^结束比赛$/ }).click();
  await page.locator('.ant-modal-confirm').getByRole('button', { name: /确\s*认/, exact: true }).click();
  await page.locator('.ant-modal-confirm').waitFor({ state: 'hidden' });
  await page.getByRole('tab', { name: '成绩审批' }).click();
  await prePanel.locator('button').filter({ hasText: /^重置$/ }).click();
  await prePanel.getByText('#101', { exact: true }).waitFor();
  await prePanel.locator('tr[data-row-key="101"] input[type=checkbox]').check();
  await prePanel.getByRole('button', { name: '通过', exact: true }).click();
  await page.locator('.ant-modal-confirm').getByRole('button', { name: /确\s*认/, exact: true }).click();
  await page.locator('.ant-modal-confirm').waitFor({ state: 'hidden' });
  await prePanel.getByText('#101', { exact: true }).waitFor({ state: 'hidden' });
  assert.equal((await requests()).filter((r) => r.body?.HistoricalConfirmed).length, 0);
  assert.equal(await prePanel.locator('button').filter({ hasText: '人工核查此单' }).count(), 0);
  await prePanel.locator('tr[data-row-key="102"] input[type=checkbox]').check();
  await prePanel.getByRole('button', { name: '标记超时', exact: true }).click();
  await page.locator('.ant-modal-confirm').getByRole('button', { name: /确\s*认/, exact: true }).click();
  await page.locator('.ant-modal-confirm').waitFor({ state: 'hidden' });
  await prePanel.getByText('已处理 1/1 · 失败 0', { exact: true }).waitFor();
  console.log('PASS missing historical cutoff does not block normal approval or expose obsolete confirmation');

  await page.goto(`${origin}/admin/organizers/result?orgId=7&compId=42&auth=2&input_tabs=manage`);
  await page.getByRole('heading', { name:'#42 隔离测试群赛' }).waitFor();
  await page.evaluate(() => { window.__legacyCutoff = true; });
  await page.locator('button').filter({ hasText:/^结束比赛$/ }).click();
  await page.locator('.ant-modal-confirm').getByRole('button', {name:/确\s*认/, exact:true}).click();
  await page.locator('.ant-modal-confirm').waitFor({state:'hidden'});
  await page.getByRole('tab', {name:'成绩审批'}).click();
  const organizerPre = page.getByRole('tabpanel', {name:'成绩审批'});
  await organizerPre.locator('tr[data-row-key="101"] button').filter({hasText:'普通审批'}).click();
  await page.locator('.ant-modal-confirm button').filter({hasText:'普通审批'}).click();
  await page.locator('.ant-modal-confirm').waitFor({state:'hidden'});
  assert.equal(await organizerPre.locator('button').filter({hasText:'人工核查此单'}).count(), 0);
  assert.equal((await requests()).filter((r) => r.body?.HistoricalConfirmed).length, 0);
  console.log('PASS organizer normal approval needs no historical confirmation');

  await page.goto(`${origin}/admin/organizers/7/comp/42/result?auth=11&input_tabs=one`);
  await page.getByRole("heading", { name: "#42 隔离测试群赛" }).waitFor();
  assert.ok((await requests()).some((r) => r.url === "/organizers/7/comp/42"));
  assert.ok((await requests()).every((r) => !r.url.startsWith("/admin/competition/")));
  console.log("PASS legacy dynamic result URL retains organizer mode even for admin with organizer bit");

  await page.goto(`${origin}/admin/organizers/comps?auth=11`);
  await page.getByRole("heading", { name: "团队群赛管理" }).waitFor();
  await page.getByRole('link', { name:'隔离测试群赛', exact:true }).waitFor();
  assert.ok((await requests()).every((r) => !r.url.startsWith("/admin/competition/")));
  await page.getByRole('link', {name:'原有非群线上比赛',exact:true}).waitFor();
  await page.evaluate(() => sessionStorage.setItem('test-no-team','1'));
  await page.goto(`${origin}/admin/organizers/comps?auth=8`);
  await page.getByText('你尚未加入主办团队。管理员可直接进入全局群赛审批。',{exact:true}).waitFor();
  assert.equal(await page.getByRole('link',{name:'管理员入口',exact:true}).getAttribute('href'),'/admin/competition/approvals');
  for (const auth of [8,16]) {
    await page.goto(`${origin}/admin/competition/manage?compId=42&auth=${auth}&input_tabs=one`);
    await page.getByRole('heading',{name:'#42 隔离测试群赛',exact:true}).waitFor();
    assert.ok((await requests()).every((r) => !r.url.startsWith('/organizers/')));
  }
  await page.evaluate(() => sessionStorage.removeItem('test-no-team'));
  await page.goto(`${origin}/admin/organizers/comps?auth=2&orgId=7&status=all`);
  await page.getByRole("heading", { name: "团队群赛管理" }).waitFor();
  await page.getByRole('link', { name:'隔离测试群赛', exact:true }).waitFor();
  assert.ok((await requests()).some((r) => r.url === "/organizers/7/comp/"));
  assert.ok((await requests()).every((r) => !r.url.startsWith("/admin/competition/")));
  await page.goto(`${origin}/admin/organizers/comps?auth=2&orgId=999`);
  await page.getByText("你不属于 URL 指定的团队，请选择自己的团队查询", { exact: true }).waitFor();
  assert.ok((await requests()).every((r) => !r.url.includes("/organizers/999/comp/")));
  console.log("PASS original team list retains non-group events; no-team admins use explicit fixed admin entry");

  await page.goto(`${origin}/admin/organizers/7/comp/43/result?auth=11&input_tabs=one`);
  await page.getByRole('heading',{name:'#43 原有非群线上比赛',exact:true}).waitFor();
  const legacyPanel = page.getByRole('tabpanel',{name:'单条录入'});
  await legacyPanel.getByPlaceholder('输入 CubeID，或搜索姓名后选择').fill('cube-7');
  await legacyPanel.locator('.ant-cascader').click();
  await page.locator('.ant-cascader-menu-item-content').filter({hasText:'333 333'}).click();
  await page.locator('.ant-cascader-menu-item-content').filter({hasText:'1 · 初赛（关闭）'}).click();
  const legacyInputs = legacyPanel.getByPlaceholder('12.34 / 1:02.34 / DNF / DNS');
  for (let i=0;i<5;i++) await legacyInputs.nth(i).fill(String(i+1));
  await legacyPanel.locator('button').filter({hasText:/^确认录入$/}).click();
  await waitRequest((rows) => rows.some((r) => r.url === '/organizers/7/comp/43/result' && r.method === 'post'));
  await page.waitForFunction(() => !document.querySelector('.ant-tabs-tabpane-active .ant-btn-loading'));
  await page.getByRole('tab',{name:'批量录入'}).click();
  const legacyBatch = page.getByRole('tabpanel',{name:'批量录入'});
  await legacyBatch.locator('textarea').fill('333[1] 1 2 3 4 5');
  await legacyBatch.locator('button').filter({hasText:'确认录入 1 条'}).click();
  await legacyBatch.getByText('已处理 1/1 · 失败 0',{exact:true}).waitFor();
  await page.waitForFunction(() => !document.querySelector('.ant-tabs-tabpane-active .ant-btn-loading'));
  await page.getByRole('tab',{name:'比赛管理'}).click();
  assert.equal(await page.locator('#startDate').inputValue(),'2020-01-01T09:12:13.123456+09:00');
  assert.equal(await page.locator('#endDate').inputValue(),'2020-01-03T19:22:23.654321-07:00');
  assert.equal(await page.locator('#startDate').getAttribute('readonly'),'');
  await page.locator('#Illustrate').fill('仅修改比赛说明');
  await page.locator('button').filter({hasText:'保存比赛'}).click();
  await waitRequest((rows) => rows.some((r) => r.url === '/organizers/7/comp/43' && r.method === 'post'));
  const legacyEdit = (await requests()).find((r) => r.url === '/organizers/7/comp/43' && r.method === 'post');
  assert.equal(legacyEdit.body.CompStartTime,'2020-01-01T09:12:13.123456+09:00');
  assert.equal(legacyEdit.body.CompEndTime,'2020-01-03T19:22:23.654321-07:00');
  assert.equal(legacyEdit.body.Illustrate,'仅修改比赛说明');
  assert.equal(legacyEdit.body.comp_json.Events[0].Schedule[0].IsRunning,false);
  assert.ok((await requests()).every((r) => !r.url.startsWith('/admin/competition/')));
  console.log('PASS admin+organizer legacy non-group expired/ended closed-round single and batch entry; description edit preserves exact timestamps');

  for (const date of ['2026-11-01T00:00:00+08:00','2026-11-15T00:00:00+08:00']) {
    await page.evaluate((date) => sessionStorage.setItem('test-now',String(Date.parse(date))),date);
    await page.goto(`${origin}/admin/competition/manage?compId=42&input_tabs=one`);
    await page.getByRole('heading',{name:'#42 隔离测试群赛',exact:true}).waitFor();
    const freePanel = page.getByRole('tabpanel',{name:'单条录入'});
    await queryHistory(freePanel);
    for (const scores of [[1,2,3,4,5],[6,7,8,9,10]]) {
      const inputs = freePanel.getByPlaceholder('12.34 / 1:02.34 / DNF / DNS');
      for (let i=0;i<5;i++) await inputs.nth(i).fill(String(scores[i]));
      const before = (await requests()).filter((r) => r.url.endsWith('/result') && r.method === 'post').length;
      await freePanel.locator('button').filter({hasText:/^确认录入$/}).click();
      await page.waitForFunction((before) => window.__requests.filter((r) => r.url.endsWith('/result') && r.method === 'post').length === before+1,before);
      await page.waitForFunction(() => !document.querySelector('.ant-tabs-tabpane-active .ant-btn-loading'));
      const posted = (await requests()).filter((r) => r.url.endsWith('/result') && r.method === 'post').at(-1);
      assert.equal(posted.body.Round,2);
      assert.deepEqual(posted.body.Results,scores);
    }
    await freePanel.locator('button').filter({hasText:/^删除$/}).click();
    await page.locator('.ant-modal-confirm button').filter({hasText:/^删除$/}).click();
    await page.locator('.ant-modal-confirm').waitFor({state:'hidden'});
    assert.ok((await requests()).some((r) => r.method === 'delete' && r.url.endsWith('/result/501')));
    await page.getByRole('tab',{name:'批量录入'}).click();
    const freeBatch = page.getByRole('tabpanel',{name:'批量录入'});
    await freeBatch.locator('textarea').fill('333[2] 1 2 3 4 5');
    await freeBatch.locator('button').filter({hasText:'确认录入 1 条'}).click();
    await freeBatch.getByText('已处理 1/1 · 失败 0',{exact:true}).waitFor();
    await page.waitForFunction(() => !document.querySelector('.ant-tabs-tabpane-active .ant-btn-loading'));
    await page.getByRole('tab',{name:'比赛管理'}).click();
    await page.locator('button').filter({hasText:/^结束比赛$/}).click();
    await page.locator('.ant-modal-confirm button').filter({hasText:/^确认$/}).click();
    await page.locator('.ant-modal-confirm').waitFor({state:'hidden'});
    await page.getByRole('tab',{name:'单条录入'}).click();
    await queryHistory(freePanel);
    const afterEnd = freePanel.getByPlaceholder('12.34 / 1:02.34 / DNF / DNS');
    for (const offset of [11,21]) {
      for(let i=0;i<5;i++) await afterEnd.nth(i).fill(String(i+offset));
      const endBefore = (await requests()).filter((r) => r.url.endsWith('/result') && r.method === 'post').length;
      await freePanel.locator('button').filter({hasText:/^确认录入$/}).click();
      await page.waitForFunction((before) => window.__requests.filter((r) => r.url.endsWith('/result') && r.method === 'post').length === before+1,endBefore);
      await page.waitForFunction(() => !document.querySelector('.ant-tabs-tabpane-active .ant-btn-loading'));
      assert.deepEqual((await requests()).filter((r) => r.url.endsWith('/result') && r.method === 'post').at(-1).body.Results,[offset,offset+1,offset+2,offset+3,offset+4]);
    }
    const deletesBefore = (await requests()).filter((r) => r.method === 'delete').length;
    await freePanel.locator('button').filter({hasText:/^删除$/}).click();
    await page.locator('.ant-modal-confirm button').filter({hasText:/^删除$/}).click();
    await page.locator('.ant-modal-confirm').waitFor({state:'hidden'});
    assert.equal((await requests()).filter((r) => r.method === 'delete').length,deletesBefore+1);
    await page.getByRole('tab',{name:'批量录入'}).click();
    await freeBatch.locator('textarea').fill('333[2] 31 32 33 34 35');
    await freeBatch.locator('button').filter({hasText:'确认录入 1 条'}).click();
    await freeBatch.getByText('已处理 1/1 · 失败 0',{exact:true}).waitFor();
    await page.waitForFunction(() => !document.querySelector('.ant-tabs-tabpane-active .ant-btn-loading'));
    await page.getByRole('tab',{name:'比赛管理'}).click();
    await page.locator('#Illustrate').fill('标记结束后仍可修改');
    await page.locator('button').filter({hasText:'保存比赛'}).click();
    await waitRequest((rows) => rows.some((r) => r.method === 'post' && r.url === '/admin/competition/comps/42' && r.body.Illustrate === '标记结束后仍可修改'));
  }
  for(const Status of ['Reviewing','Reject','Temporary','Ban']) {
    await page.evaluate((value) => sessionStorage.setItem('test-status',value),Status);
    await page.goto(`${origin}/admin/competition/manage?compId=42&input_tabs=one`);
    await page.getByText('群赛尚未审批通过，暂不能录入或修改成绩。',{exact:true}).waitFor();
    const pendingPanel = page.getByRole('tabpanel',{name:'单条录入'});
    await pendingPanel.getByPlaceholder('输入 CubeID，或搜索姓名后选择').fill('cube-7');
    await pendingPanel.locator('.ant-cascader').click();
    await page.locator('.ant-cascader-menu-item-content').filter({hasText:'333 333'}).click();
    await page.locator('.ant-cascader-menu-item-content').filter({hasText:'2 · 决赛（关闭）'}).click();
    assert.equal(await pendingPanel.locator('button').filter({hasText:/^确认录入$/}).isDisabled(),true);
    assert.equal(await pendingPanel.getByPlaceholder('12.34 / 1:02.34 / DNF / DNS').first().isDisabled(),true);
    assert.equal((await requests()).filter((r) => r.url.endsWith('/result') && r.method === 'post').length,0);
  }
  await page.evaluate(() => sessionStorage.removeItem('test-status'));
  await page.evaluate(() => sessionStorage.removeItem("test-now"));
  console.log('PASS approved groups before/after dates and after End can create/overwrite/edit/delete with closed rounds; unapproved groups remain blocked');

  await page.goto(`${origin}/admin/organizers/comps/create?auth=2`);
  await page.getByRole("heading", { name: "创建群赛" }).waitFor();
  await page.getByRole("button", { name: "提交", exact: true }).waitFor({ state: 'visible' });
  await page.waitForFunction(() => ![...document.querySelectorAll('button')].find((button) => button.textContent.trim() === '提交')?.disabled);
  await page.getByRole("button", { name: "提交", exact: true }).click();
  await page.getByText('请完善标红的必填信息后再提交', { exact: true }).waitFor();
  assert.equal(await page.locator('.ant-modal-confirm').count(), 0);
  assert.equal((await requests()).filter((r) => r.url?.match(/\/organizers\/\d+\/comp\/$/) && r.method === 'post').length, 0);
  await page.locator("#competitionName").fill("新群赛测试");
  await page.locator("#maxParticipants").fill("100");
  await page.locator("#organizersID").click();
  await page.getByText("团队七", { exact: true }).click();
  await page.locator("#groupsID").click();
  await page.getByText("群组测试", { exact: true }).last().click();
  await page.locator("#organizersID").click();
  await page.getByText("团队八", { exact: true }).click();
  assert.equal(await page.locator("#groupsID").inputValue(), "");
  await page.locator("#groupsID").click();
  await page.getByText("群组测试", { exact: true }).last().click();
  await page.locator("#startDate").fill("2026-11-13"); await page.keyboard.press("Enter");
  await page.locator("#endDate").fill("2026-11-14"); await page.keyboard.press("Enter");
  await page.locator("button").filter({ hasText: "添加项目" }).click();
  await page.locator('button').filter({ hasText: /^安排赛程$/ }).click();
  const createSchedule = page.locator('.ant-modal').filter({ hasText: '后续轮次默认按晋级名单' });
  await createSchedule.locator('button').filter({ hasText: '添加轮次' }).click();
  await createSchedule.getByText('按晋级名单', { exact: true }).waitFor();
  await createSchedule.getByRole('spinbutton', { name: '第 2 轮晋级人数', exact: true }).fill('8');
  const qualification = createSchedule.locator('tr[data-row-key="2"] .ant-select');
  await qualification.click();
  await page.locator('.ant-select-item-option:visible').filter({ hasText: /^无限制$/ }).click();
  await createSchedule.getByText('无限制不会校验晋级名单；如需限制人数，请选择按晋级名单。', { exact: true }).waitFor();
  await qualification.click();
  await page.locator('.ant-select-item-option:visible').filter({ hasText: /^按晋级名单$/ }).click();
  await createSchedule.locator('.ant-modal-footer button').last().click();
  await page.getByRole("button", { name: "提交", exact: true }).click();
  await page.locator(".ant-modal-confirm").getByRole("button", { name: "确认创建", exact: true }).click();
  await waitRequest((rows) => rows.some((r) => r.url === "/organizers/8/comp/" && r.method === "post"));
  const create = (await requests()).find((r) => r.url === "/organizers/8/comp/" && r.method === "post");
  assert.equal(create.body.Count, 100); assert.equal(create.body.GroupID, 80);
  assert.equal(create.body.CompStartTime, "2026-11-13T00:00:00+08:00");
  assert.equal(create.body.CompEndTime, "2026-11-14T00:00:00+08:00");
  assert.ok(create.body.CompJSON.Events.every((event) => event.Schedule.every((round) => round.IsRunning === true)), 'every online round is open by default');
  assert.equal(create.body.CompJSON.Events[0].Schedule[1].Competitors, 8);
  assert.equal(create.body.CompJSON.Events[0].Schedule[1].NoRestrictions, false, 'finite later round uses advancement lists by default');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `create/list overflow ${width}`);
  }
  console.log("PASS required-field validation without console errors, creation count, team/group reset, explicit +08 dates and all rounds open");
  await page.evaluate(() => sessionStorage.setItem('test-long-names','1'));
  await page.goto(`${origin}/admin/competition/approvals`);
  await page.getByText('这是一个用于检查二十到三十字符名称完整显示的测试群赛名称', {exact:true}).waitFor();
  for (const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:1000});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `long-name list overflow ${width}`);
    const cells = await page.locator('tr[data-row-key="42"] .gc-name').evaluateAll((nodes) => nodes.map((node) => ({width:node.getBoundingClientRect().width, clipped:node.scrollWidth > node.clientWidth + 1, text:node.textContent})));
    assert.equal(cells.length,3);
    assert.ok(cells.every((cell) => !cell.clipped), JSON.stringify(cells));
    assert.ok(cells[0].width <= 252, JSON.stringify(cells));
    assert.ok(cells.slice(1).every((cell) => cell.width <= 8 * 14), JSON.stringify(cells));
    const row = page.locator('tr[data-row-key="42"]');
    assert.equal(await row.locator('.gc-dates .ant-tag').count(), 2);
    assert.equal(await row.getByText(/北京/).count(), 0);
    const actionCell = row.locator('td').last();
    assert.equal(await actionCell.count(), 1);
    assert.equal(await actionCell.evaluate((node) => getComputedStyle(node).position), 'sticky');
  }
  await page.evaluate(() => sessionStorage.removeItem('test-long-names'));
  console.log('PASS compact columns, date tags and fixed-right actions at all breakpoints');
  await page.goto(`${origin}/public-probe`);
  await page.locator('#public-list tr[data-row-key="10"]').getByText('已结束', {exact:true}).waitFor();
  await page.locator('#public-list tr[data-row-key="11"]').getByText('待结束', {exact:true}).waitFor();
  await page.locator('#group-detail').getByText('已结束', {exact:true}).waitFor();
  assert.equal(await page.locator('#legacy-detail').getByText('开赛时间', {exact:true}).count(), 1);
  assert.equal(await page.locator('#legacy-detail').getByText('结束时间', {exact:true}).count(), 1);
  assert.equal(await page.getByText(/可审批旧单/).count(), 0, 'public views never show internal approval wording');
  assert.equal(await page.locator('#legacy-detail').getByText(/北京时间|次日 00:00/).count(), 0, 'non-group date rendering retains legacy behavior');
  console.log('PASS public group ended label and non-group legacy date/status isolation');
  await page.evaluate(() => sessionStorage.setItem('test-unauthenticated', '1'));
  await page.goto(`${origin}/admin/competition/manage?compId=42&input_tabs=pre_result#review`);
  await page.getByText('Isolated login redirect', { exact: true }).waitFor();
  const redirect = new URL(page.url()).searchParams.get('redirect');
  assert.equal(redirect, '/admin/competition/manage?compId=42&input_tabs=pre_result#review');
  console.log("PASS login guard preserves competition query, approval tab and hash");
  const blockedBefore = blocked.length;
  await page.evaluate(async () => { try { await fetch('https://example.invalid/network-block-probe'); } catch { /* Expected transport rejection. */ } });
  assert.equal(blocked.length, blockedBefore + 1);
  assert.equal(blocked.at(-1), 'https://example.invalid/network-block-probe');
  assert.deepEqual(blocked.slice(0, blockedBefore), [], 'no external requests from application tests');
  console.log('PASS external network probe intercepted; no application external requests');
  assert.deepEqual(errors, [], errors.join("\n"));
} catch (error) {
  console.error({ errors, body: (await page.locator("body").innerText()).slice(0, 5000), requests: await requests(), overflow: await page.evaluate(() => [...document.querySelectorAll("body *")].filter((el) => el.getBoundingClientRect().right > innerWidth + 1 && !el.closest(".ant-table")).slice(0, 20).map((el) => ({ tag:el.tagName, class:el.className, width:el.getBoundingClientRect().width, right:el.getBoundingClientRect().right }))) });
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
