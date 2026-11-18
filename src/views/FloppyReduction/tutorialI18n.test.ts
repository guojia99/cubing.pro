import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

import { SUPPORTED_LOCALES } from "../../i18n/locales";
import * as tutorial from "../../i18n/messages/tutorial-extra";
import {
  FORMULA_FONT_FAMILY_IDS,
  getFormulaFontFamily,
  getFormulaFontFamilyCSSValue,
  getFormulaFontFamilyLabel,
  setFormulaFontFamily,
} from "../Algs/utils/formulaFontFamily";
import {
  algTable,
  cornerCases,
  edgeCases,
  tutorialCases,
  TUTORIAL_SPECIAL_40_0,
  tutorialSpecialNotes,
} from "./utils/caseData";

const catalogs = [
  tutorial.tutorialExtraZhCN,
  tutorial.tutorialExtraEnUS,
  tutorial.tutorialExtraJa,
  tutorial.tutorialExtraYue,
  tutorial.tutorialExtraKo,
  tutorial.tutorialExtraFr,
  tutorial.tutorialExtraEs,
];

test("all seven catalogs have complete, nonempty translations", () => {
  const keys = Object.keys(catalogs[0]) as tutorial.TutorialExtraKey[];
  for (const catalog of catalogs) {
    assert.deepEqual(Object.keys(catalog), keys);
    for (const key of keys) {
      assert.ok(catalog[key].trim(), key);
      assert.doesNotMatch(catalog[key], /TODO|FIXME|\[translate\]/i);
    }
  }
  for (const locale of SUPPORTED_LOCALES) {
    for (const item of [...cornerCases, ...edgeCases, ...tutorialCases, TUTORIAL_SPECIAL_40_0]) {
      assert.ok(tutorial.translateTutorialExtra(locale.key, item.descriptionKey));
    }
    assert.ok(tutorial.translateTutorialExtra(locale.key, tutorialSpecialNotes));
  }
  // Proper font names may match English; instructional prose must be translated.
  for (const catalog of catalogs.slice(2)) {
    for (const key of keys.filter((key) => key.startsWith("tutorialExtra.fr.") && tutorial.tutorialExtraEnUS[key].length > 30)) {
      assert.notEqual(catalog[key], tutorial.tutorialExtraEnUS[key], key);
    }
  }
});

test("all tutorial algorithms and inverse setups stay intact", () => {
  assert.deepEqual(tutorialCases.map(({ label, alg }) => [label, alg]), [
    ["4-0 / 1", "U2"],
    ["3-1 / 2FB", "R2 U2"],
    ["2-2a / 2FB", "F2 R2 U2"],
    ["2-2a / 2RL", "R2 F2 U2"],
    ["2-2o / 1", "R2 L2 U2"],
    ["3-1 / 1", "F2 R2 F2 U2"],
    ["4-0 / 2FB", "R2 F2 R2 F2 U2"],
    ["4-0 / 2RL", "F2 R2 F2 R2 U2"],
    ["2-2o / 2FB", "L2 F2 R2 F2 U2"],
    ["2-2o / 2RL", "F2 L2 F2 R2 U2"],
    ["3-1 / 2RL", "L2 F2 L2 F2 R2 U2"],
    ["2-2a / 1", "F2 L2 F2 L2 F2 R2 U2"],
  ]);
  assert.deepEqual(algTable.map(({ c, alg }) => [c, alg]), tutorialCases.map(({ label, alg }) => [label, alg]));
  for (const item of tutorialCases) {
    assert.equal(item.setup, item.alg.split(" ").reverse().join(" "));
  }
});

test("font IDs and CSS are locale independent, with seven-language labels", () => {
  assert.equal(FORMULA_FONT_FAMILY_IDS.length, 15);
  for (const id of FORMULA_FONT_FAMILY_IDS) {
    const css = getFormulaFontFamilyCSSValue(id);
    assert.ok(css.length > 0);
    for (const locale of SUPPORTED_LOCALES) {
      assert.equal(getFormulaFontFamilyLabel(id, locale.key), tutorial.translateTutorialExtra(locale.key, `tutorialExtra.font.${id}`));
      assert.equal(getFormulaFontFamilyCSSValue(id), css);
    }
  }
});

test("font selection keeps the existing storage key and values", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const stored = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => stored.set(key, value),
    },
  });
  try {
    assert.equal(getFormulaFontFamily(), "monospace");
    for (const id of FORMULA_FONT_FAMILY_IDS) {
      setFormulaFontFamily(id);
      assert.equal(stored.get("algs_formula_font_family"), id);
      assert.equal(getFormulaFontFamily(), id);
    }
    stored.set("algs_formula_font_family", "invalid");
    assert.equal(getFormulaFontFamily(), "monospace");
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});

test("SQ1 presets preserve existing stable values and shape strings", () => {
  const text = readFileSync(new URL("../DrawTools/SQ1DrawView.tsx", import.meta.url), "utf8");
  const source = ts.createSourceFile("SQ1DrawView.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let presets: string[][] = [];
  const labelKeys: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === "cspMap") {
      const initializer = node.initializer as ts.NewExpression;
      const entries = initializer.arguments?.[0] as ts.ArrayLiteralExpression;
      presets = entries.elements.map((entry) => (entry as ts.ArrayLiteralExpression).elements.map((value) => (value as ts.StringLiteral).text));
    }
    if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.initializer) && node.initializer.text.startsWith("tutorialExtra.sq1.")) {
      labelKeys.push(node.initializer.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.deepEqual(presets, [
    ["星 Star", "cccccc"], ["风筝 Kite", "ececcece"], ["方 Square", "ecececec"],
    ["贝壳 Scallop", "eeccccee"], ["蘑菇 Mushroom", "ecceccee"],
    ["右爪 R Paw", "eecccece"], ["左爪 L Paw", "ececccee"],
    ["右拳 R Fist", "ececceec"], ["左拳 L Fist", "ceeccece"],
    ["盾 Shield", "eeccceec"], ["桶 Barrel", "ceecceec"], ["对 Twins", "cceeccc"],
    ["8", "eeeecceeee"], ["71", "eeececeeee"], ["62", "eeeceeceee"],
    ["53", "eeceeeceee"], ["44", "eeceeeecee"], ["6", "eeccceeee"],
    ["51R", "eeeeccece"], ["51L", "ececceeee"], ["411", "ecececeee"],
    ["42R", "eeeecceec"], ["42L", "ceecceeee"], ["33", "eeeceeecc"],
    ["321", "ececeeece"], ["312", "eeececeec"], ["222", "ceeceecee"],
    ["L", "cececcc"], ["I", "ecceccc"],
  ]);
  assert.equal(labelKeys.length, 12);
  for (const key of labelKeys) assert.ok(key in tutorial.tutorialExtraZhCN);
  assert.doesNotMatch(text, /setCpsOpt|setTopCspOptions|setDownCspOptions/);
  assert.match(text, /storageKey="sq1Draw"/);
  assert.match(text, /storageKey="sq1DrawDouble"/);
});
