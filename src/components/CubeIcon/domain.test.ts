import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import { CubesCn } from './cube';
import { Cubes, CubesAttributesList, getCubesAttributes } from './cube_map';
import { domainCatalogs, domainZhCN, formatRoundName, translateDomain, type DomainMessageKey } from '../../i18n/messages/domain';
import { LOCALE_STORAGE_KEY, SUPPORTED_LOCALES } from '../../i18n/locales';
import { eventRouteM, eventRouteName, RouteMaps } from '../Data/cube_result/event_route';
import { DNF, resultStringPro, resultTimeString, resultToBest, sortResults, type Result } from '../Data/types/result';
import { getRoundNameMap, roundNameMap, roundSortOrder } from '../../views/Wca/utils/events';
import {
  competitionAdminZhCN, competitionAdminEnUS, competitionAdminJa, competitionAdminYue,
  competitionAdminKo, competitionAdminFr, competitionAdminEs,
} from '../../i18n/messages/competition-admin';

const root = dirname(fileURLToPath(import.meta.url));
const locales = SUPPORTED_LOCALES.map(item => item.key);
const placeholders = (text: string) => [...new Set([...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]))].sort();

test('seven domain catalogs have complete translations and matching parameters', () => {
  for (const locale of locales) {
    assert.deepEqual(Object.keys(domainCatalogs[locale]), Object.keys(domainZhCN));
    for (const key of Object.keys(domainZhCN) as DomainMessageKey[]) {
      const text = domainCatalogs[locale][key];
      assert.ok(text.trim(), `${locale}: ${key}`);
      assert.deepEqual(placeholders(text), placeholders(domainZhCN[key]), `${locale}: ${key}`);
      assert.equal(translateDomain(locale, key), text);
      if (['en-US', 'ko', 'fr', 'es'].includes(locale)) assert.doesNotMatch(text, /\p{Script=Han}/u, `${locale}: ${key}`);
      const params = Object.fromEntries(placeholders(text).map(name => [name, 12]));
      assert.doesNotMatch(translateDomain(locale, key, params), /\{\w+\}/);
    }
  }
});

test('every enum and custom icon event is translated, including aliases and compound events', () => {
  const css = readFileSync(join(root, 'cube_icon_map.css'), 'utf8');
  const events = new Set([...Object.values(Cubes), ...[...css.matchAll(/\.cubing-icon-([\w-]+):before/g)].map(match => match[1])]);
  for (const locale of locales) {
    for (const id of events) {
      const label = CubesCn(id, locale);
      if (!['FTO', 'skewb'].includes(id)) assert.notEqual(label, id, `${locale}: missing ${id}`);
      assert.ok(label.trim());
      assert.doesNotMatch(label, /\{\w+\}/);
      if (['en-US', 'ko', 'fr', 'es'].includes(locale)) assert.doesNotMatch(label, /\p{Script=Han}/u, `${locale}: ${id}`);
    }
    assert.equal(CubesCn('SQ-1', locale), CubesCn('sq1', locale));
    assert.equal(CubesCn('o333bf', locale), CubesCn('333bf', locale));
    assert.equal(CubesCn('FTO', locale), CubesCn('fto', locale));
    assert.equal(CubesCn('my_custom_event', locale), 'my_custom_event');
    assert.equal(CubesCn('my_custom_event_multiple5', locale), 'my_custom_event_multiple5');
    assert.equal(CubesCn('', locale), '');
    assert.deepEqual(getCubesAttributes(locale).map(item => item.Cn), CubesAttributesList.map(item => CubesCn(item.Cubes, locale)));
  }
});

test('domain catalog, event names, routes and rounds have no root-catalog dependency', () => {
  for (const file of [join(root, 'cube.ts'), join(root, '../Data/cube_result/event_route.ts'), join(root, '../../i18n/messages/domain.ts'), join(root, '../../views/Wca/utils/events.ts')]) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    for (const node of source.statements) {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        assert.notEqual(node.moduleSpecifier.text, '@/i18n', file);
        assert.doesNotMatch(node.moduleSpecifier.text, /contexts|components\/Data\/CompetitionMessage/, file);
      }
    }
  }
});

test('all Data header and tooltip message keys have seven translations', () => {
  const catalogs = [competitionAdminZhCN, competitionAdminEnUS, competitionAdminJa, competitionAdminYue, competitionAdminKo, competitionAdminFr, competitionAdminEs];
  const keys = new Set<string>();
  function scan(path: string) {
    for (const item of readdirSync(path, { withFileTypes: true })) {
      const file = join(path, item.name);
      if (item.isDirectory()) { scan(file); continue; }
      if (!/\.tsx?$/.test(item.name)) continue;
      for (const match of readFileSync(file, 'utf8').matchAll(/competitionAdmin\.[a-zA-Z]+/g)) keys.add(match[0]);
    }
  }
  scan(join(root, '../Data'));
  assert.ok(keys.size > 20);
  for (const key of keys) {
    for (const catalog of catalogs) {
      const text = catalog[key as keyof typeof competitionAdminZhCN];
      assert.ok(text?.trim(), key);
    }
  }
});

test('legacy APIs read storage at call time, explicit locale wins and SSR is safe', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  let current = 'en-US';
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    localStorage: { getItem(key: string) { assert.equal(key, LOCALE_STORAGE_KEY); return current; } },
  } });
  try {
    for (const locale of locales) {
      current = locale;
      assert.equal(CubesCn('333'), CubesCn('333', locale));
      assert.equal(CubesAttributesList[0].Cn, CubesCn('333', locale));
      assert.equal(RouteMaps.get(3)?.name, eventRouteName(3, locale));
      assert.equal(eventRouteM(3).name, eventRouteName(3, locale));
      assert.equal(eventRouteM(3, 'en-US').name, eventRouteName(3, 'en-US'));
      assert.equal(roundNameMap.f, formatRoundName('f', locale));
      assert.equal(CubesCn('333', 'en-US'), '3×3×3 Cube');
      assert.equal(resultToBest({ EventRoute: 7, Best: 12.34, Average: DNF } as Result), `12.34[${translateDomain(locale, 'domain.data.single')}]`);
    }
    current = 'unsupported';
    assert.equal(CubesCn('333'), '三阶');
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
    assert.equal(CubesCn('333'), '三阶');
    Reflect.deleteProperty(globalThis, 'window');
    assert.equal(CubesCn('333'), '三阶');
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'window', descriptor);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('round labels localize while legacy codes, iteration and sorting stay stable', () => {
  const codes = ['0', '1', '2', '3', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  assert.deepEqual(Object.keys(roundNameMap), codes);
  assert.deepEqual(roundSortOrder, { f: 1, c: 1, b: 1, '3': 3, g: 3, '2': 5, e: 5, '1': 7, d: 7, h: 9, '0': 9 });
  const sorted = codes.toSorted((a, b) => roundSortOrder[a] - roundSortOrder[b]);
  for (const locale of locales) {
    const names = getRoundNameMap(locale);
    assert.deepEqual(Object.keys(names), codes);
    assert.deepEqual(codes.toSorted((a, b) => roundSortOrder[a] - roundSortOrder[b]), sorted);
    for (const code of codes) {
      assert.equal(names[code], formatRoundName(code, locale));
      assert.equal(formatRoundName(domainZhCN[`domain.round.${code}` as DomainMessageKey], locale), names[code]);
    }
    assert.equal(formatRoundName('第12轮', locale), translateDomain(locale, 'domain.round.numbered', { count: 12 }));
    assert.equal(formatRoundName('複賽第2輪', locale), translateDomain(locale, 'domain.round.intermediate', { count: 2 }));
    assert.equal(formatRoundName('Custom round', locale), 'Custom round');
  }
});

test('route metadata, result units, result formatting and rank order are preserved', () => {
  const metadata = [...RouteMaps].map(([code, data]) => [code, Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'name'))]);
  assert.deepEqual(metadata, [
    [0, { notComp: true }], [1, { rounds: 1, withBest: true }], [2, { rounds: 3, withBest: true }],
    [3, { integer: true, rounds: 3 }], [4, { rounds: 3 }], [5, { rounds: 5, withBest: true, headToTailNum: 1 }],
    [6, { rounds: 5, headToTailNum: 0 }], [7, { rounds: 5, headToTailNum: 1 }],
    [8, { repeatedly: true, repeatedlyNum: 1, rounds: 3, withBest: true }],
    [9, { repeatedly: true, repeatedlyNum: 2, rounds: 6, withBest: true }],
    [10, { repeatedly: true, repeatedlyNum: 3, rounds: 9, withBest: true }],
  ]);
  for (const locale of locales) {
    for (const [code, data] of metadata) {
      const { name, ...actual } = eventRouteM(code as number, locale);
      assert.deepEqual(actual, data);
      assert.equal(name, translateDomain(locale, `domain.route.${code}` as DomainMessageKey));
    }
    assert.equal(resultTimeString(83.45), '1:23.45');
    assert.equal(resultTimeString(-10001), 'DNS');
    assert.equal(resultTimeString(DNF), 'DNF');
    assert.equal(resultTimeString(23.99, true), '23');
    assert.deepEqual(resultStringPro([12, 13, 14, 15, 16], 7), ['(12.00)', '13.00', '14.00', '15.00', '(16.00)']);
    assert.equal(resultToBest({ EventRoute: 8, BestRepeatedlyReduction: 7, BestRepeatedlyTry: 8, BestRepeatedlyTime: 600 } as Result, locale), '7/8  10:00');
    assert.equal(resultToBest({ EventRoute: 1, Best: 12.34 } as Result, locale), '12.34');
    const rows = [{ id: 1, Best: 13, Average: 15 }, { id: 2, Best: 12, Average: 14 }].map(row => ({ ...row, EventRoute: 7 }) as Result);
    assert.deepEqual(sortResults(rows).map(row => [row.id, row.Rank]), [[2, 0], [1, 1]]);
  }
});

test('full source scan permits only unchanged Chinese status protocol literals outside the domain catalog', () => {
  const failures: string[] = [];
  function scan(path: string) {
    for (const item of readdirSync(path, { withFileTypes: true })) {
      const file = join(path, item.name);
      if (item.isDirectory()) { scan(file); continue; }
      if (!/\.(ts|tsx)$/.test(item.name) || item.name.endsWith('.test.ts')) continue;
      check(file);
    }
  }
  function check(file: string) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node: ts.Node) {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isJsxText(node)) {
        const protocol = file.endsWith('comps_tables.tsx') && ['已结束', '未开始', '进行中'].includes(node.text);
        if (/\p{Script=Han}/u.test(node.text) && !protocol) failures.push(`${file}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}: ${node.text}`);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  scan(root);
  scan(join(root, '../Data'));
  check(join(root, '../../views/Wca/utils/events.ts'));
  assert.deepEqual(failures, []);
});
