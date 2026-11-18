import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import { catalogs as rootCatalogs } from "../../i18n";
import { adminManagementZhCN, adminManagementEnUS, adminManagementJa, adminManagementYue, adminManagementKo, adminManagementFr, adminManagementEs } from "../../i18n/messages/admin-management";

const catalogs = { "zh-CN": adminManagementZhCN, "en-US": adminManagementEnUS, ja: adminManagementJa, "yue-Hant-HK": adminManagementYue, ko: adminManagementKo, fr: adminManagementFr, es: adminManagementEs };
const excluded = new Set(["OrganizersCompsPageView.tsx", "OrganizersResultsPageView.tsx", "OrganizersCreateCompsPageView.tsx", "AdminCompetitionWorkspace.tsx"]);
const parameters = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

test("management catalogs provide seven explicit translations with matching parameters", () => {
  const keys = Object.keys(adminManagementZhCN) as (keyof typeof adminManagementZhCN)[];
  for (const [locale, catalog] of Object.entries(catalogs)) {
    assert.deepEqual(Object.keys(catalog), keys, locale);
    for (const key of keys) {
      assert.ok(catalog[key].trim(), `${locale}: ${key}`);
      assert.deepEqual(parameters(catalog[key]), parameters(adminManagementZhCN[key]), `${locale}: ${key}`);
      if (["en-US", "ko", "fr", "es"].includes(locale)) {
        assert.doesNotMatch(catalog[key], /[\u3400-\u9fff]/u, `${locale}: ${key}`);
      }
    }
  }
});

test("owned pages have no hardcoded Chinese strings and use valid management and root keys", () => {
  for (const directory of [new URL("./", import.meta.url), new URL("../../components/admin/", import.meta.url), new URL("../ExternalLinks/", import.meta.url)]) {
    for (const file of readdirSync(directory).filter((name) => name.endsWith(".tsx") && !excluded.has(name))) {
      const source = readFileSync(new URL(file, directory), "utf8");
      const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node: ts.Node) => {
        if (ts.isStringLiteralLike(node) || ts.isJsxText(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
          assert.doesNotMatch(node.text, /[\u3400-\u9fff]/u, `${file}: ${node.text}`);
        }
        if (ts.isCallExpression(node) && ["m", "t", "tf"].includes(node.expression.getText(ast))) {
          const key = node.arguments[0];
          if (key && ts.isStringLiteral(key) && !key.text.startsWith("adminExtra.")) {
            const dictionaries = key.text.startsWith("adminManagement.") ? catalogs : rootCatalogs;
            for (const [locale, catalog] of Object.entries(dictionaries)) {
              assert.ok(key.text in catalog, `${file}: ${locale} missing ${key.text}`);
            }
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(ast);
    }
  }
});
