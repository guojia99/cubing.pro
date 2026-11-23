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
const closeKey = "cubing-pro:site-announcement:closed-revision";
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
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const state = { current: { active: false, revision: "", text: "", href: "" }, version: 0, publicGets: 0, methods: [], publicError: false, adminReadFailed: false, adminWriteFailed: false, holdPublic: null, pageErrors: [] };

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
        "access-control-allow-methods": "GET, OPTIONS, PUT, DELETE",
        "access-control-allow-headers": "authorization, content-type",
      };
      const json = (data, status = 200) => route.fulfill({ status, headers, json: data });
      if (!apiPath && url.origin === origin) return route.continue();
      if (method === "OPTIONS" && apiPath) return route.fulfill({ status: 204, headers });
      if (apiPath === "/auth/current") return json({ data: { id: 123, Auth: auth, name: "Announcement Tester" } });
      if (apiPath?.startsWith("/user/kv/")) return json({ data: {} });
      if (apiPath === publicEndpoint || apiPath === adminEndpoint) {
        if (apiPath === publicEndpoint) {
          state.publicGets++;
          if (state.holdPublic) await state.holdPublic;
          if (state.publicError) return json({ message: "offline" }, 503);
        } else {
          state.methods.push(method);
          assert.equal(auth, 16, "ordinary admins must not call announcement admin API");
          assert.ok(request.headers().authorization === `Bearer ${superToken}`, "admin test request uses the synthetic credential");
          if (method === "GET" && state.adminReadFailed) return json({ message: "read failed" }, 503);
          if (method === "PUT" && state.adminWriteFailed) return json({ message: "write rejected" }, 422);
        }
        if (localGo) {
          const upstream = await route.fetch({ url: localGo + apiPath, headers: apiPath === adminEndpoint ? {
            authorization: `Bearer ${superToken}`, "content-type": "application/json",
          } : {}, timeout: 5000 });
          return route.fulfill({ response: upstream, headers: { ...upstream.headers(), ...headers } });
        }
        if (apiPath === publicEndpoint) {
          const { active, ...announcement } = state.current;
          return route.fulfill({ headers: { ...headers, "cache-control": "no-store" }, json: { data: active ? announcement : null } });
        }
        if (method === "PUT") {
          const { text, href } = request.postDataJSON();
          assert.equal(typeof text, "string");
          assert.equal(typeof href, "string");
          if (!state.current.active || text !== state.current.text || href !== state.current.href) {
            state.current = { active: true, revision: `browser-test-${++state.version}`, text, href };
          }
        } else if (method === "DELETE") {
          state.current.active = false;
        }
        return json({ data: state.current });
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

test("site announcement: real static pages, guest mobile lifecycle and admin publishing", { timeout: 90_000 }, async (t) => {
  const { context, state, visit, checkPublic } = await setup(t);
  const admin = await (await context({ auth: 16, width: 1080 })).newPage();
  const visitor = await (await context()).newPage();
  const first = "**Maintenance** <example>\nTonight";
  const changed = "Maintenance ends at 22:30";
  const adminResponse = (page, method) => page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith(adminEndpoint) && response.request().method() === method
  );
  const readRevision = async (response) => (await response.json()).data.revision;
  const text = admin.getByRole("textbox", { name: "Message" });
  const href = admin.getByRole("textbox", { name: "Details link (optional)" });

  await visit(admin, "/admin/site-announcement/");
  await admin.getByText("Not published").waitFor();
  assert.equal(state.publicGets, 0, "direct admin page does not load the visitor popup");
  await text.fill("😀".repeat(301));
  assert.ok(await admin.getByRole("button", { name: "Publish" }).isDisabled());
  await text.fill(first);
  await href.fill("/changelog/");
  const publish = adminResponse(admin, "PUT");
  await admin.getByRole("button", { name: "Publish" }).click();
  const rev1 = await readRevision(await publish);
  assert.ok(rev1);
  await admin.getByText("The announcement is published.").waitFor();

  const firstPublic = checkPublic(visitor);
  await visit(visitor, "/settings/");
  assert.equal((await firstPublic).headers()["cache-control"], "no-store");
  await dialog(visitor).waitFor();
  assert.equal(state.publicGets, 1, "first public document only makes one check");
  assert.match(await dialog(visitor).innerText(), /\*\*Maintenance\*\* <example>/);
  assert.equal(await visitor.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await visitor.waitForFunction(() => document.activeElement?.textContent?.trim() === "Close");
  await visitor.mouse.click(5, 5);
  await visitor.keyboard.press("Escape");
  assert.ok(await dialog(visitor).isVisible(), "backdrop and Escape do not dismiss the notice");
  assert.equal(await visitor.evaluate((key) => localStorage.getItem(key), closeKey), null);

  const detailsTab = visitor.waitForEvent("popup");
  await dialog(visitor).getByRole("link", { name: "View details" }).click();
  const details = await detailsTab;
  await details.waitForURL("**/changelog/");
  await details.close();
  assert.ok(await dialog(visitor).isVisible(), "detail link leaves notice open");
  assert.equal(await visitor.evaluate((key) => localStorage.getItem(key), closeKey), null);
  await dialog(visitor).getByRole("button", { name: "Close" }).click();
  await dialog(visitor).waitFor({ state: "hidden" });
  assert.equal(await visitor.evaluate((key) => localStorage.getItem(key), closeKey), rev1);

  const firstReload = checkPublic(visitor);
  await visitor.reload();
  await firstReload;
  await visitor.waitForLoadState("networkidle");
  assert.equal(await dialog(visitor).count(), 0);

  const noop = adminResponse(admin, "PUT");
  await admin.getByRole("button", { name: "Save", exact: true }).click();
  assert.equal(await readRevision(await noop), rev1, "no-op save has stable revision");
  const secondReload = checkPublic(visitor);
  await visitor.reload();
  await secondReload;
  await visitor.waitForLoadState("networkidle");
  assert.equal(await dialog(visitor).count(), 0);

  await text.fill(changed);
  await href.clear();
  const edit = adminResponse(admin, "PUT");
  await admin.getByRole("button", { name: "Save", exact: true }).click();
  const rev2 = await readRevision(await edit);
  assert.notEqual(rev2, rev1);
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
  assert.match(await dialog(visitor).innerText(), /Maintenance ends at 22:30/);
  assert.equal(await dialog(visitor).getByRole("link").count(), 0);
  await dialog(visitor).getByRole("button", { name: "Close" }).click();
  assert.equal(await visitor.evaluate((key) => localStorage.getItem(key), closeKey), rev2);

  const withdraw = adminResponse(admin, "DELETE");
  await admin.getByRole("button", { name: "Unpublish" }).click();
  assert.equal((await (await withdraw).json()).data.active, false);
  await admin.getByText("Not published").waitFor();
  assert.equal(await text.inputValue(), changed);
  const withdrawnPublic = checkPublic(visitor);
  await visitor.reload();
  assert.equal((await (await withdrawnPublic).json()).data, null);
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
  await admin.getByText("Not published").waitFor();
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
  state.current = { active: true, revision: "pending", text: "Show within the entry window", href: "" };
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

  state.current = { active: true, revision: "late", text: "Do not interrupt later activity", href: "" };
  state.holdPublic = new Promise((resolve) => { release = resolve; });
  const timedOut = visitor.waitForEvent("requestfailed", {
    predicate: (request) => new URL(request.url()).pathname.endsWith(publicEndpoint),
  });
  await visitor.reload();
  await timedOut;
  release();
  await visitor.waitForLoadState("networkidle");
  assert.equal(await dialog(visitor).count(), 0, "an endpoint exceeding the entry window cannot open a dialog later");
  assert.deepEqual(state.pageErrors, []);
});
