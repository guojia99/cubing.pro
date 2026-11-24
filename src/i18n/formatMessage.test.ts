import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { build } from "esbuild";
import { chromium } from "playwright";
import { catalogs, translate, translateWithParams, type MessageKey } from "./index";
import { formatMessage } from "./formatMessage";
import { SUPPORTED_LOCALES, type Locale } from "./locales";
import { pluralFragments, pluralMessages } from "./plurals";
import { translateShared, sharedEnUS } from "./messages/shared";
import { translatePuzzleExtra } from "./messages/puzzle-extra";
import { translateWcaPuzzleExtra } from "./messages/wca-puzzle-extra";
import { translateDomain, formatRoundName } from "./messages/domain";
import { getSiteContent } from "./messages/site-content";
import { tDetail, type DetailMessageKey } from "./messages/two-solver-detail";
import { tm, type TeamMatchLocale } from "../views/TeamMatch/i18n";
import { competitionPublicMessage } from "../views/Competition/i18n";

const root = fileURLToPath(new URL("../../", import.meta.url));
const dollars = "$& $$ $` $' {count} {status} R U R' 00:01.230 001";
const parameters = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]);

test("formatMessage selects grammar before one-pass literal interpolation", () => {
  for (const [locale, expected] of [
    ["en-US", ["0 seconds", "1 second", "2 seconds", "0.5 seconds", "1.5 seconds", "1000000 seconds"]],
    ["fr", ["0 seconde", "1 seconde", "2 secondes", "0.5 seconde", "1.5 seconde", "1000000 secondes"]],
    ["es", ["0 segundos", "1 segundo", "2 segundos", "0.5 segundos", "1.5 segundos", "1000000 segundos"]],
  ] as const) {
    for (const [index, count] of [0, 1, 2, 0.5, 1.5, 1e6].entries()) {
      const key = "two.main.seconds";
      assert.equal(formatMessage(locale, key, catalogs[locale][key], { count }), expected[index]);
      assert.equal(translateWithParams(locale, key, { count }), expected[index]);
    }
    assert.equal(formatMessage(locale, "two.main.seconds", catalogs[locale]["two.main.seconds"], { count: "1" }), catalogs[locale]["two.main.seconds"].replace("{count}", "1"));
  }
  assert.equal(formatMessage("en-US", "teamMatch.sessionSummary", "{count} teams · {status}", { count: 1, status: dollars }), `1 team · ${dollars}`);
  assert.equal(formatMessage("en-US", "teamMatch.teamTotal", "{name}: total {total}", { name: "{total}", total: dollars }), `{total}: total ${dollars}`);
  assert.equal(formatMessage("fr", "domain.event.cube", "{size}×{size}×{size} Cube", { size: "001" }), "001×001×001 Cube");
  assert.equal(formatMessage("en-US", "teamMatch.records", "{count} records"), "{count} records");
});

test("real root tf formats all registered plural keys with 1 and 2 while plain t stays raw", () => {
  const keys = [...Object.keys(pluralMessages), ...Object.keys(pluralFragments)] as MessageKey[];
  assert.equal(new Set(keys).size, 118);
  for (const { key: locale } of SUPPORTED_LOCALES) {
    for (const key of keys) {
      const source = catalogs[locale][key];
      assert.equal(translate(locale, key), source);
      for (const count of [1, 2]) {
        const params = Object.fromEntries(parameters(source).map(name => [name, count]));
        const result = translateWithParams(locale, key, params);
        assert.equal(result, formatMessage(locale, key, source, params), `${locale}:${key}:${count}`);
        assert.doesNotMatch(result, /\{\w+\}/, `${locale}:${key}:${count}`);
      }
    }
  }
});

test("independent pure entry points produce singular/plural sentences", () => {
  for (const count of [1, 2]) {
    const s = count === 1 ? "" : "s";
    assert.equal(tm("en-US", "teamMatch.records", { count }), `${count} record${s}`);
    assert.equal(tm("fr", "teamMatch.records", { count }), `${count} entrée${s}`);
    assert.equal(tm("es", "teamMatch.records", { count }), `${count} registro${s}`);
    assert.equal(translateShared("fr", "shared.error.payloadLimit", { limit: count }), `Les données dépassent la limite de ${count} octet${s}`);
    assert.equal(translatePuzzleExtra("en-US", "puzzleExtra.filterWidth", { width: count }), `Filter width ${count} pixel${s}`);
    assert.equal(translateWcaPuzzleExtra("en-US", "wcaPuzzleExtra.groups", { count }), `${count} group${s}`);
    assert.equal(translateDomain("fr", "domain.event.sliding", { count }), `Taquin à ${count} case${s}`);
    assert.equal(tDetail("en-US", "two.detail.solutionSummary", { moves: count, caseName: "CLL" }), `CLL · ${count} move${s}`);
    // Round numbers are labels, not cardinal quantities.
    assert.equal(competitionPublicMessage("en-US", "competitionPublic.intermediateRound", { count }), `Intermediate round ${count}`);
    assert.equal(formatRoundName(`Round ${count}`, "fr"), `Tour ${count}`);
  }
  assert.equal(tm("fr", "teamMatch.records", { count: 0 }), "0 entrée");
  assert.equal(translateShared("fr", "shared.error.payloadLimit", { limit: 0 }), "Les données dépassent la limite de 0 octet");
  assert.equal(translatePuzzleExtra("fr", "puzzleExtra.filterWidth", { width: 0 }), "Largeur des filtres : 0 pixel");
  assert.equal(translateWcaPuzzleExtra("fr", "wcaPuzzleExtra.groups", { count: 0 }), "0 groupe");
  assert.equal(translateDomain("fr", "domain.event.sliding", { count: 0 }), "Taquin à 0 case");
});

test("shipped TeamMatch and puzzle aliases keep grammar and catalog selection aligned", () => {
  const aliases: readonly (readonly [TeamMatchLocale, Locale])[] = [
    ["ja-JP", "ja"], ["yue", "yue-Hant-HK"], ["yue-HK", "yue-Hant-HK"],
    ["ko-KR", "ko"], ["fr-FR", "fr"], ["es-ES", "es"],
  ];
  for (const [alias, locale] of aliases) {
    for (const count of [0, 1, 2, "1"]) {
      assert.equal(tm(alias, "teamMatch.records", { count }), tm(locale, "teamMatch.records", { count }));
      assert.equal(translatePuzzleExtra(alias, "puzzleExtra.filterWidth", { width: count }), translatePuzzleExtra(locale, "puzzleExtra.filterWidth", { width: count }));
    }
  }
  for (const locale of ["unknown", "__proto__", "constructor"]) {
    assert.equal(tm(locale as TeamMatchLocale, "teamMatch.records", { count: 1 }), tm("zh-CN", "teamMatch.records", { count: 1 }));
    assert.equal(translatePuzzleExtra(locale, "puzzleExtra.filterWidth", { width: 1 }), translatePuzzleExtra("zh-CN", "puzzleExtra.filterWidth", { width: 1 }));
    assert.equal(getSiteContent(locale)("siteContent.slide", { count: 1 }), getSiteContent("zh-CN")("siteContent.slide", { count: 1 }));
    assert.equal(translateShared(locale, "shared.error.http", { status: "001" }), translateShared("zh-CN", "shared.error.http", { status: "001" }));
  }
});

test("ordinary messages remain raw through every standalone dictionary entry point", () => {
  for (const { key: locale } of SUPPORTED_LOCALES) {
    assert.equal(tm(locale, "teamMatch.add"), catalogs[locale]["teamMatch.add"]);
    assert.equal(competitionPublicMessage(locale, "competitionPublic.final"), catalogs[locale]["competitionPublic.final"]);
    assert.equal(translateShared(locale, "shared.error.http"), catalogs[locale]["shared.error.http"]);
    assert.equal(translatePuzzleExtra(locale, "puzzleExtra.filterWidth"), catalogs[locale]["puzzleExtra.filterWidth"]);
    assert.equal(translateWcaPuzzleExtra(locale, "wcaPuzzleExtra.groups"), catalogs[locale]["wcaPuzzleExtra.groups"]);
    assert.equal(translateDomain(locale, "domain.event.sliding"), catalogs[locale]["domain.event.sliding"]);
    assert.equal(getSiteContent(locale)("siteContent.slide"), catalogs[locale]["siteContent.slide"]);
    assert.equal(tDetail(locale, "two.detail.current", {}, key => catalogs[locale][key]), catalogs[locale]["two.detail.current"]);
  }
});

test("all independent entry points keep strings, dollars and inserted placeholders literal", () => {
  for (const { key: locale } of SUPPORTED_LOCALES) {
    assert.equal(tm(locale, "teamMatch.teamTotal", { name: "{total}", total: dollars }), formatMessage(locale, "teamMatch.teamTotal", catalogs[locale]["teamMatch.teamTotal"], { name: "{total}", total: dollars }));
    assert.equal(getSiteContent(locale)("siteContent.slide", { count: dollars }), catalogs[locale]["siteContent.slide"].replace("{count}", () => dollars));
    assert.equal(competitionPublicMessage(locale, "competitionPublic.diagramAlt", { scramble: dollars }), catalogs[locale]["competitionPublic.diagramAlt"].replace("{scramble}", () => dollars));
    assert.equal(translateShared(locale, "shared.error.http", { status: dollars }), catalogs[locale]["shared.error.http"].replace("{status}", () => dollars));
    assert.equal(translatePuzzleExtra(locale, "puzzleExtra.filterWidth", { width: "001" }), catalogs[locale]["puzzleExtra.filterWidth"].replace("{width}", "001"));
    assert.equal(translateWcaPuzzleExtra(locale, "wcaPuzzleExtra.groups", { count: "1" }), catalogs[locale]["wcaPuzzleExtra.groups"].replace("{count}", "1"));
    assert.equal(translateDomain(locale, "domain.event.sliding", { count: "1" }), catalogs[locale]["domain.event.sliding"].replace("{count}", "1"));
  }
  const inherited = Object.create({ status: "inherited" });
  assert.equal(translateShared("en-US", "shared.error.http", inherited), sharedEnUS["shared.error.http"]);
  assert.equal(formatMessage("en-US", "teamMatch.teamTotal", "{name}/{total}/{missing}", { name: dollars, total: 0 }), `${dollars}/0/{missing}`);
});

test("tDetail retains seven-language translator injection and the local bilingual fallback", () => {
  for (const { key: locale } of SUPPORTED_LOCALES) {
    for (const moves of [0, 1, 2, "1"]) {
      const key = "two.detail.solutionSummary";
      const params = { moves, caseName: dollars };
      const seen: DetailMessageKey[] = [];
      const actual = tDetail(locale, key, params, requested => {
        seen.push(requested);
        return catalogs[locale][requested];
      });
      assert.deepEqual(seen, [key]);
      assert.equal(actual, translateWithParams(locale, key, params));
    }
    assert.equal(tDetail(locale, "two.detail.rawTime", { time: "00:01.230" }, key => catalogs[locale][key]), catalogs[locale]["two.detail.rawTime"].replace("{time}", "00:01.230"));
    if (locale !== "en-US") assert.equal(tDetail(locale, "two.detail.solutionSummary", { moves: 1, caseName: "CLL" }), tDetail("zh-CN", "two.detail.solutionSummary", { moves: 1, caseName: "CLL" }));
  }
});

test("dictionary formatters bundle without any runtime root or React dependency", async () => {
  const result = await build({
    absWorkingDir: root,
    stdin: { contents: `export { formatMessage } from './src/i18n/formatMessage';
      export * from './src/i18n/messages/shared';
      export * from './src/i18n/messages/puzzle-extra';
      export * from './src/i18n/messages/wca-puzzle-extra';
      export * from './src/i18n/messages/domain';
      export * from './src/i18n/messages/two-solver-detail';
      export * from './src/i18n/messages/site-content';`, resolveDir: root },
    bundle: true, write: false, metafile: true, platform: "node", format: "esm",
  });
  assert.ok(result.metafile);
  for (const input of Object.keys(result.metafile.inputs)) {
    assert.doesNotMatch(input, /(?:src\/i18n\/index\.ts|node_modules\/react\/|I18nProvider)/, input);
  }
  for (const file of ["../views/TeamMatch/i18n.ts", "../views/Competition/i18n.ts", "../views/admin/useAdminExtra.ts", "../views/admin/useAdminManagement.ts"]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.match(source, /formatMessage\(/, file);
    assert.doesNotMatch(source, /import\s+(?!type\b)[^;]*from\s+["']@\/i18n["']/, file);
    assert.doesNotMatch(source, /replaceAll|\.replace\(/, file);
  }
});

test("actual admin and view hooks use shared formatting in a browser provider", { timeout: 60_000 }, async () => {
  // Mount the real provider/hooks; do not call React hooks directly in Node.
  // Everything is bundled in memory and served by Playwright, with no backend.
  const bundle = await build({
    absWorkingDir: root,
    stdin: { contents: `
      import { createElement, useEffect } from 'react';
      import { createRoot } from 'react-dom/client';
      import { I18nProvider, useI18n } from '@/contexts/I18nProvider';
      import { useAdminExtra } from '@/views/admin/useAdminExtra';
      import { useAdminManagement } from '@/views/admin/useAdminManagement';
      import { useTeamMatchI18n } from '@/views/TeamMatch/i18n';
      import { useCompetitionPublicI18n } from '@/views/Competition/i18n';
      function Probe() {
        const intl = useI18n();
        const extra = useAdminExtra();
        const management = useAdminManagement();
        const team = useTeamMatchI18n();
        const competition = useCompetitionPublicI18n();
        useEffect(() => {
          globalThis.i18nProbe = { ...intl, extra, management, team, competition };
        }, [intl, extra, management, team, competition]);
        return null;
      }
      createRoot(document.getElementById('root')).render(createElement(I18nProvider, null, createElement(Probe)));
    `, resolveDir: root, loader: "tsx" },
    bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
  });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", route => route.fulfill({ contentType: "text/html", body: '<div id="root"></div>' }));
    await page.goto("http://i18n.test/");
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.waitForFunction("globalThis.i18nProbe?.locale === 'zh-CN'");
    for (const { key: locale } of SUPPORTED_LOCALES) {
      await page.evaluate(`globalThis.i18nProbe.setLocale(${JSON.stringify(locale)})`);
      await page.waitForFunction(`globalThis.i18nProbe.locale === ${JSON.stringify(locale)}`);
      const result = await page.evaluate(`(() => {
        const { extra, management, team, competition } = globalThis.i18nProbe;
        return [0, 1, 2, '1'].map(count => ({
          count,
          extra: extra.t('adminExtra.confirmBatchEntry', { count }),
          management: management('adminManagement.pinLimit', { count }),
          team: team.t('teamMatch.records', { count }),
          public: competition.p('competitionPublic.intermediateRound', { count }),
          dollar: extra.t('adminExtra.renameFailed', { error: ${JSON.stringify(dollars)} }),
          managementDollar: management('adminManagement.permissionsTitle', { name: '{cubeId}', cubeId: ${JSON.stringify(dollars)} }),
          legacy: extra.text('复赛第2轮'),
          unknown: extra.text('Organizer custom round 001'),
          event: extra.eventName('333'),
          round: competition.round('Round 1'),
        }));
      })()`) as { count: string | number; extra: string; management: string; team: string; public: string; dollar: string; managementDollar: string; legacy: string; unknown: string; event: string; round: string }[];
      for (const row of result) {
        assert.equal(row.extra, translateWithParams(locale, "adminExtra.confirmBatchEntry", { count: row.count }));
        assert.equal(row.management, translateWithParams(locale, "adminManagement.pinLimit", { count: row.count }));
        assert.equal(row.team, tm(locale, "teamMatch.records", { count: row.count }));
        assert.equal(row.public, competitionPublicMessage(locale, "competitionPublic.intermediateRound", { count: row.count }));
        assert.equal(row.dollar, translateWithParams(locale, "adminExtra.renameFailed", { error: dollars }));
        assert.equal(row.managementDollar, translateWithParams(locale, "adminManagement.permissionsTitle", { name: "{cubeId}", cubeId: dollars }));
        assert.equal(row.legacy, translateWithParams(locale, "adminExtra.intermediateRound", { count: "2" }));
        assert.equal(row.unknown, "Organizer custom round 001");
        assert.equal(row.event, translate(locale, "adminExtra.event333"));
        assert.equal(row.round, translateWithParams(locale, "domain.round.numbered", { count: "1" }));
      }
      if (locale === "en-US") {
        assert.equal(result[1].extra, "Confirm entry of 1 result");
        assert.equal(result[2].extra, "Confirm entry of 2 results");
        assert.equal(result[1].management, "Pin up to 1 link on the home page");
        assert.equal(result[2].management, "Pin up to 2 links on the home page");
      }
      if (locale === "fr") {
        assert.equal(result[0].extra, "Confirmer la saisie de 0 résultat");
        assert.equal(result[0].management, "Épinglez jusqu’à 0 lien sur l’accueil");
        assert.equal(result[3].extra, "Confirmer la saisie de 1 résultats");
      }
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
