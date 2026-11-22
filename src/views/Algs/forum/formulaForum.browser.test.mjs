import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.ALGS_TEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
page.setDefaultNavigationTimeout(110000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));

const groupId = "a".repeat(16);
const first = "b".repeat(16);
const second = "c".repeat(16);
const moves = ["R U R'", "F U F'"];
const target = { id: first, kind: "solution", cube: "333", className: "OLL", setName: "OLL", groupName: "T", caseName: "OLL 45", moves: moves[0] };
const parent = { id: 40, authorName: "Jia", replyToName: "", parentId: null, body: "How do you grip this?", deleted: false, createdAt: "2026-11-18T01:02:03Z" };
const reply = { ...parent, id: 42, parentId: 40, replyToName: "Jia", authorName: "Xi", body: "I use my index finger." };
const writes = [];
const postDeleteReads = [];
let read = false;
let removed = false;

try {
  await page.addInitScript(() => {
    localStorage.setItem("cubing_pro_locale", "en-US");
    localStorage.setItem("algs_hide_formula_diagram", "1");
    localStorage.setItem("authToken_cubing_pro", JSON.stringify({ token: "local-forum-fixture", expire: "", status: "" }));
  });
  await page.route("**/v3/cube-api/**", async route => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.split("/v3/cube-api")[1];
    const send = (data, status = 200) => route.fulfill({ status, json: data });
    const ok = data => send({ data, code: "200", msg: "ok" });
    if (path === "/auth/current") return ok({ id: 7, Name: "Xi", CubeID: "LOCAL", Auth: 9 });
    if (path === "/public/algorithm/333/OLL") return send({ name: "OLL", sets: [{ name: "OLL", groups: [{ groupId, name: "T", algs: [{ name: "OLL 45", algs: moves, solutionIds: [first, second] }] }] }] });
    if (path === "/public/algorithm/") return send({ CubeKeys: ["333"], ClassMap: { 333: [{ name: "OLL" }] } });
    if (path === "/public/formula-forum/counts") return ok({ groups: {}, solutions: { [first]: 1 } });
    if (path === "/public/formula-forum/recent") return ok({ items: [{ target, count: 2, lastActivity: reply.createdAt, lastCommentId: reply.id }], page: 1, total: 1 });
    if (path === "/user/formula-forum/notifications") return ok({ items: [{ id: 2, target, commentId: 42, body: reply.body, authorName: "Xi", createdAt: reply.createdAt, readAt: read ? reply.createdAt : null }], page: 1, total: 1, unread: read ? 0 : 1 });
    if (path === "/admin/formula-forum/comments") return ok({ items: [{ ...parent, target }], page: 1, total: 1 });
    if (path === "/admin/formula-forum/comments/42") { assert.equal(req.method(), "DELETE"); removed = true; return ok({}); }
    if (path === "/user/formula-forum/notifications/2/read") { assert.equal(req.method(), "PUT"); read = true; return ok({}); }
    if (path === `/public/formula-forum/targets/solution/${first}/comments`) {
      if (removed) {
        postDeleteReads.push({ page: url.searchParams.get("page"), commentId: url.searchParams.get("commentId") });
        return ok({ items: [parent], target, page: 1, total: 20, count: 20 });
      }
      const centered = url.searchParams.get("commentId") === "42";
      return ok({ items: centered ? [reply] : [parent], target, page: centered ? 2 : 1, total: 21, count: 21 });
    }
    if (path === `/public/formula-forum/targets/group/${groupId}/comments`) {
      return ok({ items: [], target: { ...target, caseName: "", moves: "", id: groupId, kind: "group" }, page: 1, total: 0, count: 0 });
    }
    if (path === `/user/formula-forum/targets/solution/${first}/comments`) {
      assert.equal(req.method(), "POST");
      writes.push(req.postDataJSON());
      return writes.length === 1 ? send({ code: "keyword_blocked" }, 422) : ok({ id: 42 });
    }
    if (path.includes("/formula-forum/")) throw new Error("Unexpected forum request " + path);
    return ok({});
  });

  await page.goto(base + "/algs/333/OLL/", { waitUntil: "domcontentloaded" });
  const group = page.getByRole("button", { name: /^Discuss group/ });
  const catalogUrl = page.url();
  await group.click();
  const groupDialog = page.getByRole("dialog", { name: "Discuss group", exact: true });
  await groupDialog.getByText("No comments yet", { exact: true }).waitFor();
  assert.equal(await groupDialog.getByRole("link", { name: "View formula" }).count(), 0);
  assert.equal(page.url(), catalogUrl);
  await groupDialog.getByRole("button", { name: "Close", exact: true }).click();
  await groupDialog.waitFor({ state: "hidden" });
  assert.equal(page.url(), catalogUrl);
  await page.locator(".algs-formula-card").filter({ hasText: "OLL 45" }).click();
  const detail = page.locator(".algs-formula-detail-modal");
  await detail.getByRole("button", { name: moves[1], exact: true }).click();
  await detail.getByRole("button", { name: /^Discuss/ }).first().click();
  const dialog = page.getByRole("dialog", { name: "Discuss", exact: true });
  await dialog.getByRole("button", { name: "Reply", exact: true }).click();
  assert.equal(await dialog.getByRole("link", { name: "View formula" }).count(), 0);
  const input = dialog.getByRole("textbox", { name: "Write a comment" });
  await input.fill("blocked draft");
  await dialog.getByRole("button", { name: "Post", exact: true }).click();
  await dialog.getByRole("alert").waitFor();
  assert.equal(await input.inputValue(), "blocked draft");
  await input.fill(reply.body);
  await dialog.getByRole("button", { name: "Post", exact: true }).click();
  await dialog.locator("#formula-comment-42").getByText(reply.body).waitFor();
  assert.deepEqual(writes, [{ body: "blocked draft", parentId: 40 }, { body: reply.body, parentId: 40 }]);
  assert.equal(await input.inputValue(), "");
  await dialog.getByRole("button", { name: "Close" }).click();
  await dialog.waitFor({ state: "hidden" });
  assert.equal(await detail.getByRole("button", { name: moves[1], exact: true }).getAttribute("aria-pressed"), "true");
  await detail.locator(".algs-formula-detail-modal__close").click();

  await page.goto(base + "/algs/", { waitUntil: "domcontentloaded" });
  await page.getByRole("tab", { name: "Recent discussions" }).click();
  await page.getByRole("button").filter({ hasText: "OLL 45" }).click();
  await dialog.locator("#formula-comment-42").getByText(reply.body).waitFor();
  assert.equal(await dialog.getByRole("link", { name: "View formula" }).getAttribute("href"), "/algs/333/OLL/?set=OLL&group=T&case=OLL+45&alg=R+U+R%27");
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.getByRole("tab", { name: "Recent discussions", selected: true }).waitFor();

  await page.getByRole("button", { name: "Xi", exact: true }).click();
  await page.getByRole("menuitem", { name: "Replies to me (1)" }).click();
  await page.getByRole("button").filter({ hasText: reply.body }).click();
  await dialog.locator("#formula-comment-42").getByText(reply.body).waitFor();
  assert.equal(read, true);

  page.once("dialog", prompt => prompt.accept());
  await dialog.locator("#formula-comment-42").getByRole("button", { name: "Delete", exact: true }).click();
  await dialog.getByText(parent.body).waitFor();
  assert.equal(removed, true);
  assert.ok(postDeleteReads.some(({ page, commentId }) => page === "2" && commentId === null), "Reload page 2 without the deleted commentId");
  await dialog.getByRole("button", { name: "Close" }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.getByRole("button").filter({ hasText: reply.body }).waitFor();
  await page.goto(base + "/admin/admins/", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: /Algorithm comment moderation/ }).click();
  await page.getByRole("button").filter({ hasText: parent.body }).waitFor();
  await page.getByRole("button", { name: "Delete", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);
  console.log("PASS mobile group and solution dialogs, reply drafts, centered pages, recent discussions, inbox and moderation.");
} finally {
  await browser.close();
}
