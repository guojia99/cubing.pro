import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.FOOD_DRAW_BASE_URL ?? "http://127.0.0.1:3000";
const output = process.env.FOOD_DRAW_ARTIFACTS ?? "/var/folders/p8/b3ryxj6s1bd4wgsspxzhfnw40000gn/T/opencode/food-draw-visual";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
const interactions = [];
const errors = [];

async function settle(page, selector) {
  await page.locator(selector).first().waitFor({ timeout: 90000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
}

async function dimensions(page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const overflowing = [...document.querySelectorAll("main *")].filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && style.position !== "fixed" && (rect.right > width + 2 || rect.left < -2);
    }).slice(0, 12).map((element) => ({
      tag: element.tagName, text: element.textContent?.trim().slice(0, 60),
      className: element.getAttribute("class"),
      right: Math.round(element.getBoundingClientRect().right),
      left: Math.round(element.getBoundingClientRect().left),
    }));
    return {
      viewport: width, scrollWidth: document.documentElement.scrollWidth,
      theme: document.documentElement.className,
      heading: document.querySelector("main h1")?.textContent,
      radius: getComputedStyle(document.documentElement).getPropertyValue("--radius-card").trim(),
      overflowing,
    };
  });
}

try {
  const request = await browser.newContext();
  const recipesResponse = await request.request.get(`${baseURL}/recipes.json`);
  assert.equal(recipesResponse.status(), 200);
  const { recipes } = await recipesResponse.json();
  const recipe = recipes.find((item) => item.hasImage && item.coverImage);
  const tipsResponse = await request.request.get(`${baseURL}/tips.json`);
  assert.equal(tipsResponse.status(), 200);
  const { tips } = await tipsResponse.json();
  const cocktailsResponse = await request.request.get(`${baseURL}/iba/cocktails.json`);
  assert.equal(cocktailsResponse.status(), 200);
  const cocktails = await cocktailsResponse.json();
  const cocktail = cocktails.find((item) => item.image_path);
  const routes = [
    { name: "recipes-list", path: "/other/recipes", ready: ".food-card" },
    { name: "recipes-detail", path: `/other/recipes/${encodeURIComponent(recipe.category)}/${encodeURIComponent(recipe.id)}`, ready: ".markdown-detail-content h1" },
    { name: "kitchen-list", path: "/other/kitchen-skills", ready: ".food-card" },
    { name: "kitchen-detail", path: `/other/kitchen-skills/${encodeURIComponent(tips[0].category)}/${encodeURIComponent(tips[0].id)}`, ready: ".markdown-detail-content h1" },
    { name: "cocktails-list", path: "/other/cocktails", ready: ".food-card" },
    { name: "cocktails-detail", path: `/other/cocktails/${encodeURIComponent(cocktail.slug)}`, ready: ".cocktail-detail-grid" },
    ...["sq1", "minx", "sk", "py", "fto"].map((name) => ({ name: `draw-${name}`, path: `/draw-tools/${name}-d`, ready: ".draw-palette-canvas [data-key]" })),
  ];
  await request.close();

  for (const theme of process.env.FOOD_DRAW_INTERACTIONS_ONLY ? [] : ["light", "dark"]) {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme, reducedMotion: "reduce" });
      await context.addInitScript((value) => {
        localStorage.setItem("cubing-pro-theme", value);
        localStorage.setItem("cubing-pro-cocktails-safety-ack-v1", "1");
      }, theme);
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push({ width, theme, url: page.url(), message: error.message }));
      for (const route of routes) {
        const entry = { name: route.name, width, theme, path: route.path };
        try {
          const response = await page.goto(`${baseURL}${route.path}`, { waitUntil: "domcontentloaded", timeout: 90000 });
          entry.status = response?.status();
          assert.equal(entry.status, 200);
          await settle(page, route.ready);
          await page.locator("main img").evaluateAll(async (images) => {
            await Promise.all(images.map((image) => {
              image.loading = "eager";
              if (image.complete) return;
              return new Promise((resolve) => {
                image.addEventListener("load", resolve, { once: true });
                image.addEventListener("error", resolve, { once: true });
                setTimeout(resolve, 12000);
              });
            }));
          });
          entry.layout = await dimensions(page);
          assert.ok(entry.layout.theme.split(" ").includes(theme), "Requested theme must be active");
          entry.images = await page.locator("main img").evaluateAll((images) => images.map((image) => ({ src: image.getAttribute("src"), loaded: image.complete && image.naturalWidth > 0 })));
          entry.screenshot = `${output}/${route.name}-${width}-${theme}.png`;
          await page.screenshot({ path: entry.screenshot, fullPage: true, animations: "disabled" });
          entry.pass = entry.layout.scrollWidth <= width + 2 && entry.layout.overflowing.length === 0 && entry.images.every((image) => image.loaded);
        } catch (error) {
          entry.pass = false;
          entry.error = error.message;
          await page.screenshot({ path: `${output}/${route.name}-${width}-${theme}-failure.png`, fullPage: true }).catch(() => {});
        }
        results.push(entry);
        console.log(JSON.stringify({ name: route.name, width, theme, pass: entry.pass, status: entry.status, overflow: entry.layout?.overflowing, error: entry.error }));
      }
      await context.close();
    }
  }

  for (const theme of process.env.FOOD_DRAW_MATRIX_ONLY ? [] : ["light", "dark"]) {
  for (const width of [390, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, acceptDownloads: true, colorScheme: theme, reducedMotion: "reduce" });
  await context.addInitScript((value) => { localStorage.setItem("cubing-pro-cocktails-safety-ack-v1", "1"); localStorage.setItem("cubing-pro-theme", value); }, theme);
  const page = await context.newPage();
  for (const [name, path, tonightLabel, listKey, favoriteKey] of [
    ["recipes", "/other/recipes", "今晚吃啥", "cubing-pro-recipes-tonight-list", "cubing-pro-recipes-favorites"],
    ["cocktails", "/other/cocktails", "今晚喝什么", "cubing-pro-cocktails-tonight-list", "cubing-pro-cocktails-favorites"],
  ]) {
    await page.goto(`${baseURL}${path}`);
    await settle(page, ".food-card");
    const card = page.locator(".food-card").first();
    const title = await card.locator("h3").innerText();
    await card.getByRole("button", { name: "收藏", exact: true }).click();
    await card.getByRole("button", { name: `添加到${tonightLabel}`, exact: true }).click();
    const stored = await page.evaluate(([list, favorite]) => ({ list: JSON.parse(localStorage.getItem(list) ?? "[]"), favorites: JSON.parse(localStorage.getItem(favorite) ?? "[]") }), [listKey, favoriteKey]);
    assert.equal(stored.list.length, 1);
    assert.equal(stored.favorites.length, 1);
    await page.reload();
    await settle(page, ".food-card");
    await page.getByRole("radiogroup", { name: name === "recipes" ? "菜谱清单" : "酒款清单" }).getByText("我喜欢的", { exact: false }).click();
    await page.waitForTimeout(250);
    assert.equal(await page.locator(".food-card").count(), 1);
    await page.getByRole("radiogroup").first().getByText(tonightLabel, { exact: false }).click();
    await settle(page, ".tonight-receipt");
    assert.equal(await page.locator(".food-card").count(), 1);
    const ingredient = page.locator(".tonight-receipt input[type=checkbox]").first();
    if (await ingredient.count()) { await page.locator(".tonight-receipt [data-part=label]").first().click(); assert.equal(await ingredient.isChecked(), true); await page.reload(); await settle(page, ".food-card"); await page.getByRole("radiogroup").first().getByText(tonightLabel, { exact: false }).click(); await settle(page, ".tonight-receipt"); assert.equal(await page.locator(".tonight-receipt input[type=checkbox]").first().isChecked(), true); }
    await page.screenshot({ path: `${output}/${name}-tonight-${width}-${theme}.png`, fullPage: true });
    const layout = await dimensions(page);
    assert.ok(layout.scrollWidth <= width + 2 && layout.overflowing.length === 0);
    const receiptTheme = await page.locator(".tonight-receipt").evaluate((element) => ({ forcedLight: !!element.closest(".light"), background: getComputedStyle(element).backgroundColor }));
    if (theme === "dark") assert.equal(receiptTheme.forcedLight, false, "Receipt must follow dark mode");
    interactions.push({ name, width, theme, title, favoritesPersist: true, tonightPersist: true, ingredientPersist: true, receiptTheme, layout });
    console.log(`PASS interactions: ${name} ${width} ${theme}`);
  }
  for (const name of ["sq1", "minx", "sk", "py", "fto"]) {
    await page.goto(`${baseURL}/draw-tools/${name}-d`);
    await settle(page, ".draw-palette-canvas [data-key]");
    const color = page.getByRole("button", { name: /^#/ }).first();
    const selected = await color.getAttribute("aria-label");
    await color.click();
    await page.locator(".draw-palette-canvas").scrollIntoViewIfNeeded();
    const hit = await page.locator(".draw-palette-canvas").evaluate((svg) => {
      const rect = svg.getBoundingClientRect();
      for (let y = rect.top + 8; y < rect.bottom - 8; y += 8) {
        for (let x = rect.left + 8; x < rect.right - 8; x += 8) {
          const element = document.elementFromPoint(x, y)?.closest("[data-key]");
          const key = element?.getAttribute("data-key");
          if (key && !key.includes("disable") && !key.includes("fonts") && !key.includes("line") && svg.contains(element)) return { x, y, key };
        }
      }
      return null;
    });
    assert.ok(hit, "A visible sticker must receive a real pointer click");
    const { key } = hit;
    const sticker = page.locator(`.draw-palette-canvas [data-key="${key}"]`);
    await page.mouse.click(hit.x, hit.y);
    assert.equal(await sticker.getAttribute("fill"), selected);
    await page.getByRole("textbox").fill(`verified-${name}`);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download SVG", exact: true }).click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), `verified-${name}.svg`);
    await download.saveAs(`${output}/verified-${name}-${width}-${theme}.svg`);
    const stream = await download.createReadStream();
    let svg = "";
    for await (const chunk of stream) svg += chunk.toString();
    assert.match(svg, /<svg/);
    assert.ok(svg.includes(`data-key="${key}"`));
    const exportedFill = await page.evaluate(({ svg, key }) => new DOMParser().parseFromString(svg, "image/svg+xml").querySelector(`[data-key="${key}"]`)?.getAttribute("fill"), { svg, key });
    assert.equal(exportedFill, selected);
    const tabs = page.getByRole("tab");
    for (let index = 1; index < await tabs.count(); index++) {
      const trigger = tabs.nth(index);
      const value = await trigger.getAttribute("data-value");
      await trigger.click();
      await page.waitForFunction((expected) => document.querySelector(`[role="tab"][data-value="${expected}"]`)?.getAttribute("aria-selected") === "true", value);
      await settle(page, ".draw-palette-canvas [data-key]");
      assert.equal(await page.locator(".draw-palette-canvas").count(), 1);
      const layout = await dimensions(page);
      assert.ok(layout.scrollWidth <= width + 2 && layout.overflowing.length === 0, `${name} tab ${index} must fit viewport`);
      await page.screenshot({ path: `${output}/draw-${name}-tab-${index}-${width}-${theme}.png`, fullPage: true });
    }
    interactions.push({ name: `draw-${name}`, width, theme, selected, key, svgFilename: download.suggestedFilename(), svgBytes: Buffer.byteLength(svg), exportedFill, singleMountedCanvas: true, tabsChecked: await tabs.count() });
    console.log(`PASS drawing and SVG export: ${name} ${width} ${theme}`);
  }
  await context.close();
  }
  }
} catch (error) {
  errors.push({ message: error.stack });
} finally {
  await browser.close();
  const report = { baseURL, timestamp: new Date().toISOString(), results, interactions, errors };
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ total: results.length, passed: results.filter((result) => result.pass).length, interactions: interactions.length, errors, output }));
  if (errors.length || results.some((result) => !result.pass) || (!process.env.FOOD_DRAW_MATRIX_ONLY && interactions.length !== 28)) process.exitCode = 1;
}
