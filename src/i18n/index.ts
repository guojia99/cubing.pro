import enUS from "@/i18n/messages/en-US";
import zhCN, { type MessageKey as LegacyMessageKey } from "@/i18n/messages/zh-CN";
import ja from "@/i18n/messages/ja";
import yue from "@/i18n/messages/yue-Hant-HK";
import ko from "@/i18n/messages/ko";
import fr from "@/i18n/messages/fr";
import es from "@/i18n/messages/es";
import { isLocale, type Locale } from "./locales";
import * as team from "./messages/team-match";
import * as competition from "./messages/competition-admin";
import * as puzzle from "./messages/puzzle-extra";
import * as site from "./messages/site-content";
import * as shared from "./messages/shared";
import * as adminExtra from "./messages/admin-extra";
import * as tutorial from "./messages/tutorial-extra";
import * as shell from "./messages/shell";
import * as competitionExtra from "./messages/competition-extra";
import * as competitionPublic from "./messages/competition-public";
import * as domain from "./messages/domain";
import * as wcaPuzzle from "./messages/wca-puzzle-extra";
import * as management from "./messages/admin-management";
import * as finishing from "./messages/finishing";
import { formatMessage } from "./formatMessage";
export { SUPPORTED_LOCALES, LOCALE_STORAGE_KEY, isLocale, getIntlLocale, readStoredLocale, writeStoredLocale } from "./locales";
export type { Locale } from "./locales";

const languageNames = { "lang.ja": "日本語", "lang.yue": "廣東話", "lang.ko": "한국어", "lang.fr": "Français", "lang.es": "Español" };
const additions = {
  "zh-CN": { ...adminExtra.adminExtraZhCN, ...tutorial.tutorialExtraZhCN, ...shell.shellZhCN, ...competitionExtra.competitionExtraZhCN, ...competitionPublic.competitionPublicZhCN, ...domain.domainZhCN, ...wcaPuzzle.wcaPuzzleExtraZhCN, ...management.adminManagementZhCN },
  "en-US": { ...adminExtra.adminExtraEnUS, ...tutorial.tutorialExtraEnUS, ...shell.shellEnUS, ...competitionExtra.competitionExtraEnUS, ...competitionPublic.competitionPublicEnUS, ...domain.domainEnUS, ...wcaPuzzle.wcaPuzzleExtraEnUS, ...management.adminManagementEnUS },
  ja: { ...adminExtra.adminExtraJa, ...tutorial.tutorialExtraJa, ...shell.shellJa, ...competitionExtra.competitionExtraJa, ...competitionPublic.competitionPublicJa, ...domain.domainJa, ...wcaPuzzle.wcaPuzzleExtraJa, ...management.adminManagementJa },
  "yue-Hant-HK": { ...adminExtra.adminExtraYue, ...tutorial.tutorialExtraYue, ...shell.shellYue, ...competitionExtra.competitionExtraYue, ...competitionPublic.competitionPublicYue, ...domain.domainYue, ...wcaPuzzle.wcaPuzzleExtraYue, ...management.adminManagementYue },
  ko: { ...adminExtra.adminExtraKo, ...tutorial.tutorialExtraKo, ...shell.shellKo, ...competitionExtra.competitionExtraKo, ...competitionPublic.competitionPublicKo, ...domain.domainKo, ...wcaPuzzle.wcaPuzzleExtraKo, ...management.adminManagementKo },
  fr: { ...adminExtra.adminExtraFr, ...tutorial.tutorialExtraFr, ...shell.shellFr, ...competitionExtra.competitionExtraFr, ...competitionPublic.competitionPublicFr, ...domain.domainFr, ...wcaPuzzle.wcaPuzzleExtraFr, ...management.adminManagementFr },
  es: { ...adminExtra.adminExtraEs, ...tutorial.tutorialExtraEs, ...shell.shellEs, ...competitionExtra.competitionExtraEs, ...competitionPublic.competitionPublicEs, ...domain.domainEs, ...wcaPuzzle.wcaPuzzleExtraEs, ...management.adminManagementEs },
};
export type MessageKey = LegacyMessageKey | keyof typeof languageNames | keyof typeof team.teamMatchZhCN | keyof typeof competition.competitionAdminZhCN | keyof typeof puzzle.puzzleExtraZhCN | keyof typeof site.siteContentZhCN | keyof typeof shared.sharedZhCN | keyof typeof additions["zh-CN"] | keyof typeof finishing.finishingZhCN;

export const catalogs: Record<Locale, Record<MessageKey, string>> = {
  "zh-CN": { ...zhCN, ...languageNames, ...team.teamMatchZhCN, ...competition.competitionAdminZhCN, ...puzzle.puzzleExtraZhCN, ...site.siteContentZhCN, ...shared.sharedZhCN, ...additions["zh-CN"], ...finishing.finishingZhCN },
  "en-US": { ...enUS, ...languageNames, ...team.teamMatchEnUS, ...competition.competitionAdminEnUS, ...puzzle.puzzleExtraEnUS, ...site.siteContentEnUS, ...shared.sharedEnUS, ...additions["en-US"], ...finishing.finishingEnUS },
  ja: { ...ja, ...languageNames, ...team.teamMatchJa, ...competition.competitionAdminJa, ...puzzle.puzzleExtraJa, ...site.siteContentJa, ...shared.sharedJa, ...additions.ja, ...finishing.finishingJa },
  "yue-Hant-HK": { ...yue, ...languageNames, ...team.teamMatchYue, ...competition.competitionAdminYue, ...puzzle.puzzleExtraYue, ...site.siteContentYue, ...shared.sharedYue, ...additions["yue-Hant-HK"], ...finishing.finishingYue },
  ko: { ...ko, ...languageNames, ...team.teamMatchKo, ...competition.competitionAdminKo, ...puzzle.puzzleExtraKo, ...site.siteContentKo, ...shared.sharedKo, ...additions.ko, ...finishing.finishingKo },
  fr: { ...fr, ...languageNames, ...team.teamMatchFr, ...competition.competitionAdminFr, ...puzzle.puzzleExtraFr, ...site.siteContentFr, ...shared.sharedFr, ...additions.fr, ...finishing.finishingFr },
  es: { ...es, ...languageNames, ...team.teamMatchEs, ...competition.competitionAdminEs, ...puzzle.puzzleExtraEs, ...site.siteContentEs, ...shared.sharedEs, ...additions.es, ...finishing.finishingEs },
};

export function translate(locale: Locale, key: MessageKey): string {
  const catalog = catalogs[isLocale(locale) ? locale : "zh-CN"];
  if (Object.hasOwn(catalog, key)) return catalog[key];
  return Object.hasOwn(catalogs["zh-CN"], key) ? catalogs["zh-CN"][key] : key;
}

export function translateWithParams(
  locale: Locale,
  key: MessageKey,
  params: Record<string, string | number>,
): string {
  return formatMessage(isLocale(locale) ? locale : "zh-CN", key, translate(locale, key), params);
}
