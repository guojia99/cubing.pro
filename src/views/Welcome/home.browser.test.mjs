import assert from "node:assert/strict";
import { chromium } from "playwright";

const origin = process.env.HOME_TEST_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch();
let combinations = 0;
try {
  for (const width of [320, 390, 1440]) {
    for (const locale of ["zh-CN", "en-US"]) {
      for (const mode of ["light", "dark"]) {
        const context = await browser.newContext({ viewport: { width, height: 960 }, colorScheme: mode, reducedMotion: "reduce" });
        await context.addInitScript(({ locale, mode }) => {
          localStorage.setItem("cubing_pro_locale", locale);
          localStorage.setItem("cubing-pro-theme", mode);
        }, { locale, mode });
        await context.route("**/v3/cube-api/**", (route) => {
          const path = new URL(route.request().url()).pathname;
          const data = path.includes("otherLinks") ? { groups: [], links: [] } : [];
          return route.fulfill({ json: data });
        });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
          if (message.type() === "error" && /hydrat|didn't match|invalid.*nest/i.test(message.text())) errors.push(message.text());
        });
        const response = await page.goto(origin, { waitUntil: "domcontentloaded" });
        assert.equal(response.status(), 200);
        await page.waitForFunction(({ locale, mode }) => document.documentElement.lang === locale && document.documentElement.classList.contains(mode), { locale, mode });
        const title = page.locator(".welcome-hero h1");
        await assert.doesNotReject(() => title.waitFor());
        assert.match(await title.innerText(), locale === "zh-CN" ? /魔方公式、练习与赛事/ : /Cube algorithms, practice and competitions/);
        const github = page.locator('.welcome-hero a[href="https://github.com/guojia99/cubing.pro"]');
        assert.equal(await github.count(), 1);
        assert.equal(await github.innerText(), locale === "zh-CN" ? "GitHub 仓库" : "GitHub repository");
        assert.equal(await github.getAttribute("target"), "_blank");
        assert.equal(await github.getAttribute("rel"), "noopener noreferrer");
        assert.equal(await github.getAttribute("title"), locale === "zh-CN" ? "查看源码、反馈问题或参与贡献" : "Explore the source, report issues or contribute");
        const shortcuts = await page.locator(".welcome-shortcuts a").evaluateAll((links) => links.map((link) => link.getAttribute("href").replace(/\/$/, "")));
        assert.deepEqual(shortcuts.sort(), ["/algs", "/tools/floppy-reduction", "/tools/solver/222"].sort());
        const groups = page.locator(".welcome-directory-group");
        assert.equal(await groups.count(), 4);
        for (const group of await groups.all()) assert.equal(await group.locator(".welcome-directory-link").count(), 4);
        const size = await groups.evaluateAll((elements) => ({
          heights: elements.map((element) => element.getBoundingClientRect().height),
          rows: elements.flatMap((element) => [...element.querySelectorAll(".welcome-directory-link")].map((row) => row.getBoundingClientRect().height)),
          overflow: document.documentElement.scrollWidth - innerWidth,
        }));
        assert.ok(Math.max(...size.heights) - Math.min(...size.heights) <= 1, `Unequal directory heights: ${JSON.stringify(size)}`);
        assert.ok(Math.max(...size.rows) - Math.min(...size.rows) <= 1, `Unequal entry heights: ${JSON.stringify(size)}`);
        assert.ok(size.overflow <= 1, `Page overflow: ${size.overflow}px`);
        assert.equal(await page.locator('a[href^="/other/"]').count(), 0);
        for (const image of await page.locator(".welcome-group-image img, .welcome-hero-mark img").all()) {
          await image.evaluate((element) => element.decode());
          assert.ok(await image.evaluate((element) => element.naturalWidth > 0));
        }
        assert.equal(await page.locator('head link[rel="icon"]').getAttribute("href"), "/CubingProMiniIcon.png");
        assert.deepEqual(errors, []);
        console.log(`PASS home ${width}px ${locale} ${mode}: content, links, equal heights, images, hydration`);
        combinations += 1;
        await context.close();
      }
    }
  }
  console.log(`PASS ${combinations} homepage combinations`);
} finally {
  await browser.close();
}
