import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

test('Data tables, icon tooltips, chart and copied results switch through seven locales', async () => {
  const bundle = await build({
    stdin: {
      resolveDir: root, loader: 'tsx', contents: `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { I18nProvider } from './src/contexts/I18nProvider';
        import { ResultsTable } from './src/components/Data/cube_result/result_tables';
        import { RecordsTable } from './src/components/Data/cube_record/record_tables';
        import { CompsTable } from './src/components/Data/cube_comps/comps_tables';
        import { ResultGraphChart } from './src/components/Data/cube_result/result_chat';
        import { resultToBest } from './src/components/Data/types/result';
        import { CubesCn } from './src/components/CubeIcon/cube';
        import { translateDomain, formatRoundName } from './src/i18n/messages/domain';
        import { SUPPORTED_LOCALES } from './src/i18n/locales';
        import { translate } from './src/i18n';
        import { getInstanceByDom } from 'echarts';
        const result = { id: 1, Index: 1, EventID: '333', EventRoute: 7, Round: '决赛', RoundNumber: 1, Best: 12.34, Average: -10000, Result: [12, 13, 14, 15, 16], Rank: 0, CompetitionName: 'Fixture', CompetitionID: 1, PersonName: 'Player', CubeID: 'id1' };
        const record = { id: 1, EventId: '333', EventRoute: 7, Best: 12.34, Average: 14, Type: 'NR' };
        const comp = { id: 1, EventMin: '333;skewb;', Status: 'Temporary', Genre: 2, CompStartTime: '2026-01-01T00:00:00Z', CompEndTime: '2026-01-02T00:00:00Z' };
        createRoot(document.getElementById('root')).render(<I18nProvider>
          <section id="results">{ResultsTable([result], ['EventName', 'Round', 'CubeID', 'Best', 'Average', 'Result'], [])}</section>
          <section id="records">{RecordsTable([record], ['EventId', 'Best', 'Average'])}</section>
          <section id="comps">{CompsTable([comp], ['EventMin', 'Genre', 'Status'])}</section>
          <section id="chart">{ResultGraphChart('333', [result])}</section>
        </I18nProvider>);
        window.domainTest = {
          locales: SUPPORTED_LOCALES.map(x => x.key),
          copy: () => resultToBest(result),
          expected: locale => ({ event: CubesCn('333', locale), round: formatRoundName('f', locale), single: translateDomain(locale, 'domain.data.single'), cubeId: translateDomain(locale, 'domain.data.cubeId'), best: translate(locale, 'competitionAdmin.best'), average: translate(locale, 'competitionAdmin.average'), eventHeader: translate(locale, 'competitionAdmin.event'), draft: translate(locale, 'competitionAdmin.draft') }),
          chart: () => getInstanceByDom(document.querySelector('#chart .echarts-for-react'))?.getOption(),
          tooltip: () => {
            const option = getInstanceByDom(document.querySelector('#chart .echarts-for-react'))?.getOption();
            return option?.tooltip[0].formatter([{dataIndex: 0}]);
          },
        };
      `,
    },
    bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic',
    loader: { '.css': 'empty', '.woff': 'empty', '.woff2': 'empty', '.ttf': 'empty' },
    define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' }, logLevel: 'silent',
  });
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      const page = await context.newPage();
      page.on('pageerror', error => { errors.push(error.message); console.error(error.stack); });
      await page.route('http://domain.test/**', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body><div id="root"></div></body></html>' }));
      await page.goto('http://domain.test/');
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.waitForFunction(() => document.querySelector('#results table') || document.getElementById('root')?.textContent, undefined, { timeout: 10000 });
      assert.deepEqual(errors, []);
      await page.waitForFunction(() => window.domainTest?.chart()?.series.length === 2);
      for (const locale of await page.evaluate(() => window.domainTest.locales)) {
        const expected = await page.evaluate(value => {
          localStorage.setItem('cubing_pro_locale', value);
          window.dispatchEvent(new StorageEvent('storage', { key: 'cubing_pro_locale', newValue: value }));
          return window.domainTest.expected(value);
        }, locale);
        await page.waitForFunction(value => document.documentElement.lang === value, locale);
        await page.waitForFunction(label => window.domainTest.chart()?.series[0].name === label, expected.best);
        assert.ok((await page.locator('#results').innerText()).includes(expected.round), `${locale} round ${width}px`);
        assert.ok((await page.locator('#results').innerText()).includes(expected.event));
        assert.ok((await page.locator('#results thead').innerText()).includes(expected.cubeId));
        assert.ok((await page.locator('#records thead').innerText()).includes(expected.eventHeader));
        assert.ok((await page.locator('#comps').innerText()).includes(expected.draft));
        for (const selector of ['#results i', '#records i', '#comps i']) {
          assert.equal(await page.locator(selector).first().getAttribute('title'), expected.event);
        }
        assert.equal(await page.evaluate(() => window.domainTest.copy()), `12.34[${expected.single}]`);
        const tooltip = await page.evaluate(() => window.domainTest.tooltip());
        assert.ok(tooltip.includes(expected.round), `${locale}: expected ${expected.round} in ${tooltip}`);
        assert.ok(tooltip.includes(`${expected.best}: 12.34`));
        assert.ok(tooltip.includes(`${expected.average}: DNF`));
        assert.deepEqual(await page.evaluate(() => window.domainTest.chart().series.map(item => item.data.map(point => point.value))), [[12.34], [null]]);
      }
      await context.close();
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
