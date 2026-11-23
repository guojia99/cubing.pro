import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { catalogs, type MessageKey } from "./index";
import { getIntlLocale, SUPPORTED_LOCALES, type Locale } from "./locales";
import { applyPlural, pluralFragments, pluralMessages } from "./plurals";

const locales = ["en-US", "fr", "es"] as const;
const covered = new Set([...Object.keys(pluralMessages), ...Object.keys(pluralFragments)]);
const values = [0, -0, 1, -1, 2, 0.5, 1.5, 2.1, 1_000_000];
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();

// Reviewed against all 299 parameterized messages in the real merged root.
// These are IDs/ordinals, names, ratios, formulas, percentages or fixed labels.
// Keep an explicit inventory so newly added parameterized messages need review.
const invariantKeys = `
algs.practice.statistics two.main.result.families two.main.status.sampleGenerate
two.main.status.sampleSearch two.main.sampling.conditional two.main.historyReview
two.main.elapsed two.main.holdSpace two.main.timerHint two.main.records
two.main.loadMore two.main.familyDepth two.main.timerFont two.detail.bottomColor
two.detail.copiedFull two.detail.copiedAnnotated two.detail.algorithmLibrary
two.detail.annotationFull two.detail.attempt two.detail.current two.detail.rawTime
two.detail.averages two.detail.date two.detail.scramble two.engine.progress.loading
two.engine.progress.indexing two.engine.worker.loadFailed two.engine.worker.invalidData
two.engine.parser.unsupported algs.formulaPractice.proficiencyRemindDesc
algs.formulaPractice.formulaNavHint algs.formulaPractice.trimRatioDesc
algs.randomPick.countdown algs.practiceConfig.importFailed home.thanks.expand
advertisement.notFoundDesc changelog.frontendCount changelog.backendCount
fr.steps.triggerHint fr.error.parse fr.practice.liveInvalid wca.player.pageTitle
wca.playerDetails.avatarAlt wca.litCities.fullscreenTitle wca.results.noEventResults
wca.milestone.overseasDestinationTag wca.milestone.desc.nth_competition
wca.milestone.desc.improvement_both wca.milestone.desc.improvement_single
wca.milestone.desc.improvement_avg wca.milestone.desc.bld_single
wca.milestone.desc.bld_avg wca.milestone.desc.bld_both wca.milestone.desc.podium_gold
wca.milestone.desc.podium_other wca.milestone.desc.record_single
wca.milestone.desc.record_avg wca.milestone.desc.first_333_average_sub10
wca.milestone.line333Round wca.chart.noRankData wca.chart.attemptN
wca.proportion.ratioToAnchor wca.proportion.inferNote wca.proportion.anchorRange
wca.proportion.algorithmMd teamMatch.wave teamMatch.manualWinner teamMatch.manualAdvance
teamMatch.lastComputed teamMatch.draft teamMatch.teamTotal teamMatch.seedLine
teamMatch.scoreLine teamMatch.sumAverageValue teamMatch.waveNumber teamMatch.naturalByeLine
teamMatch.slotNumber teamMatch.seedPreview teamMatch.rankNumber teamMatch.officialScoreLine
teamMatch.prelimScoreLine teamMatch.uidConflictHelp teamMatch.snapshotLine
teamMatch.editScoresPlayer teamMatch.matchNumber teamMatch.namedTeam
teamMatch.independentTeamAffiliation teamMatch.schoolTeamAffiliation teamMatch.rosterEmptyTeam
teamMatch.rosterEmptyPlayer teamMatch.rosterDuplicatePlayer teamMatch.rosterLineError
teamMatch.currentResultValue teamMatch.numberedSchoolTeam competitionAdmin.inclusiveDay
competitionAdmin.scoreFormat competitionAdmin.minutesSeconds competitionAdmin.positiveScore
competitionAdmin.missingRound competitionAdmin.closedRound competitionAdmin.invalidEventRoute
competitionAdmin.sequentialRounds competitionAdmin.nonnegativeSettings competitionAdmin.roundNumber
competitionAdmin.beijingRange competitionAdmin.attempt puzzleExtra.colorSummary
puzzleExtra.annotation siteContent.enlargeDrink siteContent.hideTags siteContent.showTags
siteContent.slide shared.error.http shared.editor.uploadImgModule.uploadError
adminExtra.approvalTitle adminExtra.competitionNumber adminExtra.rejectedReason
adminExtra.optionsFailed adminExtra.missingResultType adminExtra.playersFailed
adminExtra.deleteHint adminExtra.roundNumber adminExtra.roundAction adminExtra.renameFailed
adminExtra.registeredPlayer adminExtra.approveOneTitle adminExtra.reviewTotal
adminExtra.refreshFailed adminExtra.missingRound adminExtra.attemptNumber
adminExtra.deleteResultTitle adminExtra.roundEligibility adminExtra.roundAdvancement
adminExtra.intermediateRound adminExtra.duplicateEvent adminExtra.invalidNamedEvent
shell.metadata.description competitionExtra.noNemesis competitionPublic.scrambleGroupNumber
competitionPublic.diagramAlt competitionPublic.rankingsHeading competitionPublic.intermediateRound
domain.event.cube domain.event.blind domain.event.oneHanded domain.event.fewestMoves
domain.event.relay domain.event.multiple domain.event.cuboid domain.round.numbered
domain.round.intermediate wcaPuzzleExtra.missingFace wcaPuzzleExtra.invalidColor
wcaPuzzleExtra.unsupportedMove wcaPuzzleExtra.notationInvalid wcaPuzzleExtra.squareNotation
adminManagement.invalidPerson adminManagement.editRanking adminManagement.deleteLinkGroup
adminManagement.deleteSponsor adminManagement.softDeleteConfirm adminManagement.purgeConfirm
adminManagement.userCubeIdTitle adminManagement.userQqTitle adminManagement.userWcaTitle
adminManagement.permissionsTitle adminManagement.mergeUserTitle adminManagement.organizerName
finishing.organizerOption forum.replyTo
`.trim().split(/\s+/);

test("audit covers every parameterized key in the complete root catalogs", () => {
  assert.ok(Object.keys(catalogs["en-US"]).length >= 3379);
  const parameterized = Object.keys(catalogs["en-US"]).filter(key => placeholders(catalogs["en-US"][key as MessageKey]).length);
  const reviewed = [...covered, ...invariantKeys];
  assert.equal(new Set(reviewed).size, reviewed.length, "No duplicate/stale audit classifications");
  assert.deepEqual(reviewed.sort(), parameterized.sort());
});

test("all complete forms use native plural categories and preserve every placeholder", () => {
  for (const [rawKey, entry] of Object.entries(pluralMessages)) {
    const key = rawKey as keyof typeof pluralMessages;
    for (const [index, locale] of locales.entries()) {
      const source = catalogs[locale][key];
      const forms = entry[index + 1] as readonly [string, string];
      assert.ok(placeholders(source).includes(entry[0]), `${key}: missing selector`);
      for (const form of forms) assert.deepEqual(placeholders(form), placeholders(source), `${locale}:${key}`);
      for (const value of values) {
        const category = new Intl.PluralRules(getIntlLocale(locale)).select(value);
        const params = Object.freeze({ [entry[0]]: value });
        const actual = applyPlural(locale, key, source, params);
        assert.equal(actual, forms[category === "one" ? 0 : 1], `${locale}:${key}:${value}`);
        assert.equal(applyPlural(locale, key, actual, params), actual, "Idempotent selection");
      }
    }
  }
});

test("each independent fragment selects correctly in the real root sentence", () => {
  for (const [rawKey, entries] of Object.entries(pluralFragments)) {
    const key = rawKey as keyof typeof pluralFragments;
    for (const [index, locale] of locales.entries()) {
      const source = catalogs[locale][key];
      for (const entry of entries) {
        const forms = entry[index + 1] as readonly [string, string];
        assert.ok(forms.some(form => source.includes(form)), `${locale}:${key}:${entry[0]}: catalog drift`);
        assert.deepEqual(placeholders(forms[0]), placeholders(forms[1]));
        for (const value of values) {
          const category = new Intl.PluralRules(getIntlLocale(locale)).select(value);
          const params = { [entry[0]]: value };
          const result = applyPlural(locale, key, source, params);
          const from = [...forms].sort((a, b) => b.length - a.length).find(form => source.includes(form))!;
          const expected = source.replace(from, () => forms[category === "one" ? 0 : 1]);
          assert.equal(result, expected, `${locale}:${key}:${entry[0]}:${value}`);
          assert.deepEqual(placeholders(result), placeholders(source));
          assert.equal(applyPlural(locale, key, result, params), result);
          assert.ok(applyPlural(locale, key, `$& $$ $' ${source} $\``, params).startsWith("$& $$ $' "));
        }
      }
    }
  }
});

test("all singular/plural combinations compose for multi-quantity messages", () => {
  for (const [rawKey, entries] of Object.entries(pluralFragments)) {
    const key = rawKey as keyof typeof pluralFragments;
    for (const [index, locale] of locales.entries()) {
      for (let mask = 0; mask < 2 ** entries.length; mask += 1) {
        const params = Object.fromEntries(entries.map((entry, i) => [entry[0], mask & (1 << i) ? 2 : 1]));
        let expected = catalogs[locale][key];
        for (const entry of entries) {
          const forms = entry[index + 1] as readonly [string, string];
          const from = [...forms].sort((a, b) => b.length - a.length).find(form => expected.includes(form))!;
          expected = expected.replace(from, () => forms[params[entry[0]] === 1 ? 0 : 1]);
        }
        const result = applyPlural(locale, key, catalogs[locale][key], params);
        assert.equal(result, expected, `${locale}:${key}:${mask}`);
        assert.equal(applyPlural(locale, key, result, params), result);
        const opposite = Object.fromEntries(entries.map(entry => [entry[0], params[entry[0]] === 1 ? 2 : 1]));
        assert.equal(applyPlural(locale, key, result, opposite), applyPlural(locale, key, catalogs[locale][key], opposite), "Changing quantities must reverse every agreement");
      }
    }
  }
});

test("0, 1, 2, fractions and French million use their locale grammar", () => {
  const key = "two.main.seconds";
  const expected = {
    "en-US": ["seconds", "second", "seconds", "seconds", "seconds", "seconds"],
    fr: ["seconde", "seconde", "secondes", "seconde", "seconde", "secondes"],
    es: ["segundos", "segundo", "segundos", "segundos", "segundos", "segundos"],
  };
  for (const locale of locales) {
    for (const [index, count] of [0, 1, 2, 0.5, 1.5, 1e6].entries()) {
      assert.equal(applyPlural(locale, key, catalogs[locale][key], { count }), `{count} ${expected[locale][index]}`);
    }
  }
  assert.equal(new Intl.PluralRules(getIntlLocale("fr")).select(1e6), "many");
});

test("multiple counts vary independently without consuming unrelated parameters", () => {
  assert.equal(applyPlural("fr", "two.engine.progress.searching", catalogs.fr["two.engine.progress.searching"], { nodes: 1, count: 2 }), "Profondeur de base {depth}/{maxDepth} · {nodes} nœud · {count} solutions");
  assert.equal(applyPlural("fr", "competitionAdmin.expectedScores", catalogs.fr["competitionAdmin.expectedScores"], { count: 1, actual: 2 }), "{count} résultat attendu ; {actual} reçus");
  assert.equal(applyPlural("es", "two.detail.annotationSummary", catalogs.es["two.detail.annotationSummary"], { originalMoves: 2, moves: 1 }), "// {method} · Etapas originales · Antes de la cancelación {originalMoves} movimientos → Después de la cancelación {moves} movimiento (excluyendo orientación y rotaciones del cubo)");
  assert.equal(applyPlural("fr", "adminExtra.batchSummary", catalogs.fr["adminExtra.batchSummary"], { total: 2, success: 1, failed: 0 }), "{total} traités : {success} réussite, {failed} échec");
});

test("only finite own numeric selectors affect templates; never coerce IDs or formulas", () => {
  for (const key of covered) {
    for (const locale of locales) {
      const source = catalogs[locale][key as MessageKey];
      const names = placeholders(source);
      for (const value of ["1", "01", "1.0", "1,000", "R U R'", "$& $$ $` $'", "{count}", NaN, Infinity, -Infinity, undefined, null, true]) {
        const params = Object.fromEntries(names.map(name => [name, value]));
        assert.equal(applyPlural(locale, key as MessageKey, source, params as Parameters<typeof applyPlural>[3]), source, `${locale}:${key}:${value}`);
      }
      const inherited = Object.create(Object.fromEntries(names.map(name => [name, 1])));
      assert.equal(applyPlural(locale, key as MessageKey, source, inherited), source);
      assert.equal(applyPlural(locale, key as MessageKey, source, {}), source);
    }
  }
});

test("all East Asian catalogs and all invariant keys remain byte-for-byte unchanged", () => {
  for (const { key: locale } of SUPPORTED_LOCALES) {
    for (const [rawKey, template] of Object.entries(catalogs[locale])) {
      const key = rawKey as MessageKey;
      if (locales.includes(locale as typeof locales[number]) && !invariantKeys.includes(key)) continue;
      const params = Object.fromEntries(placeholders(template).map(name => [name, 1]));
      assert.equal(applyPlural(locale, key, template, params), template, `${locale}:${key}`);
    }
  }
});

test("interpolation remains a separate step and preserves dollars, IDs and timing formats", () => {
  const key = "teamMatch.sessionSummary";
  const params = { count: 1, status: "$& $$ $` $' 00:01.230 001 R U R'" };
  const template = applyPlural("en-US", key, catalogs["en-US"][key], params);
  assert.equal(template, "{count} team · {status}");
  const formatted = template.replace(/\{(\w+)\}/g, (match, name: string) => Object.hasOwn(params, name) ? String(params[name as keyof typeof params]) : match);
  assert.equal(formatted, `1 team · ${params.status}`);
  assert.equal(applyPlural("en-US", "two.engine.ergonomics.regrips", catalogs["en-US"]["two.engine.ergonomics.regrips"], { count: 1 }).startsWith("F2 R' occurs {count} time;"), true);
});

test("unknown/prototype-shaped keys and invalid locales cannot expose inherited data", () => {
  for (const key of ["__proto__", "constructor", "toString", "missing"]) {
    for (const locale of locales) assert.equal(applyPlural(locale, key as MessageKey, "$& {count} 00:01.230", { count: 1 }), "$& {count} 00:01.230");
  }
  for (const locale of ["__proto__", "constructor", "en", null, undefined, Object.create(null)]) {
    assert.equal(applyPlural(locale as Locale, "two.main.seconds", "unchanged {count}", { count: 1 }), "unchanged {count}");
  }
});

test("plural runtime never imports root catalogs or formats protocol/timer numbers", () => {
  const source = readFileSync(new URL("./plurals.ts", import.meta.url), "utf8");
  assert.match(source, /import type \{ MessageKey \} from "\.\/index"/);
  assert.doesNotMatch(source, /import\s+(?!type\b)[^;]*from\s+["'](?:\.\/index|@\/i18n)["']/);
  assert.doesNotMatch(source, /Intl\.NumberFormat|toLocaleString|count\s*===\s*1|Number\(params/);
});
