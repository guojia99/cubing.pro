import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { once } from "node:events";
import test from "node:test";
import { chromium } from "playwright";

const dist = resolve(process.env.SITE_ANNOUNCEMENT_STATIC_DIR ?? "dist");
const localGo = process.env.SITE_ANNOUNCEMENT_TEST_API;
const expectedMockToken = "announcement-browser-test";
const superToken = localGo ? (await readFile(process.env.SITE_ANNOUNCEMENT_TEST_TOKEN_FILE, "utf8")).trim() : expectedMockToken;
if (localGo) assert.ok(/^http:\/\/127\.0\.0\.1:\d+\/v3\/cube-api$/.test(localGo), "only a loopback test API is allowed");

const types = { html: "text/html", js: "text/javascript", css: "text/css", txt: "text/plain", json: "application/json", png: "image/png", svg: "image/svg+xml" };
const closeKey = "cubing-pro:site-announcement:closed-revisions";
const publicEndpoint = "/public/site-announcement";
const adminEndpoint = "/admin/system_result/site-announcement";

async function setup(t) {
  const server = createServer(async (request, response) => {
    try {
      const path = decodeURIComponent(new URL(request.url, "http://static.test").pathname);
      const possiblyDirectory = resolve(dist, "." + path);
      if (possiblyDirectory !== dist && !possiblyDirectory.startsWith(dist + sep)) return response.writeHead(404).end();
      const metadata = await stat(possiblyDirectory);
      const file = metadata.isDirectory() ? resolve(possiblyDirectory, "index.html") : possiblyDirectory;
      response.writeHead(200, { "content-type": types[file.split(".").at(-1)] ?? "application/octet-stream" });
      response.end(await readFile(file));
    } catch {
      if (!response.headersSent) response.writeHead(404);
      response.end();
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((done) => server.close(done)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: process.env.SITE_ANNOUNCEMENT_CHROMIUM_EXECUTABLE });
  t.after(() => browser.close());
  const state = { items: [], nextId: 0, version: 0, publicGets: 0, methods: [], publicError: false, adminReadFailed: false, adminWriteFailed: false, holdPublic: null, pageErrors: [] };

  async function context({ auth = 0, width = 390 } = {}) {
    const ctx = await browser.newContext({ viewport: { width, height: 700 }, reducedMotion: "reduce", serviceWorkers: "block" });
    await ctx.addInitScript(({ auth, token, origin }) => {
      if (location.origin !== origin) return;
      localStorage.setItem("cubing_pro_locale", "en-US");
      if (auth) localStorage.setItem("authToken_cubing_pro", JSON.stringify({ token, expire: "", status: "" }));
    }, { auth, token: auth === 16 ? superToken : expectedMockToken, origin });
    ctx.on("page", (page) => page.on("pageerror", (error) => state.pageErrors.push(error.message)));
    await ctx.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const method = request.method();
      const apiPath = url.pathname.match(/\/v3\/cube-api(\/.*)/)?.[1];
      const headers = {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "GET, OPTIONS, POST, PUT, DELETE",
        "access-control-allow-headers": "authorization, content-type",
      };
      const json = (data, status = 200) => route.fulfill({ status, headers, json: data });
      if (!apiPath && url.origin === origin) return route.continue();
      if (method === "OPTIONS" && apiPath) return route.fulfill({ status: 204, headers });
      if (apiPath === "/auth/current") return json({ data: { id: 123, Auth: auth, name: "Announcement Tester" } });
      if (apiPath?.startsWith("/user/kv/")) return json({ data: {} });
      const admin = apiPath === adminEndpoint || apiPath?.startsWith(adminEndpoint + "/");
      if (apiPath === publicEndpoint || admin) {
        if (apiPath === publicEndpoint) {
          state.publicGets++;
          if (state.holdPublic) await state.holdPublic;
          if (state.publicError) return json({ message: "offline" }, 503);
        } else {
          state.methods.push(method);
          assert.equal(auth, 16, "ordinary admins must not call announcement admin API");
          assert.ok(request.headers().authorization === `Bearer ${superToken}`, "admin test request uses the synthetic credential");
          if (method === "GET" && state.adminReadFailed) return json({ message: "read failed" }, 503);
          if ((method === "PUT" || method === "POST") && state.adminWriteFailed) return json({ message: "write rejected" }, 422);
        }
        if (localGo) {
          const upstream = await route.fetch({ url: localGo + apiPath, headers: admin ? {
            authorization: `Bearer ${superToken}`, "content-type": "application/json",
          } : {}, timeout: 5000 });
          return route.fulfill({ response: upstream, headers: { ...upstream.headers(), ...headers } });
        }
        if (apiPath === publicEndpoint) {
          const visible = state.items.filter((item) => item.active).map(({ id, revision, text, href }) => ({ id, revision, text, href }));
          return route.fulfill({ headers: { ...headers, "cache-control": "no-store" }, json: { data: visible } });
        }
        if (method === "GET") return json({ data: state.items });
        const id = apiPath.slice(adminEndpoint.length + 1);
        const existing = state.items.find((item) => item.id === id);
        if (method === "POST" || method === "PUT") {
          const { text, href } = request.postDataJSON();
          assert.equal(typeof text, "string");
          assert.equal(typeof href, "string");
          if (method === "POST") {
            const item = { id: `message-${++state.nextId}`, active: true, revision: `revision-${++state.version}`, text, href };
            state.items.unshift(item);
            return json({ data: item });
          }
          if (!existing) return json({ data: null }, 404);
          if (!existing.active || text !== existing.text || href !== existing.href) {
            if (!existing.active) state.items = [existing, ...state.items.filter((item) => item.id !== id)];
            Object.assign(existing, { active: true, revision: `revision-${++state.version}`, text, href });
          }
          return json({ data: existing });
        }
        if (!existing) return json({ data: null }, 404);
        existing.active = false;
        return json({ data: existing });
      }
      if (apiPath) return json({ data: null });
      return route.abort();
    });
    return ctx;
  }

  async function visit(page, path) {
    const response = await page.goto(origin + path);
    assert.ok(response?.ok(), `static path loads: ${path}`);
    await page.waitForFunction(() => document.documentElement.lang === "en-US");
  }

  const checkPublic = (page) => page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith(publicEndpoint) && response.request().method() === "GET"
  );

  return { origin, state, context, visit, checkPublic };
}

const dialog = (page) => page.getByRole("dialog", { name: "Site announcement" });

test("site announcement: publish and independently dismiss, edit and withdraw multiple rows on mobile", { timeout: 90_000 }, async (t) => {
  const { context, state, visit, checkPublic } = await setup(t);
  const admin = await (await context({ auth: 16, width: 390 })).newPage();
  const visitor = await (await context()).newPage();
  const first = "**Maintenance** <example>\nTonight";
  const second = "Event registration opens today";
  const changed = "Event registration starts tomorrow";
  const adminResponse = (method) => admin.waitForResponse((response) => {
    const path = new URL(response.url()).pathname;
    return (path.endsWith(adminEndpoint) || path.includes(adminEndpoint + "/")) && response.request().method() === method;
  });
  const result = async (response) => (await (await response).json()).data;
  const text = admin.getByRole("textbox", { name: "Message" });
  const href = admin.getByRole("textbox", { name: "Details link (optional)" });
  const row = (value) => admin.getByRole("listitem").filter({ hasText: value });
  const storedRevisions = () => visitor.evaluate((key) => JSON.parse(localStorage.getItem(key)), closeKey);

  await visit(admin, "/admin/site-announcement/");
  await admin.getByText("No announcements yet").waitFor();
  assert.equal(state.publicGets, 0, "direct admin page does not load the visitor popup");
  await text.fill("😀".repeat(301));
  assert.ok(await admin.getByRole("button", { name: "Publish", exact: true }).isDisabled());
  await text.fill(first);
  await href.fill("/changelog/");
  const publishFirst = adminResponse("POST");
  await admin.getByRole("button", { name: "Publish", exact: true }).click();
  const a = await result(publishFirst);
  assert.ok(a.id && a.revision);
  await admin.getByRole("status").filter({ hasText: /^Published$/ }).waitFor();

  await admin.getByRole("button", { name: "New announcement" }).click();
  await text.fill(second);
  const publishSecond = adminResponse("POST");
  await admin.getByRole("button", { name: "Publish", exact: true }).click();
  const b = await result(publishSecond);
  assert.notEqual(a.id, b.id);
  assert.ok(b.revision);
  await row(second).getByText("Published", { exact: true }).waitFor();
  await row("**Maintenance**").getByText("Published", { exact: true }).waitFor();

  const firstPublic = checkPublic(visitor);
  await visit(visitor, "/settings/");
  const firstResponse = await firstPublic;
  assert.equal(firstResponse.headers()["cache-control"], "no-store");
  assert.deepEqual((await firstResponse.json()).data.map((item) => item.id), [b.id, a.id]);
  await dialog(visitor).waitFor();
  assert.equal(state.publicGets, 1, "first public document only makes one check");
  assert.equal(await dialog(visitor).count(), 1, "both announcements share the same dialog");
  const shown = dialog(visitor).getByRole("listitem");
  assert.deepEqual(await shown.count(), 2);
  assert.match((await shown.nth(0).innerText()), new RegExp(second));
  assert.match((await shown.nth(1).innerText()), /\*\*Maintenance\*\* <example>/);
  assert.equal(await visitor.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await visitor.waitForFunction(() => document.activeElement?.textContent?.trim() === "Close");
  await visitor.mouse.click(5, 5);
  await visitor.keyboard.press("Escape");
  assert.ok(await dialog(visitor).isVisible(), "backdrop and Escape do not dismiss the notice");
  assert.equal(await storedRevisions(), null);
  const detailsTab = visitor.waitForEvent("popup");
  await shown.nth(1).getByRole("link", { name: "View details" }).click();
  const details = await detailsTab;
  await details.waitForURL("**/changelog/");
  await details.close();
  assert.ok(await dialog(visitor).isVisible(), "detail link leaves notice open");
  assert.equal(await storedRevisions(), null);
  await dialog(visitor).getByRole("button", { name: "Close" }).click();
  await dialog(visitor).waitFor({ state: "hidden" });
  assert.deepEqual(await storedRevisions(), { [a.id]: a.revision, [b.id]: b.revision });

  const firstReload = checkPublic(visitor);
  await visitor.reload();
  await firstReload;
  await visitor.waitForLoadState("networkidle");
  assert.equal(await dialog(visitor).count(), 0);

  const noop = adminResponse("PUT");
  await admin.getByRole("button", { name: "Save changes", exact: true }).click();
  assert.equal((await result(noop)).revision, b.revision, "no-op save has stable revision");
  const secondReload = checkPublic(visitor);
  await visitor.reload();
  await secondReload;
  await visitor.waitForLoadState("networkidle");
  assert.equal(await dialog(visitor).count(), 0);

  await text.fill(changed);
  const edit = adminResponse("PUT");
  await admin.getByRole("button", { name: "Save changes", exact: true }).click();
  const editedB = await result(edit);
  assert.equal(editedB.id, b.id);
  assert.notEqual(editedB.revision, b.revision);
  const getsBeforeNav = state.publicGets;
  await visitor.evaluate(() => { window.announcementTestDocument = true; });
  await visitor.locator('[data-app-header] a[href="/"]').first().click();
  await visitor.waitForURL((url) => url.pathname === "/");
  await visitor.waitForLoadState("networkidle");
  assert.equal(await visitor.evaluate(() => window.announcementTestDocument), true, "used real SPA navigation");
  assert.equal(state.publicGets, getsBeforeNav, "SPA navigation does not make another request");
  assert.equal(await dialog(visitor).count(), 0);

  const thirdReload = checkPublic(visitor);
  await visitor.reload();
  await thirdReload;
  await dialog(visitor).waitFor();
  assert.equal(await dialog(visitor).getByRole("listitem").count(), 1);
  assert.match(await dialog(visitor).innerText(), new RegExp(changed));
  assert.doesNotMatch(await dialog(visitor).innerText(), /Maintenance/);
  await dialog(visitor).getByRole("button", { name: "Close" }).click();
  assert.deepEqual(await storedRevisions(), { [a.id]: a.revision, [b.id]: editedB.revision });

  const withdraw = adminResponse("DELETE");
  await admin.getByRole("button", { name: "Unpublish", exact: true }).click();
  const withdrawnB = await result(withdraw);
  assert.equal(withdrawnB.id, b.id);
  assert.equal(withdrawnB.active, false);
  await row(changed).getByText("Unpublished", { exact: true }).waitFor();
  assert.equal(await text.inputValue(), changed);
  const withdrawnPublic = checkPublic(visitor);
  await visitor.reload();
  assert.deepEqual((await (await withdrawnPublic).json()).data.map((item) => item.id), [a.id]);
  await visitor.waitForLoadState("networkidle");
  assert.equal(await dialog(visitor).count(), 0);

  const republish = adminResponse("PUT");
  await admin.getByRole("button", { name: "Republish", exact: true }).click();
  const republishedB = await result(republish);
  assert.equal(republishedB.id, b.id);
  assert.notEqual(republishedB.revision, editedB.revision);
  await visitor.reload();
  await dialog(visitor).waitFor();
  assert.equal(await dialog(visitor).getByRole("listitem").count(), 1);
  await dialog(visitor).getByRole("button", { name: "Close" }).click();

  await row("**Maintenance**").getByRole("button", { name: "Edit announcement" }).click();
  const olderWithdrawal = adminResponse("DELETE");
  await admin.getByRole("button", { name: "Unpublish", exact: true }).click();
  await result(olderWithdrawal);
  const olderRepublish = adminResponse("PUT");
  await admin.getByRole("button", { name: "Republish", exact: true }).click();
  assert.equal((await result(olderRepublish)).id, a.id);
  await admin.waitForFunction((id) => document.querySelector("[data-announcement-id]")?.getAttribute("data-announcement-id") === id, a.id);
  const orderedPublic = checkPublic(visitor);
  await visitor.reload();
  assert.deepEqual((await (await orderedPublic).json()).data.map((item) => item.id), [a.id, b.id]);
  await dialog(visitor).waitFor();
  assert.match(await dialog(visitor).innerText(), /Maintenance/);
  assert.doesNotMatch(await dialog(visitor).innerText(), /Event registration/);
  await dialog(visitor).getByRole("button", { name: "Close" }).click();

  for (const content of [changed, "**Maintenance**"]) {
    await row(content).getByRole("button", { name: "Edit announcement" }).click();
    const withdrawal = adminResponse("DELETE");
    await admin.getByRole("button", { name: "Unpublish", exact: true }).click();
    assert.equal((await result(withdrawal)).active, false);
  }
  const emptyPublic = checkPublic(visitor);
  await visitor.reload();
  assert.deepEqual((await (await emptyPublic).json()).data, []);
  await visitor.waitForLoadState("networkidle");
  assert.equal(await dialog(visitor).count(), 0);
  assert.deepEqual(state.pageErrors, []);
});

test("site announcement: guard, network failure and late response", { skip: Boolean(localGo), timeout: 60_000 }, async (t) => {
  const { context, state, visit, checkPublic } = await setup(t);

  const noAccess = await (await context({ auth: 8 })).newPage();
  await visit(noAccess, "/admin/site-announcement/");
  await noAccess.getByRole("status").filter({ hasText: "You do not have access to this page" }).first().waitFor();
  assert.deepEqual(state.methods, []);

  const admin = await (await context({ auth: 16 })).newPage();
  state.adminReadFailed = true;
  await visit(admin, "/admin/site-announcement/");
  await admin.getByRole("alert").filter({ hasText: "Could not load the announcement settings." }).waitFor();
  state.adminReadFailed = false;
  await admin.getByRole("button", { name: "Retry" }).click();
  await admin.getByText("No announcements yet").waitFor();
  state.adminWriteFailed = true;
  const text = admin.getByRole("textbox", { name: "Message" });
  await text.fill("Preserve administrator input");
  await admin.getByRole("button", { name: "Publish" }).click();
  await admin.getByRole("alert").filter({ hasText: "write rejected" }).waitFor();
  assert.equal(await text.inputValue(), "Preserve administrator input");

  const visitor = await (await context()).newPage();
  state.publicError = true;
  const failedPublic = checkPublic(visitor);
  await visit(visitor, "/");
  assert.equal((await failedPublic).status(), 503);
  await visitor.waitForLoadState("networkidle");
  assert.equal(await dialog(visitor).count(), 0);

  state.publicError = false;
  state.items = [{ id: "one", active: true, revision: "pending", text: "Show within the entry window", href: "" }];
  let release;
  state.holdPublic = new Promise((resolve) => { release = resolve; });
  const pendingPublic = checkPublic(visitor);
  await visitor.reload();
  await visitor.waitForFunction(() => document.documentElement.lang === "en-US");
  await visitor.mouse.click(5, 699);
  release();
  await pendingPublic;
  await dialog(visitor).waitFor();
  await dialog(visitor).getByRole("button", { name: "Close" }).click();

  state.items = [{ id: "one", active: true, revision: "late", text: "Do not interrupt later activity", href: "" }];
  state.holdPublic = new Promise((resolve) => { release = resolve; });
  const timedOut = visitor.waitForEvent("requestfailed", {
    predicate: (request) => new URL(request.url()).pathname.endsWith(publicEndpoint),
  });
  await visitor.reload();
  await timedOut;
  release();
  await visitor.waitForLoadState("networkidle");
  assert.equal(await dialog(visitor).count(), 0, "an endpoint exceeding the entry window cannot open a dialog later");

  state.holdPublic = null;
  state.items = Array.from({ length: 8 }, (_, index) => ({
    id: String(index), active: true, revision: `many-${index}`,
    text: `Notice ${index} — ${"Long mobile announcement content. ".repeat(5)}`, href: "",
  }));
  await visitor.reload();
  await dialog(visitor).waitFor();
  const content = dialog(visitor).getByRole("list").locator("..");
  assert.equal(await dialog(visitor).getByRole("listitem").count(), 8);
  assert.ok(await content.evaluate((element) => element.scrollHeight > element.clientHeight));
  await content.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  assert.ok(await content.evaluate((element) => element.scrollTop > 0));
  await dialog(visitor).getByRole("button", { name: "Close" }).click();
  await dialog(visitor).waitFor({ state: "hidden" });
  assert.deepEqual(state.pageErrors, []);
});
