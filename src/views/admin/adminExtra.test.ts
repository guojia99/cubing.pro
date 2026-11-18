import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import { adminExtraZhCN, adminExtraEnUS, adminExtraJa, adminExtraYue, adminExtraKo, adminExtraFr, adminExtraEs } from "../../i18n/messages/admin-extra";

const catalogs = { zh: adminExtraZhCN, en: adminExtraEnUS, ja: adminExtraJa, yue: adminExtraYue, ko: adminExtraKo, fr: adminExtraFr, es: adminExtraEs };
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

test("admin extra catalogs contain the same nonempty keys and interpolation parameters in seven languages", () => {
  const keys = Object.keys(adminExtraZhCN) as (keyof typeof adminExtraZhCN)[];
  for (const [locale, catalog] of Object.entries(catalogs)) {
    assert.deepEqual(Object.keys(catalog), keys, locale);
    for (const key of keys) {
      assert.ok(catalog[key].trim(), `${locale}: ${key}`);
      assert.deepEqual(placeholders(catalog[key]), placeholders(adminExtraZhCN[key]), `${locale}: ${key}`);
    }
  }
});

test("scoped pages have valid dictionary keys and no hardcoded Chinese UI text", () => {
  for (const file of ["OrganizersCompsPageView.tsx", "OrganizersResultsPageView.tsx", "OrganizersCreateCompsPageView.tsx", "CompetitionSwitcher.tsx"]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node: ts.Node) => {
      if (ts.isStringLiteralLike(node) || ts.isJsxText(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
        assert.ok(!/[\u3400-\u9fff]/u.test(node.text), `${file}: hardcoded text ${node.text}`);
        if (node.text.startsWith("adminExtra.")) assert.ok(node.text in adminExtraZhCN, `${file}: unknown key ${node.text}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
});
