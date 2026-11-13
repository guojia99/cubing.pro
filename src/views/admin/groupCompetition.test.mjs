import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import http from "node:http";
import https from "node:https";
import net from "node:net";

// Use one CJS graph: mixing tsx ESM entrypoints with @ aliases creates a second
// Axios singleton. Block transport as well so an adapter mismatch fails offline.
const noNetwork = () => { throw new Error("Network disabled in group competition tests"); };
http.request = noNetwork; http.get = noNetwork; https.request = noNetwork; https.get = noNetwork;
net.connect = noNetwork; net.createConnection = noNetwork;
net.Socket.prototype.connect = noNetwork;
globalThis.fetch = noNetwork;
const require = createRequire(import.meta.url);
require("tsx/cjs");
const { beijingDate, beijingDateStart, canEnterResults, canReviewResults, competitionEditTimes, competitionStatus, competitionReturnPath, isGroupCompetition, publicCompetitionStatus, parseAttempts, parseBatchResults, parseScore, positiveInteger, preResultReviewFilter, roundNoRestrictions, validateEvents } = require("../../lib/groupCompetition.ts");
const { competitionService, approveGroupCompetition, getCompetitionFilters, listGroupCompetitions } = require("../../services/cubing-pro/auth/groupCompetition.ts");
const { apiCreateComps } = require("../../services/cubing-pro/auth/organizers.ts");
const { Request } = require("../../services/cubing-pro/request.ts");
const { APP_ROUTES, matchRoute } = require("../../config/routes.ts");
const { getCatchAllStaticParams } = require("../../lib/staticExportPaths.ts");

const comp = { Status: "Running", IsDone: false, Genre: 5, GroupId: 7, CompStartTime: "2026-11-13T00:00:00+08:00", CompEndTime: "2026-11-14T00:00:00+08:00" };
const event = (EventID, EventRoute = 7, IsRunning = true) => ({ EventID, EventName: EventID, EventRoute, Schedule: [{ RoundNum: 1, IsRunning, Competitors: 0, Cutoff: 0, CutoffNumber: 0, TimeLimit: 0 }] });

test("Beijing calendar dates are explicit +08 and reject impossible dates", () => {
  assert.equal(beijingDateStart("2026-11-13"), "2026-11-13T00:00:00+08:00");
  assert.equal(beijingDate("2026-11-12T16:00:00Z"), "2026-11-13");
  assert.throws(() => beijingDateStart("2026-02-30"));
  assert.throws(() => beijingDateStart("11/13/2026"));
});

test("browser time zones cannot move DatePicker calendar dates", () => {
  const file = new URL("../../lib/groupCompetition.ts", import.meta.url).pathname;
  const code = `const block = () => { throw new Error('Network disabled'); }; for (const name of ['http', 'https']) { const module = require('node:' + name); module.request = block; module.get = block; } const net = require('node:net'); net.connect = block; net.createConnection = block; net.Socket.prototype.connect = block; globalThis.fetch = block; require('tsx/cjs'); const { beijingDateStart } = require(${JSON.stringify(file)}); process.stdout.write(beijingDateStart('2026-11-13'));`;
  for (const TZ of ["UTC", "America/Los_Angeles", "Pacific/Kiritimati", "Asia/Shanghai"]) {
    const output = execFileSync(process.execPath, ["-e", code], { env: { ...process.env, TZ }, encoding: "utf8" });
    assert.equal(output, "2026-11-13T00:00:00+08:00");
  }
});

test("group entry requires only approval, regardless of dates, explicit End or legacy cutoff", () => {
  for (const IsDone of [false, true]) {
    for (const [CompStartTime, CompEndTime] of [["2000-01-01", "2000-01-02"], ["2099-01-01", "2099-01-02"], ["", ""]]) {
      assert.equal(canEnterResults({ ...comp, IsDone, CompStartTime, CompEndTime, comp_json: { ResultClosedAt: "2000-01-01T00:00:00Z" } }), true);
    }
  }
  for (const Status of ["Reviewing", "Reject", "Temporary", "Ban"]) assert.equal(canEnterResults({ ...comp, Status }), false);
});

test("non-group legacy entry ignores Beijing dates, IsDone and round open state; edits preserve timestamp bytes", () => {
  for (const [Genre, GroupId] of [[5, 0], [3, 70], [1, 0], [2, 70], [4, 0]]) {
    const legacy = { ...comp, Genre, GroupId, IsDone: true, CompStartTime: "2020-01-01T09:12:13.123456+09:00", CompEndTime: "2020-01-03T19:22:23.654321-07:00" };
    assert.equal(canEnterResults(legacy), true);
    assert.deepEqual(competitionEditTimes(legacy, "2030-01-01", "2030-01-02"), { CompStartTime: legacy.CompStartTime, CompEndTime: legacy.CompEndTime });
  }
  assert.deepEqual(competitionEditTimes(comp, "2026-11-13", "2026-11-14"), { CompStartTime: "2026-11-13T00:00:00+08:00", CompEndTime: "2026-11-14T00:00:00+08:00" });
  assert.throws(() => competitionEditTimes(comp, "2026-11-14", "2026-11-13"));
  const events = [event("333", 7, false)];
  assert.equal(parseBatchResults("333[1] 1 2 3 4 5", events)[0].error, "");
  assert.match(parseBatchResults("333[1] 1 2 3 4 5", events, true)[0].error, /未开放/);
  assert.equal(parseBatchResults("333[1] 1 2 3 4 5", events, false)[0].error, "");
  assert.match(parseBatchResults("333[2] 1 2 3 4 5", events, false)[0].error, /不存在/);
});

test("approved upcoming, live, date-ended and explicitly ended statuses remain distinct", () => {
  assert.match(competitionStatus(comp, Date.parse(comp.CompStartTime) - 1), /未开始/);
  assert.match(competitionStatus(comp, Date.parse(comp.CompStartTime)), /运行中/);
  assert.equal(competitionStatus(comp, Date.parse("2026-11-15T00:00:00+08:00")), "赛期结束");
  assert.equal(competitionStatus({ ...comp, IsDone: true }), "已结束");
  assert.equal(competitionStatus({ ...comp, Status: "Reject" }), "已驳回");
});

test("public group status hides internal review messaging and other competition types retain timestamp semantics", () => {
  const now = Date.parse("2026-11-14T12:00:00+08:00");
  assert.equal(isGroupCompetition({ GroupId: 7, Genre: 5 }), true);
  for (const Genre of [undefined, 1, 2, 3, 4]) assert.equal(isGroupCompetition({ GroupId: 7, Genre }), false);
  for (const GroupId of [undefined, 0]) {
    for (const Genre of [1, 2, 3, 4, 5]) {
      assert.equal(publicCompetitionStatus({ ...comp, GroupId, Genre }, now), "待结束");
      assert.equal(publicCompetitionStatus({ ...comp, GroupId, Genre }, Date.parse(comp.CompStartTime)), "待结束");
    }
  }
  assert.equal(publicCompetitionStatus({ ...comp, GroupId: 7, Genre: 5 }, now), "进行中");
  assert.equal(publicCompetitionStatus({ ...comp, GroupId: 7, Genre: 5 }, Date.parse("2026-11-15T00:00:00+08:00")), "已结束");
  assert.equal(publicCompetitionStatus({ ...comp, GroupId: 7, Genre: 5, IsDone: true }, now), "已结束");
  assert.equal(publicCompetitionStatus({ ...comp, GroupId: 7, Genre: 3 }, now), "待结束");
  assert.equal(competitionStatus({ ...comp, GroupId: 7 }, Date.parse("2026-11-15T00:00:00+08:00")), "赛期结束");
});

test("normal approval and new entry stay available after End without historical confirmation", () => {
  const ended = { ...comp, IsDone: true, comp_json: { ResultClosedAt: "2026-11-13T08:00:00Z" } };
  assert.equal(canReviewResults(ended), true);
  assert.equal(canEnterResults(ended), true);
  assert.equal(canReviewResults({ ...ended, comp_json: {} }), true);
  assert.equal(canReviewResults(comp), true);
  for (const Status of ["Reviewing", "Reject", "Temporary", "Ban"]) {
    assert.equal(canReviewResults({ ...ended, Status }), false);
    assert.equal(canEnterResults({ ...comp, Status }), false);
    assert.notEqual(competitionStatus({ ...ended, Status }), "已结束");
  }
});

test("review status filters select one server page and never conflict with finish=false", () => {
  assert.deepEqual(preResultReviewFilter("ok"), { finish: "true", review_status: "passed" });
  assert.deepEqual(preResultReviewFilter("not"), { finish: "true", review_status: "rejected" });
  assert.deepEqual(preResultReviewFilter("timeout"), { finish: "true", finishDetail: "timeout" });
  for (const finish of ["false", "true", "all"]) assert.deepEqual(preResultReviewFilter(finish), { finish });
  assert.throws(() => preResultReviewFilter("invalid"));
});

test("network transport is blocked even if the mock adapter is bypassed", async () => {
  assert.throws(() => http.get("http://example.invalid"), /Network disabled/);
  assert.throws(() => https.request("https://example.invalid"), /Network disabled/);
  assert.throws(() => new net.Socket().connect(443, "example.invalid"), /Network disabled/);
  assert.throws(() => fetch("https://example.invalid"), /Network disabled/);
  await assert.rejects(Request.get("https://example.invalid", { adapter: "http" }), /Network disabled/);
});

test("time parser handles hour timestamps and rejects invalid input instead of silently recording DNF", () => {
  assert.equal(parseScore("1:02:03.45"), 3723.45);
  assert.equal(parseScore("1：02。30"), 62.3);
  assert.equal(parseScore("dnf"), -10000);
  assert.equal(parseScore("dns"), -10001);
  for (const value of ["", "NaN", "0", "-1", "1:60", "1:02:99", "12junk", "Infinity"]) assert.throws(() => parseScore(value));
  assert.deepEqual(parseAttempts("1 2 3 DNF DNS", 7), [1, 2, 3, -10000, -10001]);
  assert.throws(() => parseAttempts("1 2", 7));
});

test("multi-blind parses one, two and three triples and checks solved/attempted", () => {
  assert.deepEqual(parseAttempts("3 / 4 10:00", 8), [3, 4, 600]);
  assert.deepEqual(parseAttempts("3/4 10:00 4/5 11:00", 9), [3, 4, 600, 4, 5, 660]);
  assert.deepEqual(parseAttempts("3/4 10:00 4/5 11:00 5/6 12:00", 10), [3, 4, 600, 4, 5, 660, 5, 6, 720]);
  for (const value of ["5/4 10:00", "0/0 10:00", "3/4"]) assert.throws(() => parseAttempts(value, 8));
});

test("multi-blind accepts backend special values and only permits zero attempts for DNS", () => {
  for (const [token, code] of [["DNF", -10000], ["DNS", -10001], ["DNP", -10002], ["DNT", -10003]]) {
    assert.deepEqual(parseAttempts(`3/4 ${token}`, 8), [3, 4, code]);
    assert.deepEqual(parseAttempts(`3/4 ${code}`, 8), [3, 4, code]);
  }
  assert.deepEqual(parseAttempts("0 / 0 dns", 8), [0, 0, -10001]);
  assert.deepEqual(parseAttempts("0/0 -10001", 8), [0, 0, -10001]);
  assert.deepEqual(parseAttempts("0/0 DNS 3/4 DNF", 9), [0, 0, -10001, 3, 4, -10000]);
  for (const invalid of ["0/0 DNF", "0/0 DNP", "0/0 DNT", "1/0 DNS", "-1/4 DNS", "3/-4 DNF", "3/4 -1", "3/4 -10004", "3/4 -10000.5", "3/4 0", "9007199254740992/9007199254740992 DNS"]) {
    assert.throws(() => parseAttempts(invalid, 8), invalid);
  }
  const rows = parseBatchResults("mb1 0/0 DNS\nmb2 3/4 DNF\nmb3 3/4 -1", [event("mb1", 8), event("mb2", 8), event("mb3", 8)]);
  assert.deepEqual(rows[0].values, [0, 0, -10001]);
  assert.deepEqual(rows[1].values, [3, 4, -10000]);
  assert.ok(rows[2].error);
});

test("later rounds default to advancement lists while explicit existing restrictions remain unchanged", () => {
  assert.equal(roundNoRestrictions({}, 0), true);
  assert.equal(roundNoRestrictions({}, 1), false);
  assert.equal(roundNoRestrictions({ Competitors: 8 }, 1), false);
  assert.equal(roundNoRestrictions({ NoRestrictions: true, Competitors: 8 }, 1), true);
  assert.equal(roundNoRestrictions({ NoRestrictions: false, Competitors: 0 }, 1), false);
});

test("batch preserves spaced ratios, parses entry separators, and retains malformed lines", () => {
  const events = [event("333"), event("333mbf", 8), event("444", 7, false)];
  const rows = parseBatchResults("333[1] 1 2 3 4 5 / 333mbf[1] 3 / 4 10:00\nbroken\n444 1 2 3 4 5\n333 1 2 3 4 5", events);
  assert.equal(rows.length, 5);
  assert.equal(rows[0].error, "");
  assert.deepEqual(rows[1].values, [3, 4, 600]);
  assert.match(rows[2].error, /格式/);
  assert.equal(rows[3].error, "");
  assert.match(rows[4].error, /重复/);
});

test("event validation rejects empty/duplicate projects, wrong rounds and negative advance counts", () => {
  validateEvents([event("333")]);
  validateEvents([{ EventID: "333", EventRoute: 7, Schedule: [{ RoundNum: 1 }] }]);
  assert.throws(() => validateEvents([]));
  assert.throws(() => validateEvents([event("333"), event("333")]));
  const invalid = event("333"); invalid.Schedule[0].Competitors = -1;
  assert.throws(() => validateEvents([invalid]));
  invalid.Schedule[0].Competitors = 0; invalid.Schedule[0].RoundNum = 2;
  assert.throws(() => validateEvents([invalid]));
  assert.equal(positiveInteger("-1"), 1);
  assert.equal(positiveInteger("999", 20, 100), 100);
});

test("admin fixed routes are statically enumerated and old dynamic result route still matches", () => {
  const paths = getCatchAllStaticParams().map(({ path }) => `/${path.join("/")}`);
  for (const path of ["/admin/competition/approvals", "/admin/competition/manage", "/admin/organizers/result"]) {
    assert.ok(paths.includes(path));
    assert.ok(APP_ROUTES.some((route) => route.pattern === path));
  }
  assert.equal(matchRoute("/admin/organizers/7/comp/8/result/")?.id, "admin-organizers-comp-result");
  assert.equal(competitionReturnPath("/admin/competition/approvals?name=test&page=2", true), "/admin/competition/approvals?name=test&page=2");
  for (const invalid of ["https://example.com", "//example.com", "/admin/competition/manage?compId=1", "/admin/competition/approvals.evil"]) assert.equal(competitionReturnPath(invalid, false), "/admin/organizers/comps");
});

test("mocked adapter verifies admin scope, false bodies, filters and application errors without network", async () => {
  const original = Request.defaults.adapter;
  const requests = [];
  let response = { code: "200", data: { items: [], total: 0, next: false } };
  Request.defaults.adapter = async (config) => {
    requests.push({ method: config.method, url: config.url, body: config.data ? JSON.parse(config.data) : undefined, params: config.params });
    return { data: response, status: 200, statusText: "OK", headers: {}, config };
  };
  try {
    const admin = competitionService("admin", "", "42");
    await admin.detail(); await admin.players(); await admin.results({ cube_id: "cube-7" });
    await admin.approvePlayer(3, false); await admin.round("333", 1, false);
    await admin.addResult("333", 1, [1, 2, 3, 4, 5], "cube-7");
    await admin.preResults({ finish: "false", event: "333", round: 1, player: "Test", source: "web-api", start_time: 1, end_time: 2, page: 2, size: 20 });
    await admin.approveResult(5, "not"); await admin.deleteResult(6);
    assert.ok(requests.every((req) => req.url.startsWith("/admin/competition/comps/42")));
    assert.deepEqual(requests[3].body, { pass: false });
    assert.deepEqual(requests[4].body, { EventID: "333", RoundNumber: 1, Open: false });
    assert.deepEqual(requests[5].body, { EventId: "333", Round: 1, Results: [1, 2, 3, 4, 5], CubeID: "cube-7", Penalty: [] });
    assert.equal(requests[6].params.finish, "false");
    assert.equal(requests[6].params.page, 2);
    assert.deepEqual(requests[7].body, { FinishDetail: "not" });
    await competitionService("organizer", "7", "42").round("333", 1, true);
    assert.equal(requests.at(-1).url, "/organizers/7/comp/42/refresh_event");
    await approveGroupCompetition(42, false, "reason");
    assert.deepEqual(requests.at(-1).body, { Ok: false, RejectMsg: "reason" });
    await listGroupCompetitions("admin", "", { status: "all", id: 42, orgId: 7, groupId: 8, page: 2 });
    assert.equal(requests.at(-1).url, "/admin/competition/approvals/comps");
    assert.equal(requests.at(-1).params.status, "all");
    response = { code: "200", data: { organizers: [], groups: [], organizersNext: false, groupsNext: false } };
    await getCompetitionFilters();
    assert.equal(requests.at(-1).url, "/admin/competition/filters");
    const beforeConfirm = requests.length;
    await assert.rejects(competitionService("organizer", "7", "42").confirmHistoricalResult(77, "reason"), /管理员/);
    await assert.rejects(admin.confirmHistoricalResult(77, "  "), /理由不能为空/);
    assert.equal(requests.length, beforeConfirm);
    await admin.confirmHistoricalResult(77, "  对照原始提交核查  ");
    assert.deepEqual(requests.at(-1).body, { FinishDetail: "ok", HistoricalConfirmed: true, ReviewReason: "对照原始提交核查" });
    for (const mode of ["admin", "organizer"]) {
      const service = competitionService(mode, "7", "42");
      for (const filter of ["ok", "not", "timeout"]) {
        const query = { ...preResultReviewFilter(filter), page: 3, size: 20 };
        response = { code: "200", data: { items: [{ id: 77 }], total: 61, next: true } };
        const before = requests.length;
        const data = await service.preResults(query);
        assert.equal(requests.length, before + 1);
        assert.deepEqual(requests.at(-1).params, query);
        assert.equal(data.total, 61);
        assert.equal(data.next, true);
      }
      await service.preResults({ finishDetail: "not", finish: "true", page: 2, size: 10 });
      assert.equal(requests.at(-1).params.finishDetail, "not");
      response = { code: "400", error: "终态筛选与finish=false冲突" };
      await assert.rejects(service.preResults({ review_status: "passed", finish: "false" }), /冲突/);
    }
    response = { code: "400", error: "backend rejected" };
    await assert.rejects(admin.end(), /backend rejected/);
    await assert.rejects(apiCreateComps("7", {}), /backend rejected/);
  } finally { Request.defaults.adapter = original; }
});

test("read-only name options exhaust both independently paged lists", async () => {
  const original = Request.defaults.adapter;
  const pages = [];
  Request.defaults.adapter = async (config) => {
    assert.equal(config.url, "/admin/competition/filters");
    pages.push(config.params.page);
    const first = config.params.page === 1;
    return { status: 200, headers: {}, config, data: { code: "200", data: { organizers: first ? [{ id: 7, Name: "真实团队" }] : [], groups: [{ id: first ? 70 : 80, Name: first ? "第一页群组" : "第二页群组", OrganizersID: 7 }], organizersNext: false, groupsNext: first } } };
  };
  try {
    const options = await getCompetitionFilters();
    assert.deepEqual(pages, [1, 2]);
    assert.equal(options.organizers[0].Name, "真实团队");
    assert.equal(options.groups[1].Name, "第二页群组");
  } finally { Request.defaults.adapter = original; }
});

test("organizer legacy list filters locally and resolves omitted group metadata without altering its API", async () => {
  const original = Request.defaults.adapter;
  const calls = [];
  Request.defaults.adapter = async (config) => {
    calls.push({ url: config.url, params: config.params });
    const data = config.url.endsWith("/comp/") ? { items: [
      { ...comp, id: 42, Name: "团队群赛", Genre: 5, GroupId: undefined, OrganizersID: 7 },
      { ...comp, id: 43, Name: "原有线上赛", Genre: 3, OrganizersID: 7 },
    ], total: 2 } : { ...comp, id: 42, Genre: 5, GroupId: 70, OrganizersName: "真实团队", GroupName: "真实群组" };
    return { status: 200, headers: {}, config, data: { code: "200", data } };
  };
  try {
    const data = await listGroupCompetitions("organizer", "7", { name: "群赛", groupId: 70, status: "Running", page: 1, size: 20 });
    assert.equal(calls[0].params, undefined);
    assert.equal(calls[1].url, "/organizers/7/comp/42");
    assert.equal(data.total, 1);
    assert.equal(data.items[0].GroupName, "真实群组");
  } finally { Request.defaults.adapter = original; }
});
