import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Run against a Next dev/start server: ALGS_TEST_URL=http://127.0.0.1:3000 npm run test:algs:layout
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
try {
  await page.addInitScript(() => {
    if (localStorage.getItem('algs-layout-seeded')) return;
    const cases = Array.from({ length: 19 }, (_, i) => ({
      name: i % 3 ? `Case ${i + 1}` : `Long subcase name ${i + 1} with detailed label`,
      algs: Array.from({ length: 1 + i % 4 }, (_, j) => j === 0 ? Array.from({ length: i % 5 === 0 ? 28 : 3 }, () => "R U R' U'").join(' ') : "F R U R' U' F'"),
      scrambles: ["R U R' U'"],
      image: `<svg xmlns="http://www.w3.org/2000/svg" width="${i % 2 ? 90 : 180}" height="90"><rect width="90" height="90" fill="#22a8cb"/></svg>`,
    }));
    const data = { name: 'PLL Formula Workbench', sets: [{ name: 'Main', groups: [
      { name: 'Group A', algs: cases.slice(0, 11) }, { name: 'Group B', algs: cases.slice(11, 18) }, { name: 'Group C', algs: cases.slice(18) },
    ] }] };
    localStorage.setItem('alg_class_cache_333_PLL', JSON.stringify({ data, ts: Date.now() }));
    localStorage.setItem('algs_use_visualcube_renderer', '0');
    localStorage.setItem('algs_columns_per_row_by_repo', JSON.stringify({ '333::PLL': 8 }));
    localStorage.setItem('algs_formula_font_size', '18');
    localStorage.setItem('algs-layout-seeded', '1');
  });
  await page.goto(`${process.env.ALGS_TEST_URL ?? 'http://127.0.0.1:3000'}/algs/333/PLL/`, { waitUntil: 'domcontentloaded' });
  await page.locator('.algs-formula-card').first().waitFor({ timeout: 60000 });

  async function measure() {
    return page.evaluate(() => {
      const rect = (el) => { const box = el.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right }; };
      const grids = [...document.querySelectorAll('.algs-case-grid')].map((grid) => ({
        ...rect(grid), gap: parseFloat(getComputedStyle(grid).gap), columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
        cards: [...grid.querySelectorAll('.algs-formula-card')].map(rect),
      }));
      const heading = document.querySelector('.algs-detail-group-heading');
      return {
        grids, overflow: document.documentElement.scrollWidth > innerWidth + 1,
        workbench: getComputedStyle(document.querySelector('.algs-detail-workbench')).gridTemplateColumns,
        panelLayout: getComputedStyle(document.querySelector('.algs-detail-panels')).gridTemplateColumns,
        toolsRect: rect(document.querySelector('.algs-detail-tools')),
        navRect: rect(document.querySelector('.algs-detail-navigation')),
        resizer: document.querySelector('.algs-detail-resizer'),
        resizerRect: rect(document.querySelector('.algs-detail-resizer')),
        shell: rect(document.querySelector('.algs-detail-shell')),
        center: rect(document.querySelector('.algs-detail-content')),
        nav: getComputedStyle(document.querySelector('.algs-detail-navigation')).display,
        tools: getComputedStyle(document.querySelector('.algs-detail-tools')).display,
        heading: [...heading.children].map(rect),
        formulaSize: getComputedStyle(document.querySelector('.algs-formula-card-formula')).fontSize,
        titleSize: getComputedStyle(document.querySelector('.algs-formula-card-title')).fontSize,
      };
    });
  }
  for (const width of [320, 390, 600, 768, 1024, 1280, 1440, 1720, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    const m = await measure();
    assert.equal(m.overflow, false, `page overflow at ${width}`);
    assert.equal(m.formulaSize, '18px', 'formula font setting must remain unchanged');
    assert.ok(parseFloat(m.titleSize) <= 12);
    if (width >= 880) assert.ok(m.toolsRect.y < m.navRect.y, 'tools must be on the top row');
    const first = m.grids[0].cards[0];
    for (const grid of m.grids) {
      assert.equal(grid.gap, 8);
      for (const card of grid.cards) {
        assert.ok(Math.abs(card.width - first.width) < 1, `unequal card width at ${width}`);
        assert.ok(Math.abs(card.height - first.height) < 1, `unequal card height at ${width}`);
      }
      const row = grid.cards.filter((card) => Math.abs(card.y - grid.cards[0].y) < 1);
      if (row.length === grid.columns) assert.ok(Math.abs(row.at(-1).right - grid.right) < 1, `row does not fill at ${width}`);
      for (let i = 1; i < row.length; i++) assert.ok(Math.abs(row[i].x - row[i - 1].right - 8) < 1);
    }
    const centers = m.heading.map((item) => item.y + item.height / 2);
    assert.ok(Math.max(...centers) - Math.min(...centers) < 1, 'tag and heading center lines differ');
    assert.equal(m.tools, 'block');
    if (m.shell.width >= 880) {
      assert.ok(m.center.width >= 480, `center squeezed at ${width}`);
      assert.ok(m.navRect.width >= 280, `left panel is too narrow at ${width}`);
      assert.ok(Math.abs(m.resizerRect.x - m.navRect.right) < 1, 'divider must separate the two panels');
    } else assert.equal(m.resizerRect.width, 0);
    console.log(`PASS ${width}px: ${m.workbench}; ${m.grids[0].columns} columns, cards ${first.width.toFixed(1)} x ${first.height.toFixed(1)}, 8px gaps`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  const toolRow = page.locator('.algs-detail-tools');
  assert.equal(await toolRow.locator('.algs-practice-tools-grid').evaluate((el) => getComputedStyle(el).gridAutoFlow), 'column');
  await toolRow.getByRole('button', { name: /公式练习/ }).first().click();
  await page.locator('.fp-dialog').waitFor();
  const close = page.locator('.fp-close');
  assert.equal(await close.innerText(), '');
  assert.equal(await close.getAttribute('aria-label'), '关闭练习器');
  await close.click();
  await page.locator('.fp-dialog').waitFor({ state: 'hidden' });

  await page.setViewportSize({ width: 1440, height: 900 });
  const separator = page.getByRole('separator', { name: '调整筛选与公式区域宽度' });
  const paneBefore = await page.locator('.algs-detail-navigation').boundingBox();
  const dividerBefore = await separator.boundingBox();
  await page.mouse.move(dividerBefore.x + dividerBefore.width / 2, 420);
  await page.mouse.down();
  await page.mouse.move(dividerBefore.x + 64, 420, { steps: 8 });
  await page.mouse.up();
  const paneAfter = await page.locator('.algs-detail-navigation').boundingBox();
  assert.ok(paneAfter.width >= paneBefore.width + 56, `drag should widen the navigation panel (${paneBefore.width} -> ${paneAfter.width}, aria=${await separator.getAttribute('aria-valuenow')})`);
  assert.equal(await separator.getAttribute('aria-valuenow'), String(Math.round(paneAfter.width)));
  await page.waitForFunction((width) => Math.abs(Number(localStorage.getItem('algs_filter_panel_width')) - width) < 1, paneAfter.width);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.algs-formula-card').first().waitFor();
  assert.ok((await page.locator('.algs-detail-navigation').boundingBox()).width >= paneBefore.width + 56, 'resized panel width should persist');
  await separator.focus();
  const keyboardWidth = Number(await separator.getAttribute('aria-valuenow'));
  await page.keyboard.press('ArrowRight');
  assert.equal(Number(await separator.getAttribute('aria-valuenow')), keyboardWidth + 16, 'divider should support keyboard resizing');

  await page.getByRole('searchbox').fill('Case 2');
  await page.waitForFunction(() => document.querySelectorAll('.algs-formula-card').length === 1);
  const searched = await measure();
  assert.ok(searched.grids[0].cards[0].width < searched.grids[0].width, 'a partial row keeps the common card width instead of stretching one card');
  await page.getByRole('searchbox').fill('');

  for (const columns of [2, 4, 8]) {
    await page.evaluate((columns) => {
      localStorage.setItem('algs_columns_per_row_by_repo', JSON.stringify({ '333::PLL': columns }));
      localStorage.setItem('algs_formula_font_size', '32');
      localStorage.setItem('algs_diagram_max_size', '280');
    }, columns);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.algs-formula-card').first().waitFor();
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(150);
      const m = await measure();
      const sizes = m.grids.flatMap((grid) => grid.cards);
      assert.equal(m.overflow, false);
      assert.equal(m.formulaSize, '32px');
      assert.ok(m.grids.every((grid) => grid.columns <= columns));
      assert.ok(sizes.every((card) => Math.abs(card.height - sizes[0].height) < 1));
      assert.ok(sizes.every((card) => Math.abs(card.width - sizes[0].width) < 1));
    }
  }

  for (const hidden of [false, true]) {
    await page.evaluate((hidden) => {
      localStorage.setItem('algs_columns_per_row_by_repo', JSON.stringify({ '333::PLL': 1 }));
      localStorage.setItem('algs_hide_formula_diagram', hidden ? '1' : '0');
    }, hidden);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.algs-formula-card--wide').first().waitFor();
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(150);
      const m = await measure();
      const sizes = m.grids.flatMap((grid) => grid.cards);
      assert.equal(m.overflow, false);
      assert.ok(sizes.every((card) => Math.abs(card.height - sizes[0].height) < 1), 'wide cards must have identical height');
      assert.ok(sizes.every((card) => Math.abs(card.width - sizes[0].width) < 1), 'wide cards must have identical width');
    }
    await page.locator('.algs-formula-wide-preview').first().click();
    await page.locator('.algs-formula-detail-modal').waitFor();
    await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors, []);
  console.log('PASS top tools row, pointer and keyboard resizing, persisted panel width, preserved formula font, single-result search, wide/no-image uniform sizes, details entry and no runtime errors');
} finally {
  await browser.close();
}
