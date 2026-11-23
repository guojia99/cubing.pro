import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.ALGS_TEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: "reduce" });
page.setDefaultNavigationTimeout(110000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));

const classId = "f".repeat(16);
const groupId = "a".repeat(16);
const first = "b".repeat(16);
const second = "c".repeat(16);
const third = "d".repeat(16);
const moves = ["R U R'", "F U F'", "R U R'"];
const target = { id: first, kind: "solution", cube: "333", className: "OLL", setName: "OLL", groupName: "T", caseName: "OLL 45", moves: moves[0] };
const classTarget = { ...target, kind: "class", id: classId, setName: "", groupName: "", caseName: "", moves: "" };
const classReads = [];
const classWrites = [];
let classCounts = false;
let omitClassCount = false;
let classActivity = false;
const parent = { id: 40, authorName: "Jia", replyToName: "", parentId: null, body: "How do you grip this?", deleted: false, createdAt: "2026-11-18T01:02:03Z" };
const reply = { ...parent, id: 42, parentId: 40, replyToName: "Jia", authorName: "Xi", body: "I use my index finger." };
const unavailable = { kind: "solution", id: "e".repeat(16), unavailable: true };
const tombstoneBody = "A reply on a removed formula.";
const writes = [];
const postDeleteReads = [];
const markReads = [];
let catalogRequests = 0;
let unavailableThreadRequests = 0;
let failInboxComments = false;
let firstTargetUnavailable = false;
let removed = false;
let longGroup = false;
let tombstoneDeleted = false;
let recentEmpty = false;

async function signInFromDiscussion(redirect, title = "Discuss") {
  const expected = new URL(redirect, base);
  await page.getByRole("link", { name: "Sign in to join the discussion" }).click();
  await page.waitForURL(url => url.pathname.replace(/\/$/, "") === "/login");
  assert.equal(new URL(page.url()).searchParams.get("redirect"), redirect);
  await page.getByRole("button", { name: "Continue with WCA" }).click();
  await page.waitForURL(url => url.origin === expected.origin &&
    url.pathname.replace(/\/$/, "") === expected.pathname.replace(/\/$/, "") && url.search === expected.search);
  const resumed = page.getByRole("dialog", { name: title, exact: true });
  await resumed.getByRole("textbox", { name: "Write a comment" }).waitFor();
  assert.equal(await page.evaluate(() => sessionStorage.getItem("cubing_pro_forum_login_resume")), null);
}

try {
  await page.addInitScript(moves => {
    localStorage.setItem("cubing_pro_locale", "en-US");
    localStorage.setItem("algs_hide_formula_diagram", "1");
    if (!localStorage.getItem("alg_class_cache_v2_333_OLL")) {
      const data = { name: "OLL", sets: [{ name: "OLL", groups: [{ name: "T", algs: [{ name: "OLL 45", algs: moves }] }] }] };
      localStorage.setItem("alg_class_cache_333_OLL", JSON.stringify({ data, ts: Date.now() }));
    }
  }, moves);
  await page.route("**/v3/cube-api/**", async route => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.split("/v3/cube-api")[1];
    const send = (data, status = 200) => route.fulfill({ status, json: data });
    const ok = data => send({ data, code: "200", msg: "ok" });
    if (path === "/auth/wca") {
      const callback = new URL(url.searchParams.get("redirect"));
      assert.equal(callback.origin, new URL(base).origin);
      assert.equal(callback.pathname, "/auth/callback");
      callback.searchParams.set("token", "local-forum-fixture");
      return route.fulfill({ status: 302, headers: { location: callback.href } });
    }
    if (path === "/auth/current") {
      assert.equal(req.headers().authorization, "Bearer local-forum-fixture");
      return ok({ id: 7, Name: "Xi", CubeID: "LOCAL", Auth: 9 });
    }
    if (path === "/public/algorithm/333/OLL") {
      catalogRequests++;
      return send({ name: "OLL", sets: [{ name: "OLL", groups: [{ groupId, name: "T", algs: [{ name: "OLL 45", algs: moves, solutionIds: [first, second, third] }] }] }] });
    }
    if (path === "/public/algorithm/") return send({ CubeKeys: ["333"], ClassMap: { 333: [{ name: "OLL" }] } });
    if (path === "/public/formula-forum/counts") return ok({ ...(classCounts ? { classId, ...(omitClassCount ? {} : { classCount: 7 }) } : {}), groups: {}, solutions: { [first]: 1 } });
    if (path === "/public/formula-forum/recent") {
      const items = classActivity ? [{ target: classTarget, count: 7, lastActivity: reply.createdAt, lastCommentId: 42 }] : recentEmpty ? [] : [
        { target, count: 2, lastActivity: reply.createdAt, lastCommentId: reply.id },
        { target: { ...target, id: third, caseName: "OLL 46" }, count: 1, lastActivity: parent.createdAt, lastCommentId: parent.id },
        { target: unavailable, count: 1, lastActivity: parent.createdAt },
      ];
      return ok({ items, page: 1, total: items.length });
    }
    if (path === "/user/formula-forum/notifications") {
      const items = (classActivity ? [{ id: 4, target: classTarget, commentId: 42, body: reply.body }] : [{ id: 2, target, commentId: 42, body: reply.body }, { id: 3, target: unavailable, commentId: 43, body: tombstoneBody }])
        .map(item => ({ ...item, authorName: "Xi", createdAt: reply.createdAt, readAt: markReads.includes(item.id) ? reply.createdAt : null }));
      return ok({ items, page: 1, total: items.length, unread: items.filter(item => !item.readAt).length });
    }
    if (path === "/admin/formula-forum/comments") {
      const items = [{ ...parent, body: parent.body.repeat(12), target }];
      if (!tombstoneDeleted) items.push({ ...reply, id: 43, body: tombstoneBody, target: unavailable });
      return ok({ items, page: 1, total: items.length });
    }
    if (path === "/admin/formula-forum/comments/42") { assert.equal(req.method(), "DELETE"); removed = true; return ok({}); }
    if (path === "/admin/formula-forum/comments/43") { assert.equal(req.method(), "DELETE"); tombstoneDeleted = true; return ok({}); }
    if (path === "/user/formula-forum/notifications/4/read" || path === "/user/formula-forum/notifications/2/read" || path === "/user/formula-forum/notifications/3/read") {
      assert.equal(req.method(), "PUT");
      markReads.push(Number(path.split("/").at(-2)));
      return ok({});
    }
    if (path === `/public/formula-forum/targets/solution/${first}/comments`) {
      if (failInboxComments) return send({ message: "Comments temporarily unavailable" }, 500);
      if (firstTargetUnavailable) return ok({ items: [parent], target: { ...target, unavailable: true }, page: 1, total: 1, count: 1 });
      if (removed) {
        postDeleteReads.push({ page: url.searchParams.get("page"), commentId: url.searchParams.get("commentId") });
        return ok({ items: [parent], target, page: 1, total: 20, count: 20 });
      }
      const centered = url.searchParams.get("commentId") === "42";
      return ok({ items: centered ? [reply] : [parent], target, page: centered ? 2 : 1, total: 21, count: 21 });
    }
    if (path === `/public/formula-forum/targets/solution/${third}/comments`) {
      return ok({ items: [parent], target: { ...target, id: third }, page: 1, total: 1, count: 1 });
    }
    if (path === `/public/formula-forum/targets/solution/${unavailable.id}/comments`) {
      unavailableThreadRequests++;
      return ok({ items: [], target: unavailable, page: 1, total: 0, count: 0 });
    }
    if (path === `/public/formula-forum/targets/group/${groupId}/comments`) {
      return ok({ items: longGroup ? Array.from({ length: 20 }, (_, index) => ({ ...parent, id: 100 + index, body: parent.body.repeat(8) })) : [], target: { ...target, caseName: "", moves: "", id: groupId, kind: "group" }, page: 1, total: longGroup ? 20 : 0, count: longGroup ? 20 : 0 });
    }
    if (path === `/user/formula-forum/targets/solution/${first}/comments`) {
      assert.equal(req.method(), "POST");
      writes.push(req.postDataJSON());
      return writes.length === 1 ? send({ code: "keyword_blocked" }, 422) : ok({ id: 42 });
    }
    if (path === `/public/formula-forum/targets/class/${classId}/comments`) {
      classReads.push(url.searchParams.get("commentId"));
      return ok({ items: [reply], target: classTarget, page: 1, total: 1, count: 7 });
    }
    if (path === `/user/formula-forum/targets/class/${classId}/comments`) {
      assert.equal(req.method(), "POST");
      classWrites.push(req.postDataJSON());
      return ok({ id: 42 });
    }
    if (path.includes("/formula-forum/")) throw new Error("Unexpected forum request " + path);
    return ok({});
  });

  const classPath = "/algs/333/OLL/";
  const duplicateHref = `${classPath}?solutionId=${third}`;
  const detail = page.locator(".algs-formula-detail-modal");
  const duplicates = detail.getByRole("button", { name: moves[0], exact: true });
  const dialog = page.getByRole("dialog", { name: "Discuss", exact: true });
  await page.goto(base + duplicateHref, { waitUntil: "domcontentloaded" });
  await duplicates.nth(1).and(detail.getByRole("button", { pressed: true })).waitFor();
  assert.ok(catalogRequests > 0, "Fresh legacy cache must refetch stable catalog IDs");
  assert.equal(await page.evaluate(() => localStorage.getItem("alg_class_cache_333_OLL")), null);
  assert.equal(await detail.getByRole("button", { name: /^Discuss/ }).count(), moves.length);
  const discussionActions = detail.getByRole("button", { name: /^Discuss this solution/ });
  await discussionActions.first().getByText("1", { exact: true }).waitFor();
  assert.match(await discussionActions.first().innerText(), /^Discuss this solution\s+1$/);
  assert.equal(await discussionActions.nth(1).innerText(), "Discuss this solution");
  assert.equal(await discussionActions.first().locator("svg").count(), 1);
  assert.equal(await discussionActions.first().evaluate(el => getComputedStyle(el).borderTopStyle), "solid");
  await detail.locator(".algs-formula-detail-modal__close").click();
  await page.goto(base + classPath, { waitUntil: "domcontentloaded" });
  await page.locator(".algs-formula-card").filter({ hasText: "OLL 45" }).click();
  await detail.getByRole("button", { name: /^Discuss/ }).nth(2).click();
  await signInFromDiscussion(duplicateHref);
  await detail.waitFor();
  await dialog.getByRole("button", { name: "Reply", exact: true }).click();
  await dialog.getByRole("textbox", { name: "Write a comment" }).fill("Returned to the duplicate solution");
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await duplicates.nth(1).and(detail.getByRole("button", { pressed: true })).waitFor();
  assert.equal(await duplicates.nth(0).getAttribute("aria-pressed"), "false");
  await detail.locator(".algs-formula-detail-modal__close").click();
  await detail.waitFor({ state: "hidden" });
  console.log("PASS legacy cache refetch, duplicate solution deep link, and interactive stacked dialogs after login.");

  const group = page.getByRole("button", { name: /^Discuss group/ });
  const catalogUrl = page.url();
  assert.equal(await page.getByRole("button", { name: "Discuss the entire OLL class", exact: true }).count(), 0, "Old counts without class fields keep group actions usable");
  assert.equal(await group.innerText(), "Discuss group");
  assert.equal(await group.locator("svg").count(), 1);
  await group.click();
  const groupDialog = page.getByRole("dialog", { name: "Discuss group", exact: true });
  await groupDialog.getByText("No comments yet", { exact: true }).waitFor();
  assert.equal(await groupDialog.getByRole("link", { name: "View formula" }).count(), 0);
  assert.equal(page.url(), catalogUrl);
  assert.equal(await groupDialog.getByText("333 · OLL · T", { exact: true }).count(), 1);
  const compact = await groupDialog.boundingBox();
  assert.ok(compact.height < 420, `Empty mobile sheet should be compact: ${compact.height}`);
  assert.ok(compact.y > 400);
  const comments = groupDialog.getByTestId("forum-comments");
  const composer = groupDialog.getByTestId("forum-composer");
  const shortBody = await comments.boundingBox();
  const shortComposer = await composer.boundingBox();
  assert.ok(Math.abs(shortBody.y + shortBody.height - shortComposer.y) < 2);
  assert.equal(await comments.evaluate(el => el.scrollHeight > el.clientHeight), false);
  await page.screenshot({ path: "/tmp/forum-mobile-empty.png" });
  await page.setViewportSize({ width: 1280, height: 900 });
  const desktop = await groupDialog.boundingBox();
  assert.ok(Math.abs(desktop.y + desktop.height / 2 - 450) < 3);
  assert.ok(Math.abs(desktop.x + desktop.width / 2 - 640) < 3);
  await groupDialog.getByRole("button", { name: "Close", exact: true }).click();
  await groupDialog.waitFor({ state: "hidden" });
  await group.waitFor();
  await page.screenshot({ path: "/tmp/forum-desktop-group.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  longGroup = true;
  await group.click();
  await groupDialog.getByText(parent.body.repeat(8), { exact: true }).first().waitFor();
  assert.ok((await groupDialog.boundingBox()).height <= 844 * .85 + 1);
  assert.equal(await comments.evaluate(el => el.scrollHeight > el.clientHeight), true);
  const composerBefore = await composer.boundingBox();
  await comments.evaluate(el => { el.scrollTop = el.scrollHeight; });
  assert.deepEqual(await composer.boundingBox(), composerBefore);
  await page.screenshot({ path: "/tmp/forum-mobile-long.png" });
  await page.setViewportSize({ width: 390, height: 420 });
  await groupDialog.getByRole("textbox").focus();
  await page.waitForTimeout(150);
  const smallComposer = await composer.boundingBox();
  const closeBox = await groupDialog.getByRole("button", { name: "Close", exact: true }).boundingBox();
  assert.ok(smallComposer.y + smallComposer.height <= 420);
  assert.ok(closeBox.y >= 0 && closeBox.y + closeBox.height < smallComposer.y);
  assert.equal(await comments.evaluate(el => el.scrollHeight > el.clientHeight), true);
  await page.screenshot({ path: "/tmp/forum-mobile-small.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  longGroup = false;
  console.log("PASS compact empty sheet, centered desktop dialog, internal long-list scrolling and small-height composer.");
  await groupDialog.getByRole("button", { name: "Close", exact: true }).click();
  await groupDialog.waitFor({ state: "hidden" });
  assert.equal(page.url(), catalogUrl);
  await page.locator(".algs-formula-card").filter({ hasText: "OLL 45" }).click();
  await detail.getByRole("button", { name: moves[1], exact: true }).click();
  await detail.getByRole("button", { name: /^Discuss/ }).first().click();
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
  await detail.getByText("Custom algorithms", { exact: true }).click();
  await detail.getByRole("textbox", { name: "Custom algorithms", exact: true }).fill("R U2 R'");
  await detail.getByRole("button", { name: "Add", exact: true }).click();
  await detail.getByRole("button", { name: "R U2 R'", exact: true }).waitFor();
  assert.equal(await detail.getByRole("button", { name: /^Discuss this solution/ }).count(), 0);
  await detail.locator(".algs-formula-detail-modal__close").click();

  await page.getByRole("button", { name: "Xi", exact: true }).click();
  await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
  await page.waitForURL(url => url.pathname.replace(/\/$/, "") === "/login");
  recentEmpty = true;
  await page.goto(base + "/algs/", { waitUntil: "domcontentloaded" });
  await page.getByRole("tab", { name: "Recent discussions" }).click();
  const recentTab = page.getByRole("tab", { name: "Recent discussions", selected: true });
  await recentTab.waitFor();
  const recentPanel = page.getByRole("tabpanel", { name: "Recent discussions" });
  await recentPanel.getByText("No public discussions yet", { exact: true }).waitFor();
  assert.equal(await recentPanel.getByRole("button").count(), 0);
  recentEmpty = false;
  await page.goto(base + "/algs/?tab=recent", { waitUntil: "domcontentloaded" });
  await recentTab.waitFor();
  const recentRow = recentPanel.getByRole("button").filter({ hasText: "OLL 45" });
  await recentRow.waitFor();
  await recentPanel.getByText("Formula unavailable", { exact: true }).waitFor();
  assert.equal(await recentPanel.getByRole("button").count(), 2);
  assert.match(await recentRow.innerText(), /Comments · 2 ·/);
  const recentTime = await page.evaluate(date => new Date(date).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" }), reply.createdAt);
  assert.ok((await recentRow.innerText()).includes(recentTime));
  assert.equal(await recentRow.locator('svg[aria-hidden="true"]').count(), 1);
  await page.setViewportSize({ width: 1280, height: 900 });
  await recentTab.focus();
  // The tab panel itself is a keyboard stop before its first native button.
  await page.keyboard.press("Tab");
  if (await recentPanel.evaluate(el => el === document.activeElement)) await page.keyboard.press("Tab");
  assert.equal(await recentRow.evaluate(el => el === document.activeElement && el.matches(":focus-visible")), true);
  assert.equal(await recentRow.evaluate(el => getComputedStyle(el).outlineStyle), "solid");
  for (const key of ["Enter", "Space"]) {
    await recentRow.focus();
    await page.keyboard.press(key);
    await dialog.locator("#formula-comment-42").getByText(reply.body).waitFor();
    assert.equal(await dialog.getByRole("link", { name: "View formula" }).getAttribute("href"), "/algs/333/OLL/?solutionId=" + first);
    assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const otherRecentRow = recentPanel.getByRole("button").filter({ hasText: "OLL 46" });
  const tapBox = await otherRecentRow.boundingBox();
  assert.ok(tapBox.height >= 56 && tapBox.width >= 44);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await otherRecentRow.tap({ position: { x: tapBox.width - 16, y: tapBox.height / 2 } });
  await dialog.locator("#formula-comment-40").getByText(parent.body).waitFor();
  assert.equal(await dialog.getByRole("link", { name: "View formula" }).getAttribute("href"), "/algs/333/OLL/?solutionId=" + third);
  await dialog.getByRole("button", { name: "Close", exact: true }).tap();
  await dialog.waitFor({ state: "hidden" });
  console.log("PASS recent selected tab, empty/list states, keyboard focus, Enter/Space activation, and mobile trailing-edge tap to the correct target.");
  await page.getByRole("button").filter({ hasText: "OLL 45" }).click();
  await dialog.locator("#formula-comment-42").getByText(reply.body).waitFor();
  assert.equal(await dialog.getByRole("link", { name: "View formula" }).getAttribute("href"), "/algs/333/OLL/?solutionId=" + first);
  await signInFromDiscussion("/algs/?tab=recent");
  await dialog.locator("#formula-comment-42").getByText(reply.body).waitFor();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.getByRole("tab", { name: "Recent discussions", selected: true }).waitFor();

  await page.getByRole("button", { name: "Xi", exact: true }).click();
  await page.getByRole("menuitem", { name: "Replies to me (2)" }).click();
  const inboxRow = page.getByRole("button").filter({ hasText: reply.body });
  await inboxRow.getByText("Unread", { exact: true }).waitFor();
  failInboxComments = true;
  await inboxRow.click();
  await dialog.getByRole("alert").getByText("Comments temporarily unavailable").waitFor();
  assert.equal(await page.getByText("Unread", { exact: true }).count(), 2);
  assert.deepEqual(markReads, []);
  failInboxComments = false;
  const readResponse = page.waitForResponse(response => response.url().endsWith("/notifications/2/read") && response.request().method() === "PUT" && response.ok());
  await dialog.getByRole("button", { name: "Retry", exact: true }).click();
  await dialog.locator("#formula-comment-42").getByText(reply.body).waitFor();
  await readResponse;
  assert.deepEqual(markReads, [2]);

  page.once("dialog", prompt => prompt.accept());
  await dialog.locator("#formula-comment-42").getByRole("button", { name: "Delete", exact: true }).click();
  await dialog.getByText(parent.body).waitFor();
  assert.equal(removed, true);
  assert.ok(postDeleteReads.some(({ page, commentId }) => page === "2" && commentId === null), "Reload page 2 without the deleted commentId");
  await dialog.getByRole("button", { name: "Close" }).click();
  await dialog.waitFor({ state: "hidden" });
  await inboxRow.waitFor();
  assert.equal(await inboxRow.getByText("Unread", { exact: true }).count(), 0);
  assert.deepEqual(markReads, [2]);
  const unavailableBadge = page.getByText("Formula unavailable", { exact: true });
  const unavailableTitle = page.getByText(unavailable.id, { exact: true });
  await unavailableBadge.waitFor();
  await unavailableTitle.waitFor();
  await page.getByText(tombstoneBody, { exact: true }).click();
  assert.equal(await dialog.count(), 0);
  const markRead = page.getByRole("button", { name: "Mark as read", exact: true });
  await markRead.click();
  await markRead.waitFor({ state: "hidden" });
  await unavailableBadge.waitFor();
  assert.equal(await page.getByText("Unread", { exact: true }).count(), 0);
  assert.deepEqual(markReads, [2, 3]);
  assert.equal(await dialog.count(), 0);
  await page.goto(base + "/admin/admins/", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: /Algorithm comment moderation/ }).click();
  await page.getByTestId("moderation-comment").filter({ hasText: parent.body }).waitFor();
  await unavailableBadge.waitFor();
  await unavailableTitle.waitFor();
  const adminItem = page.getByTestId("moderation-comment").filter({ hasText: parent.body });
  await adminItem.getByRole("button", { name: "View context", exact: true }).waitFor();
  await adminItem.getByText("333 · OLL · T · OLL 45", { exact: true }).waitFor();
  await adminItem.getByText(moves[0], { exact: true }).waitFor();
  const preview = adminItem.getByText(parent.body.repeat(12), { exact: true });
  assert.equal(await preview.evaluate(el => {
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    return el.clientHeight > lineHeight && el.clientHeight <= lineHeight * 3 + 1 && el.scrollWidth <= el.clientWidth;
  }), true);
  const contextBox = await adminItem.getByRole("button", { name: "View context", exact: true }).boundingBox();
  const deleteBox = await adminItem.getByRole("button", { name: "Delete", exact: true }).boundingBox();
  assert.ok(Math.abs(contextBox.y - deleteBox.y) < 2);
  assert.ok(deleteBox.x + deleteBox.width <= 390);
  await page.screenshot({ path: "/tmp/forum-admin-mobile.png" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: "/tmp/forum-admin-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await adminItem.getByRole("button", { name: "View context", exact: true }).click();
  await dialog.getByText(parent.body, { exact: true }).waitFor();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  const unavailableComment = page.getByText(tombstoneBody, { exact: true });
  await unavailableComment.click();
  assert.equal(await dialog.count(), 0);
  page.once("dialog", prompt => prompt.accept());
  await page.getByRole("button", { name: "Delete", exact: true }).nth(1).click();
  await unavailableComment.waitFor({ state: "hidden" });
  await page.getByTestId("moderation-comment").filter({ hasText: parent.body }).waitFor();
  assert.ok(tombstoneDeleted);
  assert.equal(await unavailableBadge.count(), 0);
  assert.equal(unavailableThreadRequests, 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

  firstTargetUnavailable = true;
  await page.goto(base + "/algs/?tab=recent", { waitUntil: "domcontentloaded" });
  await page.getByRole("button").filter({ hasText: "OLL 45" }).click();
  await dialog.getByText(parent.body).waitFor();
  assert.equal(await dialog.getByRole("link", { name: "View formula" }).count(), 0);
  // The cached v2 catalog has group/solution IDs but no class ID: counts supplies it.
  classCounts = true;
  classActivity = true;
  await page.goto(base + classPath, { waitUntil: "domcontentloaded" });
  const classButton = page.getByRole("button", { name: "Discuss the entire OLL class", exact: true });
  await classButton.getByText("7", { exact: true }).waitFor();
  assert.match(await classButton.innerText(), /OLL discussion/);
  assert.equal(await classButton.locator('svg[aria-hidden="true"]').count(), 1);
  assert.equal(await classButton.evaluate(el => getComputedStyle(el).borderTopStyle), "solid");
  assert.equal(await group.innerText(), "Discuss group");
  await classButton.click();
  const classDialog = page.getByRole("dialog", { name: "Discuss the entire OLL class", exact: true });
  await classDialog.getByText("333 · OLL", { exact: true }).waitFor();
  assert.equal(await classDialog.getByRole("link", { name: "View formula" }).count(), 0);
  await classDialog.getByRole("button", { name: "Reply", exact: true }).click();
  await classDialog.getByRole("textbox").fill("Entire class question");
  await classDialog.getByRole("button", { name: "Post", exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="forum-composer"] textarea')?.value === "");
  assert.deepEqual(classWrites, [{ body: "Entire class question", parentId: 42 }]);
  await classDialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Xi", exact: true }).click();
  await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
  await page.waitForURL(url => url.pathname.replace(/\/$/, "") === "/login");
  await page.goto(base + "/algs/?tab=recent", { waitUntil: "domcontentloaded" });
  await recentPanel.getByRole("button").filter({ hasText: "333 · OLL" }).click();
  await classDialog.locator("#formula-comment-42").waitFor();
  assert.equal(classReads.at(-1), "42");
  assert.equal(await classDialog.getByRole("link", { name: "View formula" }).getAttribute("href"), classPath);
  await signInFromDiscussion("/algs/?tab=recent", "Discuss the entire OLL class");
  await classDialog.locator("#formula-comment-42").waitFor();
  assert.equal(classReads.at(-1), "42");
  await classDialog.getByRole("link", { name: "View formula" }).click();
  await page.waitForURL(url => url.pathname.replace(/\/$/, "") === classPath.replace(/\/$/, "") && url.search === "");
  await classButton.waitFor();
  omitClassCount = true;
  await page.reload({ waitUntil: "domcontentloaded" });
  await classButton.waitFor();
  assert.equal(await classButton.innerText(), "OLL discussion", "Missing optional classCount does not disable class discussion");
  await page.getByRole("button", { name: "Xi", exact: true }).click();
  await page.getByRole("menuitem", { name: "Replies to me (1)" }).click();
  await page.getByRole("button").filter({ hasText: reply.body }).click();
  await classDialog.locator("#formula-comment-42").waitFor();
  assert.equal(await classDialog.getByRole("link", { name: "View formula" }).getAttribute("href"), classPath);
  await page.getByText("Unread", { exact: true }).waitFor({ state: "hidden" });
  assert.ok(markReads.includes(4));
  console.log("PASS class counts independent of cached catalog/group, class replies, recent login focus, exact class URL roundtrip, and class notification.");
  assert.deepEqual(errors, []);
  console.log("PASS recent-tab login resume, reply drafts, retry before marking read, and unavailable inbox/moderation targets.");
} finally {
  await browser.close();
}
