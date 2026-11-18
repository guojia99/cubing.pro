import assert from "node:assert/strict";
import { chromium, type Page } from "playwright";
import { catalogs as rootCatalogs, type Locale } from "../../i18n";
import { adminManagementZhCN, adminManagementEnUS, adminManagementJa, adminManagementYue, adminManagementKo, adminManagementFr, adminManagementEs } from "../../i18n/messages/admin-management";

const origin = process.env.ADMIN_I18N_ORIGIN || "http://localhost:3000";
const catalogs = { "zh-CN": adminManagementZhCN, "en-US": adminManagementEnUS, ja: adminManagementJa, "yue-Hant-HK": adminManagementYue, ko: adminManagementKo, fr: adminManagementFr, es: adminManagementEs };
const locales = (process.env.ADMIN_I18N_LOCALES?.split(",") ?? Object.keys(catalogs)) as Locale[];
const user = { id: 1, Auth: 31, Name: "Fixture User", CubeID: "2026TEST01", WcaID: "2026TEST01", QQ: "", QQUniID: "", Email: "fixture@example.invalid", EnName: "Fixture", Sex: 1, Level: 1, Experience: 0, createdAt: "2026-01-01T00:00:00Z" };
const organizer = { id: 7, Name: "Fixture Team", Status: "Using", LeaderID: user.CubeID, AssOrganizerUsers: "[]" };
const group = { id: 8, name: "Fixture Group", OrganizersID: 7, qq_groups: [], qq_group_uid: [], wechat_groups: [] };
const links = { groups: ["API 原始分组"], group_map: { "API 原始分组": ["fixture"] }, tops: [], links: [{ key: "fixture", name: "API 原始名称", desc: "API 原始描述", url: "https://example.invalid", icon: "letter:F" }] };
const browser = await chromium.launch({ headless: true });
const errors: string[] = [];
const mutations: string[] = [];

async function open(page: Page, path: string, title: string) {
  await page.goto(`${origin}${path}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  try {
    await page.getByRole("heading", { name: title, exact: true }).waitFor();
  } catch (error) {
    console.error({ url: page.url(), text: (await page.locator("body").innerText()).slice(0, 4000) });
    throw error;
  }
}

try {
  for (const locale of locales) {
    const m = catalogs[locale];
    const t = rootCatalogs[locale];
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block" });
    await context.addInitScript((locale) => {
      localStorage.setItem("cubing_pro_locale", locale);
      localStorage.setItem("authToken_cubing_pro", JSON.stringify({ token: "offline-i18n-fixture", expire: "2099-01-01" }));
    }, locale);
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const marker = "/v3/cube-api";
      const index = url.pathname.indexOf(marker);
      if (index >= 0) {
        const path = url.pathname.slice(index + marker.length);
        if (!["GET", "HEAD", "OPTIONS"].includes(request.method()) && path !== "/admin/users/") mutations.push(`${request.method()} ${path}`);
        const paged = (items: unknown[]) => ({ code: "200", data: { items, total: items.length, next: false } });
        let data: unknown = { code: "200", data: {} };
        if (path === "/auth/current") data = { code: "200", data: user };
        else if (path.startsWith("/user/kv/")) data = { code: "200", data: { value: "" } };
        else if (path === "/diy_static/diy_rankings") data = { data: [{ id: "fixture", Description: "Fixture ranking", Value: "[]" }] };
        else if (path.includes("otherLinks")) data = links;
        else if (path.includes("acknowledgments")) data = [{ nickname: "Fixture Sponsor", amount: 1, wcaID: "", avatar: "", other: "", pinned: false }];
        else if (path === "/admin/users/") data = paged([user]);
        else if (path === "/admin/competition/organizers") data = paged([organizer]);
        else if (path.endsWith("/groups")) data = paged([group]);
        else if (path === "/admin/competition/organizers/7") data = { code: "200", data: { organizer, groups: [group] } };
        return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" }, body: JSON.stringify(data) });
      }
      if (url.origin === origin) return route.continue();
      return route.abort();
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(`${locale}: ${error.message}`));

    await open(page, "/admin/diy-ranking", m["adminManagement.rankingTitle"]);
    await page.getByRole("button", { name: t["teamMatch.add"], exact: true }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: t["competitionAdmin.submit"], exact: true }).click();
    await dialog.getByText(m["adminManagement.keyRequired"], { exact: true }).waitFor();
    await dialog.getByText(m["adminManagement.descriptionRequired"], { exact: true }).waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: t["teamMatch.edit"], exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder(m["adminManagement.personCode"]).fill("invalid");
    await dialog.getByRole("button", { name: t["teamMatch.add"], exact: true }).click();
    await page.getByText(m["adminManagement.invalidPersonCode"], { exact: true }).waitFor();

    await open(page, "/admin/other-links", t["externalLinks.adminTitle"]);
    await page.getByText("API 原始名称", { exact: true }).waitFor();
    await page.getByText("API 原始描述", { exact: true }).waitFor();
    await page.getByRole("button", { name: m["adminManagement.addLink"], exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByText(m["adminManagement.icon"], { exact: true }).waitFor();
    await dialog.getByRole("button", { name: t["competitionAdmin.confirm"], exact: true }).click();
    await page.getByText(m["adminManagement.linkRequired"], { exact: true }).waitFor();

    await open(page, "/admin/acknowledgments", t["admin.acknowledgments.title"]);
    await page.getByRole("button", { name: t["teamMatch.edit"], exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByText(m["adminManagement.avatarUrl"], { exact: true }).waitFor();
    await dialog.getByText(m["adminManagement.optionalNotes"], { exact: true }).waitFor();

    await open(page, "/admin/users", m["adminManagement.usersTitle"]);
    await page.getByRole("button", { name: m["adminManagement.createUser"], exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: t["competitionAdmin.submit"], exact: true }).click();
    await dialog.getByText(m["adminManagement.usernameRequired"], { exact: true }).waitFor();

    await open(page, "/admin/manage/organizers", m["adminManagement.organizersTitle"]);
    await page.getByText(m["adminManagement.statusUsing"], { exact: true }).waitFor();
    await page.getByRole("button", { name: m["adminManagement.newTeam"], exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByText(m["adminManagement.leaderNotes"], { exact: true }).waitFor();
    await dialog.getByText(m["adminManagement.addMemberHint"], { exact: true }).waitFor();

    await open(page, "/admin/manage/groups", m["adminManagement.groupsTitle"]);
    await page.getByText(m["adminManagement.chooseOrganizerHint"], { exact: true }).waitFor();
    await page.locator("main .ant-select-selector").click();
    await page.getByText("Fixture Team（id: 7）", { exact: true }).last().click();
    await page.getByRole("button", { name: m["adminManagement.newGroup"], exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByText(m["adminManagement.qqGroupUid"], { exact: true }).waitFor();
    await dialog.getByText(m["adminManagement.wechatGroups"], { exact: true }).waitFor();

    assert.deepEqual(errors, [], "browser errors");
    console.log(`PASS ${locale}: DIY validation, link content and dialog, sponsorship editor, users, organizers, groups`);
    await context.close();
  }
  assert.deepEqual(mutations, [], "tests must not submit mutations");
} finally {
  await browser.close();
}
