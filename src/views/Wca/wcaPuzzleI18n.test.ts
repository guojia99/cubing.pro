import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { SUPPORTED_LOCALES } from '@/i18n/locales';
import * as extra from '@/i18n/messages/wca-puzzle-extra';
import { getCountryDisplayName } from './PlayerComponents/region/all_contiry';
import { getLocalizedCountryLabel } from './utils/countryLabel';
import { displayProvinceName } from './PlayerComponents/litCities/chinaProvinceNormalize';
import { CubesCn } from '@/components/CubeIcon/cube';
import { formatRoundName } from './utils/events';
import { localizePuzzleError } from '@/components/puzzles/localizePuzzleError';
import { localizeEngineText } from '../TwoSolver/solverMessages';
import { getAlgDisplayName } from '../Algs/utils/algDisplayName';
import fr from '@/i18n/messages/fr';
import es from '@/i18n/messages/es';
import { formatSolutionStages, formatAnnotatedSolution } from '../TwoSolver/solutionFormat';
import { buildPracticeStats, formatPracticeTooltip } from '../TwoSolver/practiceStatistics';
import { translate } from '@/i18n';
import { formatToBeijingTime } from './WcaComps/utils';
import { getIntlLocale } from '@/i18n/locales';

const catalogs = [extra.wcaPuzzleExtraZhCN, extra.wcaPuzzleExtraEnUS, extra.wcaPuzzleExtraJa, extra.wcaPuzzleExtraYue, extra.wcaPuzzleExtraKo, extra.wcaPuzzleExtraFr, extra.wcaPuzzleExtraEs];
const params = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
test('seven explicit catalogs have equal keys, nonempty translations and matching parameters', () => {
  for (const catalog of catalogs) {
    assert.deepEqual(Object.keys(catalog).sort(), Object.keys(catalogs[0]).sort());
    for (const key of Object.keys(catalog) as extra.WcaPuzzleExtraKey[]) {
      assert.ok(catalog[key].trim(), key);
      assert.deepEqual(params(catalog[key]), params(catalogs[0][key]), key);
    }
  }
  for (const catalog of [extra.wcaPuzzleExtraEnUS, extra.wcaPuzzleExtraFr, extra.wcaPuzzleExtraEs]) {
    for (const value of Object.values(catalog)) assert.doesNotMatch(value, /\p{Script=Han}/u);
  }
  console.log(`${Object.keys(catalogs[0]).length} keys × ${catalogs.length} locales`);
});

test('countries, WCA aliases, provinces, event names and rounds follow explicit locale without browser storage', () => {
  const germany = ['德国', 'Germany', 'ドイツ', '德國', '독일', 'Allemagne', 'Alemania'];
  for (const [i, { key: locale }] of SUPPORTED_LOCALES.entries()) {
    assert.equal(getCountryDisplayName('DE', undefined, locale), germany[i]);
    assert.equal(getLocalizedCountryLabel('Germany', undefined, locale), germany[i]);
    assert.equal(getLocalizedCountryLabel('Czech Rep.', undefined, locale), getCountryDisplayName('CZ', undefined, locale));
    assert.equal(getLocalizedCountryLabel('fixture-country', [{ id: 'fixture-country', name: 'Germany', iso2: 'DE' }] as never, locale), germany[i]);
    assert.equal(getCountryDisplayName('?', 'API name', locale), 'API name');
    assert.ok(CubesCn('333oh', locale) !== '333oh');
    assert.ok(formatRoundName('f', locale) !== 'f');
    assert.equal(displayProvinceName('北京市', locale), extra.translateWcaPuzzleExtra(locale, 'wcaPuzzleExtra.province.Beijing'));
    assert.equal(formatToBeijingTime('2026-11-18T10:00:00Z', locale), new Date('2026-11-18T10:00:00Z').toLocaleString(getIntlLocale(locale), { timeZone: 'Asia/Shanghai', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }));
    for (const round of ['0', '1', '2', '3', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) assert.ok(formatRoundName(round, locale) !== round);
  }
  assert.equal(CubesCn('api-unknown', 'ja'), 'api-unknown');
  assert.equal(formatRoundName('api-unknown', 'ko'), 'api-unknown');
});

test('expected native and notation failures translate at display time with parameters intact', () => {
  const errors = [
    'Only one native 2x2x2 player can be interactive at a time.',
    'Native 2x2x2 WebGL context lost. Retry to recover.',
    'Native 2x2x2 scene is unavailable.', 'Native 2x2x2 position API is unavailable.',
    'Canvas screenshots are unavailable.', 'Native 2x2x2 screenshot is empty.',
    '3D player loading timed out.', 'Puzzle face colors are unavailable.',
    'Missing native puzzle face: U', 'Invalid F face color: #xyz', 'Formula is too long',
    'Formula exceeds 32 nesting levels', 'Formula expansion exceeds 4000 leaves',
    'Formula repetition must be a safe integer', 'Illegal Square-1 slice',
    'No formula or setup available', 'Unsupported Square-1 move: M',
    'Square-1 notation at character 4: unexpected closing parenthesis',
    'Square-1 notation: unverified Angle annotation "bad"',
    'Library notation exceeds 4000 moves', 'Square-1 notation exceeds 24000 characters',
    'Native 2x2x2 operation timed out. Retry to recover.', 'expected stopping',
    'Invalid move for KPuzzle (3x3x3): Q', 'Unexpected character: @',
  ];
  const snapshot = [...errors];
  for (const { key: locale } of SUPPORTED_LOCALES) {
    for (const raw of errors) {
      const localized = localizePuzzleError(raw, locale);
      assert.ok(localized.trim(), `${locale}: ${raw}`);
      if (locale !== 'en-US') assert.notEqual(localized, raw, `${locale}: ${raw}`);
    }
    assert.ok(localizePuzzleError('Invalid F face color: #xyz', locale).includes('#xyz'));
    assert.ok(localizePuzzleError('Formula expansion exceeds 4000 leaves', locale).includes('4000'));
    assert.equal(localizePuzzleError('Unknown diagnostic id=42', locale), 'Unknown diagnostic id=42');
    assert.equal(localizePuzzleError('Invalid internal diagnostic id=42', locale), 'Invalid internal diagnostic id=42');
    assert.notEqual(localizeEngineText('Invalid whole-cube rotation', locale), 'Invalid whole-cube rotation');
    assert.ok(localizeEngineText('Unknown move M', locale).includes('M'));
  }
  assert.deepEqual(errors, snapshot);
});

test('algorithm source identity survives seven localized display names and missing API translations', () => {
  const alg = { name: 'raw', algs: ['R U'], name_zh: '中文', name_en: 'English', name_ja: '日本語', name_yue: '廣東話', name_ko: '한국어', name_fr: 'Français', name_es: 'Español' };
  const original = structuredClone(alg);
  for (const [i, { key: locale }] of SUPPORTED_LOCALES.entries()) {
    assert.equal(getAlgDisplayName(alg, locale), ['中文', 'English', '日本語', '廣東話', '한국어', 'Français', 'Español'][i]);
    assert.equal(getAlgDisplayName({ name: 'source case', algs: [] }, locale), 'source case');
  }
  assert.deepEqual(alg, original);
});

test('French and Spanish PR suffixes contain translated prose', () => {
  for (const catalog of [fr, es]) for (const key of ['wca.results.prStreakBreakAtSuffix', 'wca.results.prStreakBreakPrevSuffix'] as const) {
    assert.ok(catalog[key].trim());
    assert.doesNotMatch(catalog[key], /\p{Script=Han}/u);
  }
});

test('pure solution and chart formatters use all seven languages without an injected translator', () => {
  const solution = { method: 'CLL', orientation: 'x', base: 'R', preAuf: 'U', algorithm: "R U R'", postAuf: '', execution: "R U R U R'", moves: 5 } as never;
  const record = { id: 'locale', scramble: "R U R'", sampling: 'random', elapsedMs: 1234, inspectionMs: 0, inspectionPenalty: 'none', penalty: 'none', date: '2026-11-18T10:00:00Z' } as const;
  const point = buildPracticeStats([record]).points[0];
  for (const { key: locale } of SUPPORTED_LOCALES) {
    assert.equal(formatSolutionStages(solution, locale)[0].label, translate(locale, 'two.detail.stage.orientation'));
    assert.ok(formatAnnotatedSolution(solution, locale).includes(translate(locale, 'two.detail.annotationOverlap')));
    assert.ok(formatPracticeTooltip(point, 2, locale).includes(translate(locale, 'two.detail.reviewHint')));
  }
});

test('owned WCA consumers pass locale explicitly and visible JSX has no fixed language labels', () => {
  const files: string[] = [];
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.tsx?$/.test(path) && !/\.test\./.test(path) && !path.endsWith('/utils/events.ts')) files.push(path);
    }
  };
  for (const root of ['src/views/Wca', 'src/views/Algs', 'src/views/TwoSolver', 'src/components/puzzles']) walk(root);
  const issues: string[] = [];
  for (const path of files) {
    const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const visit = (node: ts.Node) => {
      if (path.startsWith('src/views/Wca') && ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        if (node.expression.text === 'CubesCn' && node.arguments.length < 2) issues.push(`${path}: implicit event locale`);
        if (node.expression.text === 'getCountryNameByIso2') issues.push(`${path}: legacy Chinese country lookup`);
      }
      if (ts.isJsxAttribute(node) && ['eyebrow', 'aria-label', 'alt', 'title', 'placeholder'].includes(node.name.getText(source)) && node.initializer && ts.isStringLiteral(node.initializer)) {
        const value = node.initializer.text;
        if (/[A-Za-z]{3,}|\p{Script=Han}/u.test(value) && !/^(?:2x2x2|R U R' F2…)$/.test(value)) issues.push(`${path}: fixed ${node.name.getText(source)}=${value}`);
      }
      if (ts.isJsxText(node)) {
        const value = node.text.replace(/&(?:larr|rarr|nbsp|times|middot);/g, '').replace(/\s+/g, ' ').trim();
        if (/\p{Script=Han}|[A-Za-z]{3,}/u.test(value) && !/^(?:DNF|DNS|SVG|PNG|PDF|HTM|STM|AUF|WCA|SQ1|Square-1|mo3|ao5|ao12|x|ms|[+×\d\s./%-]+)$/.test(value)) issues.push(`${path}: fixed JSX text=${value}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  assert.deepEqual(issues, []);
  console.log(`AST audit: ${files.length} production TS/TSX files (vendor, tests and shared events.ts excluded)`);
});
