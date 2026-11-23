// Run after the parent's offline static build:
// node --test src/views/DrawTools/PlayerCard/playerCard.browser.test.mjs
// Optional: SITE_PLAYER_CARD_STATIC_DIR (default dist), SITE_PLAYER_CARD_CHROMIUM_EXECUTABLE.
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright";

test("static player card: local photo, touch crop, preview fidelity and real PNG download", { timeout: 90000 }, async () => {
  const root = path.resolve(process.env.SITE_PLAYER_CARD_STATIC_DIR || "dist");
  await stat(path.join(root, "draw-tools/player-card/index.html"));
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      let file = path.resolve(root, `.${pathname}`);
      if (!file.startsWith(`${root}${path.sep}`)) { res.writeHead(403).end(); return; }
      if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
      const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
      res.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
      res.end(await readFile(file));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ executablePath: process.env.SITE_PLAYER_CARD_CHROMIUM_EXECUTABLE || undefined });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, acceptDownloads: true });
    await context.addInitScript((origin) => { if (location.origin === origin) localStorage.setItem("cubing_pro_locale", "en-US"); }, origin);
    const uploads = [];
    const external = [];
    const fontRequests = [];
    const fontRequested = Promise.withResolvers();
    const fontRelease = Promise.withResolvers();
    let failFont = false;
    await context.route("**/*", async route => {
      const request = route.request();
      if (!["GET", "HEAD"].includes(request.method())) uploads.push(request.url());
      if (request.url().includes("/v3/cube-api/")) return route.fulfill({ json: { data: [] } });
      if (new URL(request.url()).origin !== origin) { external.push(request.url()); return route.abort(); }
      if (new URL(request.url()).pathname === "/fonts/player-card/zhi-mang-xing.woff2") {
        fontRequests.push(request.url());
        fontRequested.resolve();
        await fontRelease.promise;
        if (failFont) return route.abort();
      }
      return route.continue();
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    assert.equal((await page.goto(`${origin}/draw-tools/player-card/`)).status(), 200);
    await page.getByRole("heading", { name: "Player card maker", exact: true }).waitFor();
    const downloadButton = page.getByRole("button", { name: "Download PNG · 1080 × 1080", exact: true });
    assert.equal(await downloadButton.isDisabled(), true);
    assert.equal(await page.getByRole("slider").isDisabled(), true);
    const photo = page.locator('#player-card-photo');
    await photo.setInputFiles({ name: "empty.png", mimeType: "image/png", buffer: Buffer.alloc(0) });
    await page.getByRole("alert").filter({ hasText: "Cannot read this photo." }).waitFor();
    assert.equal(await downloadButton.isDisabled(), true);
    await photo.setInputFiles({ name: "text.txt", mimeType: "text/plain", buffer: Buffer.from("text") });
    await page.getByRole("alert").filter({ hasText: "Cannot read this photo." }).waitFor();
    assert.equal(await downloadButton.isDisabled(), true);
    const selectPhoto = page.getByRole("button", { name: "Choose photo", exact: true });
    const chooseBounds = await selectPhoto.boundingBox();
    assert.ok(chooseBounds && chooseBounds.y >= 0 && chooseBounds.y + chooseBounds.height <= 844, "Choose photo is visible without scrolling");
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), selectPhoto.click()]);
    await chooser.setFiles({ name: "broken.png", mimeType: "image/png", buffer: Buffer.from("not a photo") });
    await page.getByRole("alert").filter({ hasText: "Cannot read this photo." }).waitFor();
    assert.equal(await downloadButton.isDisabled(), true);
    // Generate a real raster fixture with known quadrant colors, no files or network.
    const fixture = await page.evaluate(() => {
      const canvas = document.createElement("canvas"); canvas.width = 200; canvas.height = 200;
      const ctx = canvas.getContext("2d");
      for (const [x, y, color] of [[0, 0, "#ff0000"], [100, 0, "#00ff00"], [0, 100, "#0000ff"], [100, 100, "#ffff00"]]) {
        ctx.fillStyle = color; ctx.fillRect(x, y, 100, 100);
      }
      return canvas.toDataURL().split(",")[1];
    });
    await photo.setInputFiles({ name: "quadrants.png", mimeType: "image/png", buffer: Buffer.from(fixture, "base64") });
    await page.waitForFunction(() => !document.querySelector('#player-card-zoom').disabled);
    const canvas = page.getByRole("img", { name: "Card preview", exact: true });
    const sample = () => canvas.evaluate(el => [...el.getContext("2d").getImageData(400, 200, 1, 1).data]);
    assert.deepEqual(await sample(), [255, 0, 0, 255], "Photo paints immediately after decode");
    const emptyName = await canvas.evaluate(el => el.toDataURL());
    assert.deepEqual(fontRequests, [], "Empty nickname does not load the font");
    const slider = page.getByRole("slider");
    await slider.scrollIntoViewIfNeeded();
    await slider.tap();
    assert.ok(Number(await slider.inputValue()) > 1, "Native slider responds to touch");
    await slider.focus(); await slider.press("Home"); await slider.press("ArrowRight");
    assert.equal(Number(await slider.inputValue()), 1.01, "Slider supports keyboard");
    await slider.press("End");
    await canvas.scrollIntoViewIfNeeded();
    const rect = await canvas.boundingBox();
    const cdp = await context.newCDPSession(page);
    await canvas.evaluate(el => {
      el.addEventListener("gotpointercapture", event => { el.dataset.captured = String(event.pointerType === "touch" && el.hasPointerCapture(event.pointerId)); }, { once: true });
    });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: rect.x + rect.width * 0.8, y: rect.y + rect.height * 0.4 }] });
    for (let i = 1; i <= 5; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: rect.x + rect.width * (0.8 - i * 0.1), y: rect.y + rect.height * 0.4 }] });
    assert.equal(await canvas.getAttribute("data-captured"), "true", "Touch drag captures its pointer");
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForFunction(() => document.querySelector('canvas[role="img"]').getContext("2d").getImageData(400, 200, 1, 1).data[1] === 255);
    assert.deepEqual(await sample(), [0, 255, 0, 255], "Touch drag moves the photo in output coordinates");
    const beforeName = await canvas.evaluate(el => el.toDataURL());
    await page.locator('#player-card-name').fill("小明/Blue");
    await fontRequested.promise;
    assert.equal(await downloadButton.isDisabled(), true, "Pending font blocks export");
    assert.equal(await canvas.evaluate(el => el.toDataURL()), beforeName, "No fallback nickname painted while the font is pending");
    await page.locator('#player-card-name').fill("");
    assert.equal(await downloadButton.isDisabled(), false, "Clearing the nickname allows immediate export even while font is pending");
    const [emptyDownload] = await Promise.all([page.waitForEvent("download"), downloadButton.click()]);
    assert.equal(emptyDownload.suggestedFilename(), "player-card.png");
    assert.deepEqual(await readFile(await emptyDownload.path()), Buffer.from(beforeName.split(",")[1], "base64"));
    await page.locator('#player-card-name').fill("小明/Blue");
    assert.equal(await downloadButton.isDisabled(), true);
    fontRelease.resolve();
    await page.waitForFunction(() => [...document.fonts].some(face => face.family.includes("Player Card Zhi Mang Xing") && face.weight === "400" && face.status === "loaded"));
    await page.waitForFunction(() => ![...document.querySelectorAll("button")].find(button => button.textContent === "Download PNG · 1080 × 1080").disabled);
    assert.notEqual(await canvas.evaluate(el => el.toDataURL()), beforeName, "Entered name is painted");
    const preview = await canvas.evaluate(el => el.toDataURL());
    const [download] = await Promise.all([page.waitForEvent("download"), downloadButton.click()]);
    assert.equal(download.suggestedFilename(), "小明-Blue-card.png");
    const bytes = await readFile(await download.path());
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(bytes.toString("ascii", 12, 16), "IHDR");
    assert.equal(bytes.readUInt32BE(16), 1080); assert.equal(bytes.readUInt32BE(20), 1080);
    assert.deepEqual(bytes, Buffer.from(preview.split(",")[1], "base64"), "Download is exactly the preview canvas");
    const pixel = await page.evaluate(async base64 => {
      const img = new Image(); img.src = `data:image/png;base64,${base64}`; await img.decode();
      const c = document.createElement("canvas"); c.width = 1080; c.height = 1080;
      c.getContext("2d").drawImage(img, 0, 0);
      return [...c.getContext("2d").getImageData(400, 200, 1, 1).data];
    }, bytes.toString("base64"));
    assert.deepEqual(pixel, [0, 255, 0, 255], "Decoded download contains the cropped photo");
    await page.getByRole("button", { name: "Reset position and zoom" }).click();
    await page.locator('#player-card-name').fill("");
    assert.equal(await canvas.evaluate(el => el.toDataURL()), emptyName, "Reset and empty name restore the photo with no placeholder text");
    const [fallback] = await Promise.all([page.waitForEvent("download"), downloadButton.click()]);
    assert.equal(fallback.suggestedFilename(), "player-card.png");
    const nicknameBounds = () => canvas.evaluate(el => {
      const { width, height } = el;
      const data = el.getContext("2d").getImageData(0, height * 0.55, width, height * 0.45).data;
      let left = width, right = -1, top = height, bottom = -1;
      let leftRows = 0, rightRows = 0, leftCount = 0, rightCount = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] <= 240 || data[i + 1] <= 240 || data[i + 2] <= 240) continue;
        const x = (i / 4) % width;
        const y = Math.floor(i / 4 / width) + height * 0.55;
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
        if (x < width * 0.4) { leftRows += y; leftCount++; }
        if (x > width * 0.6) { rightRows += y; rightCount++; }
      }
      return { left, right, top, bottom, inkWidth: right - left + 1, inkHeight: bottom - top + 1, rise: leftRows / leftCount - rightRows / rightCount };
    });
    await page.locator('#player-card-name').fill("林知夏");
    const shortBounds = await nicknameBounds();
    // Keep a prominent short name without requiring a particular font's ink width.
    assert.ok(shortBounds.inkWidth / 1080 >= 0.50 && shortBounds.inkWidth / 1080 <= 0.69,
      `Short calligraphy spans at least half the card: ${JSON.stringify(shortBounds)}`);
    for (const [name, minHeight] of [["林知夏", 125], ["清风速拧", 125], ["RiverBlue", 80], ["Ágj", 80], ["很长的选手显示名称".repeat(8), 1], ["髙㐀𝓡🧊Á", 80]]) {
      await page.locator('#player-card-name').fill(name);
      const bounds = await nicknameBounds();
      assert.ok(bounds.inkHeight >= minHeight, `Nickname ink has the intended size: ${name}`);
      assert.ok(bounds.left >= 60 && bounds.right <= 1020 && bounds.top >= 740 && bounds.bottom <= 1045,
        `Nickname ink fits the lower part of the card: ${JSON.stringify(bounds)}`);
    }
    await page.locator('#player-card-name').fill("风风风风");
    assert.ok((await nicknameBounds()).rise > 30, "Repeated glyphs visibly rise across the signature");
    await page.locator('#player-card-name').fill("");
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow at ${width}px`);
      assert.equal(await canvas.evaluate(el => el.toDataURL()), emptyName, "Viewport does not change output");
    }
    assert.deepEqual(fontRequests, [`${origin}/fonts/player-card/zhi-mang-xing.woff2`], "One shared static same-origin font request with no nickname data");
    // A fresh document exercises a real font load failure and local fallback export.
    failFont = true;
    await page.reload();
    await photo.setInputFiles({ name: "quadrants.png", mimeType: "image/png", buffer: Buffer.from(fixture, "base64") });
    await page.locator('#player-card-name').fill("小明/Blue");
    await page.waitForFunction(() => ![...document.querySelectorAll("button")].find(button => button.textContent === "Download PNG · 1080 × 1080").disabled);
    assert.equal(fontRequests.length, 2);
    assert.equal(await page.evaluate(() => [...document.fonts].some(face => face.family.includes("Player Card Zhi Mang Xing"))), false);
    const fallbackBounds = await nicknameBounds();
    assert.ok(fallbackBounds.inkHeight >= 80 && fallbackBounds.left >= 60 && fallbackBounds.right <= 1020 && fallbackBounds.top >= 740 && fallbackBounds.bottom <= 1045, "Fallback inks also fit");
    const fallbackPreview = await canvas.evaluate(el => el.toDataURL());
    const [fallbackDownload] = await Promise.all([page.waitForEvent("download"), downloadButton.click()]);
    assert.equal(fallbackDownload.suggestedFilename(), "小明-Blue-card.png");
    assert.deepEqual(await readFile(await fallbackDownload.path()), Buffer.from(fallbackPreview.split(",")[1], "base64"), "Failed font still exports the exact fallback preview");
    assert.deepEqual(uploads, [], "No photo or other data uploaded");
    assert.deepEqual(external, [], "No external image/font/provider requests");
    assert.deepEqual(errors, []);
    await context.close();
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
