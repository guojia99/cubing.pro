import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import {
  teamMatchZhCN, teamMatchEnUS, teamMatchJa, teamMatchYue,
  teamMatchKo, teamMatchFr, teamMatchEs,
} from '../../i18n/messages/team-match';
import { tm, type TeamMatchKey, type TeamMatchLocale } from './i18n';
import { createEmptySession } from './sessionFactory';
import { buildTeamRosterPasteImport } from './teamRosterPasteImport';
import { classifyTeamComposition, defaultTeamName, teamKindLabel } from './teamClassify';
import { seedingSourceLabel } from './seedingScorePick';
import { teamMatchEventOptions } from './wcaCubeEvents';
import { formatPkLineForPlayer } from './pkSettlement';
import { buildMainPoolDisplayRows } from './eliminationResolve';
import { reduceSession } from './sessionReducer';

const catalogs = {
  'zh-CN': teamMatchZhCN, 'en-US': teamMatchEnUS, ja: teamMatchJa,
  'yue-Hant-HK': teamMatchYue, ko: teamMatchKo, fr: teamMatchFr, es: teamMatchEs,
};
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();

test('all seven catalogs contain real text with matching interpolation parameters', () => {
  const keys = Object.keys(teamMatchZhCN) as TeamMatchKey[];
  for (const [locale, catalog] of Object.entries(catalogs)) {
    assert.deepEqual(Object.keys(catalog), keys, locale);
    for (const key of keys) {
      assert.ok(catalog[key].trim(), `${locale}: ${key}`);
      assert.deepEqual(placeholders(catalog[key]), placeholders(teamMatchZhCN[key]), `${locale}: ${key}`);
      const params = Object.fromEntries(placeholders(catalog[key]).map(name => [name, 'VALUE']));
      assert.equal(tm(locale as TeamMatchLocale, key, params).includes('{'), false, `${locale}: ${key}`);
      assert.equal(tm(locale as TeamMatchLocale, key), catalog[key], `${locale}: ${key}`);
      if (['en-US', 'ko', 'fr', 'es'].includes(locale)) assert.doesNotMatch(catalog[key], /\p{Script=Han}/u, `${locale}: ${key}`);
    }
  }
});

test('domain-derived labels, import errors and new test data use the requested locale', () => {
  const session = createEmptySession();
  const school = { id: 'school', name: 'Academy', kind: 'standard' as const };
  const team = { id: 'team', schoolId: school.id, kind: 'school' as const, name: 'Alpha', playerIds: ['p1', 'p2', 'p3'], disabled: false, isSeed: false };
  const players = team.playerIds.map(id => ({ id, name: id, schoolId: school.id, wcaId: null, oneId: null, avatarDataUrl: null }));
  for (const locale of Object.keys(catalogs) as (keyof typeof catalogs)[]) {
    assert.equal(teamKindLabel(team, [school], locale), tm(locale, 'teamMatch.schoolTeamAffiliation', { name: school.name }));
    assert.equal(defaultTeamName('freelancer', 'pool', [], locale), tm(locale, 'teamMatch.independentTeam'));
    assert.equal(seedingSourceLabel('preliminary', locale), tm(locale, 'teamMatch.preliminary'));
    assert.equal(teamMatchEventOptions(locale)[0].label, `${tm(locale, 'teamMatch.event222')} 222`);
    assert.equal(formatPkLineForPlayer([{ playerId: 'p1', teamId: team.id, value: 12.34 }], 'p1', locale), tm(locale, 'teamMatch.currentResultValue', { value: '12.34' }));
    const empty = buildTeamRosterPasteImport(session, '', locale);
    assert.deepEqual(empty, { ok: false, message: tm(locale, 'teamMatch.emptyPaste') });
    const invalid = buildTeamRosterPasteImport(session, 'Alpha\tOne', locale);
    assert.deepEqual(invalid, { ok: false, message: tm(locale, 'teamMatch.rosterColumns', { line: 1, count: 3 }) });
    assert.deepEqual(classifyTeamComposition(['a', 'b', 'c'], [], [], locale), { ok: false, message: tm(locale, 'teamMatch.threePlayersRequired') });
    const imported = buildTeamRosterPasteImport(session, 'Alpha (Academy)\tOne\tTwo\tThree', locale);
    assert.equal(imported.ok, true);
    if (imported.ok) assert.equal(imported.teams[0].name, 'Alpha');
    const mock = reduceSession(session, { type: 'MOCK_FILL_TEST_DATA', locale });
    assert.equal(mock.name, tm(locale, 'teamMatch.testMatchName'));
    assert.equal(mock.teams.length, 16);
    assert.equal(mock.teams[0].name, tm(locale, 'teamMatch.numberedSchoolTeam', { school: mock.schools[0].name, count: 1 }));
    for (const row of buildMainPoolDisplayRows({ ...session, schools: [school], players, teams: [team] })) {
      for (const key of row.roleTags) assert.ok(teamMatchZhCN[key], key);
    }
  }
});

test('view source has no untranslated Chinese UI literals or import-only translation hooks', () => {
  const root = dirname(fileURLToPath(import.meta.url));
  const failures: string[] = [];
  function scan(dir: string) {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, item.name);
      if (item.isDirectory()) { scan(file); continue; }
      if (!/\.(ts|tsx)$/.test(item.name) || item.name.endsWith('.test.ts')) continue;
      const text = readFileSync(file, 'utf8');
      const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
      let hookImports = 0;
      let hookCalls = 0;
      function visit(node: ts.Node) {
        if (ts.isImportSpecifier(node) && node.name.text === 'useTeamMatchI18n') hookImports++;
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'useTeamMatchI18n') hookCalls++;
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isJsxText(node) || ts.isTemplateExpression(node)) {
          const value = ts.isTemplateExpression(node) ? node.getText(source) : node.text;
          if (/\p{Script=Han}/u.test(value)) {
            const parserHeader = item.name === 'bulkOneUidImport.ts' && ['排名', '序号', '姓名'].includes(value);
            const mockSchool = item.name === 'mockLocal.ts' && ['中山大学', '华南理工', '暨南大学', '华师', '深大', '南方科', '广工', '广外', '广州大学', '南方医科大学'].includes(value);
            const example = ts.isVariableDeclaration(node.parent) && node.parent.name.getText(source) === 'EXAMPLE';
            if (!parserHeader && !mockSchool && !example) failures.push(`${item.name}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}: ${value}`);
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
      assert.ok(!hookImports || hookCalls > 0, `${item.name}: imported hook is never called`);
    }
  }
  scan(root);
  assert.deepEqual(failures, []);
});
