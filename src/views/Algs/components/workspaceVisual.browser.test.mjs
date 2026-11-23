import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Uses real views and interactions. Competition reads use a deterministic fixture;
// solver workers, FR analysis, timers and browser storage are never replaced.
const origin = process.env.WORKSPACE_TEST_URL ?? 'http://127.0.0.1:3000';
const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ locale: 'zh-CN', colorScheme: 'light' });
const page = await context.newPage();
const errors = [];
const artifacts = process.env.WORKSPACE_ARTIFACTS ?? '/var/folders/p8/b3ryxj6s1bd4wgsspxzhfnw40000gn/T/opencode/workspace-visual';
await mkdir(artifacts, { recursive: true });
const report = { checks: [], screenshots: [], errors, rejections: [], consoleErrors: [] };
page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
await page.exposeFunction('reportWorkspaceRejection', value => report.rejections.push(value));
let currentTheme = 'light';
let currentWidth = 390;
page.on('pageerror', (error) => errors.push({ url: page.url(), message: error.message, stack: error.stack }));
const event = { id: '333', name: '333', cn: '三阶', otherNames: '', class: 'WCA', isComp: true, icon: '', iconBase64: '', isWCA: true, base_route_typ: 7, scrambleValue: '333', autoScrambleKey: '333', puzzleId: '333' };
const schedule = { Round: '决赛', RoundNum: 1, Format: 'ao5', IsComp: true, Scrambles: [["R U R' U'", 'F2 U2 R2', "L U2 L'", "R2 F2 U'", "F U F'"]], ScrambleNums: 5 };
const competition = { id: 987654, Name: '工作台视觉回归赛', Genre: 5, GroupId: 1, City: '线上', EventMin: '333', Count: 100, RegisterNum: 10, CompedNum: 8, Org: {}, Group: {}, OrganizersID: 0, EarliestID: 0, LatestID: 0, IsDone: false, CompStartTime: '2026-11-01T00:00:00+08:00', CompEndTime: '2026-12-01T00:00:00+08:00', Illustrate: '比赛信息与项目工作台。', RuleMD: '请按顺序完成各把打乱。', comp_json: { Events: [{ EventID: '333', EventName: '三阶', EventRoute: 7, IsComp: true, Schedule: [schedule, { ...schedule, Round: '第二轮', RoundNum: 2 }] }] } };
await context.route('**/public/comps/987654*', (route) => route.fulfill({ json: { code: '200', data: new URL(route.request().url()).pathname.replace(/\/$/, '').endsWith('987654') ? competition : [], msg: '' } }));
await context.route('**/public/events*', (route) => route.fulfill({ json: { code: '200', data: { Events: [event], UpdateTime: new Date().toISOString() }, msg: '' } }));
await context.route('**/public/formula-forum/counts?*', route => route.fulfill({ json: { data: { groups: {}, solutions: {} } } }));
await context.addInitScript(() => {
  window.addEventListener('unhandledrejection', event => window.reportWorkspaceRejection({ message: String(event.reason), type: event.reason?.constructor?.name, target: event.reason?.target?.src ?? event.reason?.target?.url, stack: event.reason?.stack }));
  const cases = Array.from({ length: 12 }, (_, index) => ({ name: `Case ${index + 1}`, algs: ["R U R' U'"], solutionIds: [(index + 1).toString(16).padStart(16, '0')], scrambles: ["R U R'"], image: '' }));
  localStorage.setItem('alg_class_cache_v3_333_PLL', JSON.stringify({ ts: Date.now(), data: { name: 'PLL', sets: [{ name: 'Main', groups: [{ name: 'Group', groupId: 'aaaaaaaaaaaaaaaa', algs: cases }] }] } }));
});

async function fit(label, selector) {
  const measure = await page.locator(selector).first().evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { width: box.width, right: box.right, left: box.left, viewport: innerWidth, overflow: document.documentElement.scrollWidth - innerWidth };
  });
  assert.ok(measure.width > 0 && measure.left >= -1 && measure.right <= measure.viewport + 1, `${label}: container outside viewport ${JSON.stringify(measure)}`);
  assert.ok(measure.overflow <= 1, `${label}: horizontal page overflow ${measure.overflow}px`);
  report.checks.push({ label: `${currentTheme} ${label}`, ...measure });
}

async function shot(name) {
  await page.waitForTimeout(300);
  const path = join(artifacts, `${currentTheme}-${currentWidth}-${name}.png`);
  await page.screenshot({ path, fullPage: false, animations: 'disabled' });
  report.screenshots.push(path);
}

async function semantic(selector, property, token) {
  const colors = await page.locator(selector).last().evaluate((element, { property, token }) => {
    const probe = document.createElement('span');
    probe.style.setProperty(property, `var(${token})`);
    element.appendChild(probe);
    const result = { actual: getComputedStyle(element).getPropertyValue(property), expected: getComputedStyle(probe).getPropertyValue(property) };
    probe.remove();
    return result;
  }, { property, token });
  assert.equal(colors.actual, colors.expected, `${currentTheme}/${currentWidth} ${selector} ${property} follows ${token}`);
  report.checks.push({ label: `${currentTheme}/${currentWidth} ${selector} ${property}`, ...colors });
}

async function currentSession() {
  return page.evaluate(() => {
    const root = JSON.parse(localStorage.getItem('cubing-pro:team-match:v1'));
    return root.sessions[root.currentSessionId];
  });
}

async function visit(path) {
  if (page.url() !== 'about:blank') await page.evaluate(theme => localStorage.setItem('theme', theme), currentTheme);
  const response = await page.goto(`${origin}${path}`, { waitUntil: 'domcontentloaded' });
  assert.equal(response?.status(), 200, `Page cannot compile: ${path}. Check shared components/ui/page.tsx and the dev server.`);
  await page.waitForLoadState('load');
  await page.evaluate((theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.style.colorScheme = theme;
  }, currentTheme);
}

try {
  for (const theme of ['light', 'dark']) {
  currentTheme = theme;
  await page.emulateMedia({ colorScheme: theme });
  for (const width of [390, 1440]) {
    currentWidth = width;
    await page.setViewportSize({ width, height: 960 });
    await visit('/algs/333/PLL/');
    await page.locator('.algs-formula-card').first().waitFor({ timeout: 60000 });
    await fit(`Algs ${width}`, '.algs-detail-shell');
    await shot('algs');
    assert.equal(await page.locator('.algs-case-grid').first().evaluate((el) => getComputedStyle(el).gap), '8px');
    await page.getByRole('button', { name: /公式练习/ }).first().click();
    await page.locator('.fp-dialog').waitFor();
    await fit(`Algs timer ${width}`, '.fp-dialog');
    await shot('algs-timer');
    await page.locator('.fp-close').click();

    await visit('/tools/solver/222/');
    const workbench = page.locator('main[data-settings-open]');
    await workbench.waitFor({ timeout: 60000 });
    await fit(`TwoSolver ${width}`, 'main[data-settings-open]');
    await shot('two-solver');
    await workbench.getByRole('button', { name: '分析配置', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    await fit(`TwoSolver dialog ${width}`, '[role="dialog"]');
    assert.equal(await page.getByRole('dialog').evaluate(el => getComputedStyle(el).borderRadius), '24px');
    await shot('two-settings');
    await page.keyboard.press('Escape');

    await visit('/tools/floppy-reduction/');
    await page.locator('.fr-axis-card').first().waitFor({ timeout: 60000 });
    await fit(`FR ${width}`, '.fr-workbench');
    await shot('fr');
    await page.locator('.fr-workbench twisty-player').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await shot('fr-viewer');
    assert.equal(await page.locator('.fr-workbench .chakra-card__root').first().evaluate((el) => getComputedStyle(el).borderRadius), '16px');
    await page.locator('.fr-axis-select').nth(1).click();
    assert.equal(await page.locator('.fr-axis-card').nth(1).getAttribute('data-active'), 'true');
    await page.getByText('教程', { exact: true }).click();
    await page.locator('.fr-tutorial').waitFor();
    await fit(`FR tutorial ${width}`, '.fr-tutorial');
    await shot('fr-tutorial');
    await page.getByText('练习', { exact: true }).click();
    await page.getByRole('button', { name: /随机/ }).first().waitFor();
    await fit(`FR practice ${width}`, '.fr-workbench');
    await shot('fr-practice');

    await visit('/tools/team-match/');
    await page.locator('.tm-workbench').waitFor({ timeout: 60000 });
    await fit(`TeamMatch ${width}`, '.tm-workbench');
    await shot('team-match');
    await page.getByRole('button', { name: '追加测试分组', exact: true }).click();
    await page.locator('.tm-workbench-modal').waitFor();
    await fit(`TeamMatch dialog ${width}`, '.tm-workbench-modal');
    await shot('team-dialog');
    assert.equal(await page.locator('.tm-workbench-modal .ant-modal-container').evaluate((el) => getComputedStyle(el).borderRadius), '16px');
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: '一键填充16队测试数据', exact: true }).click();
    await page.getByRole('button', { name: /覆\s*盖/, exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.tm-workbench .ant-table-tbody tr').length > 20);
    await page.waitForTimeout(250);
    const originalSession = await currentSession();
    const payload = { ...originalSession, name: '确认框主题与行为回归', players: originalSession.players.map((player, index) => ({ ...player, oneId: String(900000 + index) })) };
    const upload = () => page.locator('.tmJsonToolbar input[type="file"]').setInputFiles({ name: 'team-confirm.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(payload)) });
    await upload();
    await page.getByRole('dialog', { name: '确认导入', exact: true }).waitFor();
    await semantic('.ant-modal-confirm-title', 'color', '--foreground');
    await semantic('.ant-modal-confirm-content', 'color', '--foreground');
    await semantic('.ant-modal-confirm .ant-modal-container', 'background-color', '--card');
    await shot('team-import-confirm');
    await page.getByRole('dialog', { name: '确认导入', exact: true }).getByRole('button', { name: /取\s*消/ }).click();
    await page.getByRole('dialog', { name: '确认导入', exact: true }).waitFor({ state: 'hidden' });
    assert.equal((await currentSession()).name, originalSession.name, 'cancel import preserves the session');
    await upload();
    await page.getByRole('dialog', { name: '确认导入', exact: true }).getByRole('button', { name: /导\s*入/, exact: true }).click();
    await page.getByRole('dialog', { name: '确认导入', exact: true }).waitFor({ state: 'hidden' });
    await page.waitForFunction(() => {
      const root = JSON.parse(localStorage.getItem('cubing-pro:team-match:v1'));
      return root.sessions[root.currentSessionId].name === '确认框主题与行为回归';
    });
    const player = payload.players[0];
    const oneText = `${player.name}\t999991\n不存在的回归选手\t999992`;
    await page.getByRole('button', { name: '同步 One ID', exact: true }).click();
    const oneDialog = page.getByRole('dialog', { name: '同步 One ID', exact: true });
    await oneDialog.locator('textarea').fill(`${player.name}\t${payload.players[1].oneId}`);
    await oneDialog.getByRole('button', { name: '解析并同步', exact: true }).click();
    const conflict = page.getByRole('dialog', { name: 'One ID 冲突', exact: true });
    await conflict.waitFor();
    await semantic('.ant-modal-confirm-title', 'color', '--foreground');
    await semantic('.ant-modal-confirm .ant-modal-container', 'background-color', '--card');
    await shot('team-one-conflict');
    await conflict.locator('.ant-modal-confirm-btns button').click();
    await conflict.waitFor({ state: 'hidden' });
    assert.equal((await currentSession()).players.find(p => p.id === player.id).oneId, player.oneId, 'conflict preserves player data');
    await oneDialog.locator('textarea').fill(oneText);
    await oneDialog.getByRole('button', { name: '解析并同步', exact: true }).click();
    const oneConfirm = page.getByRole('dialog', { name: '确认同步 One ID', exact: true });
    await oneConfirm.waitFor();
    await semantic('.ant-modal-confirm-title', 'color', '--foreground');
    await semantic('.ant-modal-confirm-content', 'color', '--foreground');
    await semantic('.ant-modal-confirm .ant-modal-container', 'background-color', '--card');
    await shot('team-one-confirm');
    await oneConfirm.getByRole('button', { name: /取\s*消/ }).click();
    await oneConfirm.waitFor({ state: 'hidden' });
    assert.equal((await currentSession()).players.find(p => p.id === player.id).oneId, player.oneId, 'cancel One ID sync preserves player data');
    await oneDialog.getByRole('button', { name: '解析并同步', exact: true }).click();
    await oneConfirm.getByRole('button', { name: '确认写入', exact: true }).click();
    await page.waitForFunction(id => {
      const root = JSON.parse(localStorage.getItem('cubing-pro:team-match:v1'));
      return root.sessions[root.currentSessionId].players.find(p => p.id === id).oneId === '999991';
    }, player.id);
    await fit(`TeamMatch populated roster ${width}`, '.tm-workbench');
    await page.locator('.tm-workbench .ant-card').last().scrollIntoViewIfNeeded();
    await shot('team-roster');
    for (const [index, name] of [[1, 'teams'], [2, 'scores'], [3, 'confirmation']]) {
      await page.locator('.tm-workbench .ant-steps-item').nth(index).click();
      await fit(`TeamMatch ${name} ${width}`, '.tm-workbench');
      await page.locator('.tm-workbench-main .ant-card').first().scrollIntoViewIfNeeded();
      await shot(`team-${name}`);
    }

    await visit('/competition/987654/?comps_tabs=detail');
    await page.locator('.competition-detail-grid .ant-card').first().waitFor({ timeout: 60000 });
    await fit(`Competition ${width}`, '.competition-workbench');
    await shot('competition');
    await page.getByRole('tab', { name: /打乱/ }).first().click();
    await page.locator('.scramble-group-toolbar').waitFor();
    await fit(`Competition scrambles ${width}`, '.scramble-group-toolbar');
    await shot('scrambles');
    assert.ok(await page.locator('.scramble-group-toolbar').evaluate((el) => {
      const header = document.querySelector('[data-app-header]');
      return parseFloat(getComputedStyle(el).top) >= (header?.getBoundingClientRect().height ?? 64);
    }), 'scramble toolbar must clear the app header');
    await page.getByRole('button', { name: '群赛计时器', exact: true }).click();
    await page.locator('.group-timer-fs').waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('.group-timer-scramble-preview__img img')].some(image => image.complete && image.naturalWidth > 0));
    await fit(`Group timer ${width}`, '.group-timer-fs');
    await semantic('.group-timer-current-result', 'color', '--foreground');
    await semantic('.group-timer-bl', 'color', '--muted-foreground');
    await semantic('.group-timer-bottom-dock', 'border-top-color', '--border-default');
    await semantic('.group-timer-btn-dnf', 'color', '--destructive');
    await semantic('.group-timer-btn-plus2', 'color', '--signal-warning');
    await semantic('.group-timer-btn-dns', 'color', '--signal-info');
    const dock = await page.locator('.group-timer-bottom-dock').evaluate(el => ({ bottom: el.getBoundingClientRect().bottom, height: el.getBoundingClientRect().height, viewport: innerHeight, rootHeight: el.parentElement.getBoundingClientRect().height, scrollHeight: el.parentElement.scrollHeight }));
    report.checks.push({ label: `${theme} ${width} timer dock`, ...dock });
    assert.ok(dock.bottom <= dock.viewport + 1, `timer dock clipped: ${JSON.stringify(dock)}`);
    await shot('group-timer');
    await page.getByRole('button', { name: /更多/ }).click();
    await page.getByRole('menuitem', { name: '项目进度', exact: true }).click();
    await page.locator('.group-timer-overview-row--idle').waitFor();
    await semantic('.group-timer-overview-row--idle', 'border-top-color', '--signal-warning');
    await shot('group-progress');
    await page.keyboard.press('Escape');
    console.log(`PASS ${theme} ${width}px: five domains, formulas, dialogs, FR axis selection, competition tabs and group timer`);
  }
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(report.rejections, []);
  assert.deepEqual(report.consoleErrors, []);
} catch (error) {
  await shot('failure');
  report.failure = error.stack;
  throw error;
} finally {
  await writeFile(join(artifacts, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
