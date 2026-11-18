import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import * as extra from '../../i18n/messages/competition-extra';

const catalogs = [extra.competitionExtraZhCN, extra.competitionExtraEnUS, extra.competitionExtraJa,
  extra.competitionExtraYue, extra.competitionExtraKo, extra.competitionExtraFr, extra.competitionExtraEs];

test('competitionExtra has seven complete catalogs and matching parameter names', () => {
  const keys = Object.keys(catalogs[0]);
  assert.ok(keys.length > 40);
  for (const catalog of catalogs) {
    assert.deepEqual(Object.keys(catalog), keys);
    for (const [key, value] of Object.entries(catalog)) {
      assert.ok(value.trim(), key);
      assert.deepEqual([...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort(),
        [...catalogs[0][key as keyof typeof catalog].matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort(), key);
    }
  }
});

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? files(path) : path.endsWith('.tsx') ? [path] : [];
  });
}

test('all scoped TSX files contain no Chinese UI literals and explicit locale for names', () => {
  for (const path of [...files(resolve('src/views/GroupCompetitions')), ...files(resolve('src/views/Static'))]) {
    const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node: ts.Node) {
      if (ts.isStringLiteralLike(node) || ts.isJsxText(node)) {
        assert.doesNotMatch(node.text, /\p{Script=Han}/u, `${path}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`);
      }
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const name = node.expression.text;
        if (name === 'CubesCn') assert.equal(node.arguments[1]?.getText(source), 'locale', path);
        if (name === 'getCountryDisplayName') assert.equal(node.arguments[2]?.getText(source), 'locale', path);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
});
