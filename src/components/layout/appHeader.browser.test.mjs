import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = process.env.APP_HEADER_URL || 'http://127.0.0.1:3129';
const browser = await chromium.launch({ headless: true });
const expected = [
  'menu:app-header-nav-group-competitions:trigger',
  'menu:app-header-nav-wca:trigger',
  'menu:app-header-nav-tools:trigger',
  'menu:app-header-nav-more:trigger',
  'menu:app-header-language:trigger',
  'menu:app-header-appearance:trigger',
  'dialog:app-header-mobile-nav:trigger',
];

try {
  for (const { width, theme, locale } of [
    { width: 1440, theme: 'light', locale: 'zh-CN' },
    { width: 390, theme: 'dark', locale: 'en-US' },
  ]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addInitScript(({ theme, locale }) => {
      localStorage.setItem('cubing-pro-theme', theme);
      localStorage.setItem('cubing_pro_locale', locale);
      // Exercise local restoration without spending time on solver search.
      localStorage.setItem('cubing.pro.two-solver.settings.v1', JSON.stringify({
        methods: [], colors: ['U'], maxDepth: 0, moveSet: 'ruf',
      }));
      localStorage.setItem('cubing.pro.two-solver.ui.v1', JSON.stringify({ version: 1, scramble: 'R U2 F' }));
    }, { theme, locale });
    const page = await context.newPage();
    const errors = [];
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', error => errors.push(error.message));

    for (const path of ['/tools/solver/222/', '/settings/']) {
      for (let visit = 0; visit < 2; visit++) {
        const response = visit === 0
          ? await page.goto(new URL(path, origin).href, { waitUntil: 'networkidle' })
          : await page.reload({ waitUntil: 'networkidle' });
        assert.ok(response.ok());
        const html = await response.text();
        const ids = await page.evaluate(html => {
          const attributes = document => [...document.querySelectorAll('[data-app-header] [data-part="trigger"]')]
            .map(node => ({ id: node.id, uid: node.getAttribute('data-uid'),
              controls: node.getAttribute('data-controls'), owner: node.getAttribute('data-ownedby') }));
          return { server: attributes(new DOMParser().parseFromString(html, 'text/html')), client: attributes(document) };
        }, html);
        assert.deepEqual(ids.server.map(node => node.id), expected);
        assert.deepEqual(ids.client, ids.server, 'SSR and hydrated ID relationships must match');
        assert.equal(await page.evaluate(ids => ids.every(id => document.querySelectorAll(`[id="${id}"]`).length === 1), expected), true);
        assert.deepEqual(errors, []);
      }
    }

    const triggers = width >= 1280 ? expected.slice(0, 6) : expected.slice(4);
    for (const id of triggers) {
      const trigger = page.locator(`[id="${id}"]`);
      await trigger.click();
      await page.waitForFunction(id => document.getElementById(id)?.getAttribute('aria-expanded') === 'true', id);
      const controls = await trigger.getAttribute('aria-controls') || await trigger.getAttribute('data-controls');
      if (controls) await page.locator(`[id="${controls}"]`).waitFor({ state: 'visible' });
      else await page.locator('[data-scope="dialog"][data-part="content"]').waitFor({ state: 'visible' });
      await page.mouse.move(0, 899);
      await page.locator('[data-part="content"][data-state="open"]').last().focus();
      await page.keyboard.press('Escape');
      await page.waitForFunction(id => document.getElementById(id)?.getAttribute('aria-expanded') === 'false', id);
    }
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px ${theme} ${locale}: SSR IDs, reloads, unique IDs and ${triggers.length} interactive controls`);
    await context.close();
  }
} finally {
  await browser.close();
}
