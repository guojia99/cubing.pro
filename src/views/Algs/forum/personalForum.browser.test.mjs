import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.ALGS_TEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const target = {
  kind: "solution", id: "a".repeat(16), cube: "333", className: "OLL", setName: "OLL",
  groupName: "T", caseName: "OLL 45", moves: "F (R U R' U') F'",
};
const unavailable = { ...target, id: "b".repeat(16), caseName: "Archived case", unavailable: true };
const createdAt = "2026-11-24T01:02:03Z";
const reads = [];
const errors = [];
let failComments = false;
let emptyComments = false;

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await context.addInitScript(() => {
    localStorage.setItem("cubing_pro_locale", "en-US");
    localStorage.setItem("authToken_cubing_pro", JSON.stringify({ token: "personal-forum-fixture", expire: "", status: "" }));
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(110000);
  page.on("pageerror", error => errors.push(error.message));
  await context.route("**/v3/cube-api/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.split("/v3/cube-api")[1];
    const ok = data => route.fulfill({ json: { data } });
    if (path === "/auth/current") return ok({ id: 7, Name: "Tester", CubeID: "LOCAL", Auth: 1 });
    if (path === "/user/notifications") return ok({ items: [], total: 0, page: 1, unread: 0 });
    if (path === "/public/site-announcement") return ok([]);
    if (path === "/user/formula-forum/discussions") {
      assert.equal(request.headers().authorization, "Bearer personal-forum-fixture");
      assert.equal(url.searchParams.get("size"), "20");
      const pageNumber = Number(url.searchParams.get("page"));
      return ok({ items: pageNumber === 1 ? [
        { target, count: 3, lastActivity: createdAt, lastCommentId: 42 },
        { target: unavailable, count: 1, lastActivity: createdAt, lastCommentId: 43 },
      ] : [{ target: { ...target, kind: "group", id: "c".repeat(16), caseName: "Second page", moves: "" }, count: 1, lastActivity: createdAt, lastCommentId: 44 }], total: 21, page: pageNumber });
    }
    if (path === "/user/formula-forum/comments") {
      assert.equal(request.headers().authorization, "Bearer personal-forum-fixture");
      if (failComments) return route.fulfill({ status: 503, json: { message: "Personal comments unavailable" } });
      return ok({ items: emptyComments ? [] : [
        { id: 42, target, parentId: 40, authorName: "Tester", replyToName: "Jia", body: "My exact reply", deleted: false, createdAt },
        { id: 43, target: unavailable, parentId: null, authorName: "Tester", replyToName: "", body: "My archived comment", deleted: false, createdAt },
      ], total: emptyComments ? 0 : 2, page: 1 });
    }
    if (path === `/public/formula-forum/targets/solution/${target.id}/comments`) {
      reads.push(url.searchParams.get("commentId"));
      return ok({ target, items: [{ id: 42, parentId: 40, authorName: "Tester", replyToName: "Jia", body: "My exact reply", deleted: false, createdAt }], total: 1, count: 1, page: 1 });
    }
    if (path?.startsWith("/user/kv/")) return ok({});
    return ok(null);
  });

  await page.goto(base + "/user/formula-discussions/");
  await page.getByTestId("my-discussion").first().waitFor();
  assert.equal(await page.getByTestId("my-discussion").count(), 2);
  assert.equal(await page.getByTestId("my-discussion").nth(1).getByRole("button").count(), 0);
  await page.getByTestId("my-discussion").first().click();
  await page.getByTestId("forum-comments").getByText("My exact reply", { exact: true }).waitFor();
  assert.equal(reads.at(-1), "42");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByTestId("my-discussion").getByText(/Second page/).waitFor();
  assert.equal(await page.getByTestId("my-discussion").count(), 1);

  await page.goto(base + "/user/comments/");
  await page.getByTestId("my-comment").first().waitFor();
  assert.equal(await page.getByTestId("my-comment").count(), 2);
  await page.getByTestId("my-comment").first().getByText("Reply to Jia", { exact: true }).waitFor();
  assert.equal(await page.getByTestId("my-comment").first().locator("time").getAttribute("dateTime"), createdAt);
  assert.equal(await page.getByRole("button", { name: "Delete", exact: true }).count(), 0);
  assert.equal(await page.getByTestId("my-comment").nth(1).getByRole("button", { name: "View context" }).isDisabled(), true);
  await page.getByTestId("my-comment").first().getByRole("button", { name: "View context" }).click();
  await page.getByTestId("forum-comments").getByText("My exact reply", { exact: true }).waitFor();
  assert.equal(reads.at(-1), "42");
  await page.getByRole("button", { name: "Close", exact: true }).click();

  failComments = true;
  await page.reload();
  await page.getByRole("alert").getByText("Personal comments unavailable", { exact: true }).waitFor();
  failComments = false;
  emptyComments = true;
  await page.getByRole("alert").getByRole("button").click();
  await page.waitForFunction(() => !document.querySelector('[role="status"]') && !document.querySelector('[role="alert"]'));
  assert.equal(await page.getByTestId("my-comment").count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  assert.deepEqual(errors, []);
  await context.close();

  const guest = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await guest.addInitScript(() => localStorage.setItem("cubing_pro_locale", "en-US"));
  await guest.route("**/v3/cube-api/**", route => route.fulfill({ json: { data: [] } }));
  const guestPage = await guest.newPage();
  guestPage.setDefaultNavigationTimeout(110000);
  for (const path of ["/user/formula-discussions", "/user/comments"]) {
    await guestPage.goto(base + path + "/");
    const login = guestPage.locator("main").getByRole("link", { name: "Sign in", exact: true });
    await login.waitFor();
    assert.equal(await login.getAttribute("href"), "/login?redirect=" + encodeURIComponent(path));
  }
  await guest.close();
  console.log("PASS personal discussion grouping, comment context, pagination, unavailable targets, retry, empty state, and login return links.");
} finally {
  await browser.close();
}
