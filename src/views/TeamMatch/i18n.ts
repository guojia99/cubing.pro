import { isLocale, type Locale } from '@/i18n/locales';
import { formatMessage } from '@/i18n/formatMessage';
import { useI18n } from '@/contexts/I18nProvider';
import { useCallback } from 'react';
import {
  teamMatchZhCN, teamMatchEnUS, teamMatchJa, teamMatchYue,
  teamMatchKo, teamMatchFr, teamMatchEs,
} from '@/i18n/messages/team-match';

export type TeamMatchLocale = Locale | 'ja' | 'ja-JP' | 'yue' | 'yue-HK' | 'ko' | 'ko-KR' | 'fr' | 'fr-FR' | 'es' | 'es-ES';
export type TeamMatchKey = keyof typeof teamMatchZhCN;
const catalogs: Record<Locale, Record<TeamMatchKey, string>> = {
  'zh-CN': teamMatchZhCN, 'en-US': teamMatchEnUS,
  ja: teamMatchJa, 'yue-Hant-HK': teamMatchYue,
  ko: teamMatchKo, fr: teamMatchFr, es: teamMatchEs,
};
const aliases: Partial<Record<TeamMatchLocale, Locale>> = {
  'ja-JP': 'ja', yue: 'yue-Hant-HK', 'yue-HK': 'yue-Hant-HK',
  'ko-KR': 'ko', 'fr-FR': 'fr', 'es-ES': 'es',
};

/** Local catalogs also work before the root catalog is wired by the host. */
export function tm(locale: TeamMatchLocale, key: TeamMatchKey, params?: Record<string, string | number>): string {
  const normalized = isLocale(locale) ? locale : (Object.hasOwn(aliases, locale) ? aliases[locale] : undefined) ?? 'zh-CN';
  const text = Object.hasOwn(catalogs[normalized], key) ? catalogs[normalized][key] : key;
  return formatMessage(normalized, key, text, params);
}

export function useTeamMatchI18n() {
  const { locale } = useI18n();
  const t = useCallback((key: TeamMatchKey, params?: Record<string, string | number>) => tm(locale, key, params), [locale]);
  return { locale, t };
}
