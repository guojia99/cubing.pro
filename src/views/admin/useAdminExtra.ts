"use client";

import { useCallback } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { getIntlLocale } from "@/i18n/locales";
import { formatMessage } from "@/i18n/formatMessage";
import { adminExtraZhCN, adminExtraEnUS, adminExtraJa, adminExtraYue, adminExtraKo, adminExtraFr, adminExtraEs, type AdminExtraKey } from "@/i18n/messages/admin-extra";

const catalogs = { "zh-CN": adminExtraZhCN, "en-US": adminExtraEnUS, ja: adminExtraJa, "yue-Hant-HK": adminExtraYue, ko: adminExtraKo, fr: adminExtraFr, es: adminExtraEs };
const sourceKeys = new Map(Object.entries(adminExtraZhCN).map(([key, text]) => [text, key as AdminExtraKey]));
const eventKeys: Record<string, AdminExtraKey> = {
  "222": "adminExtra.event222", "333": "adminExtra.event333", "444": "adminExtra.event444", "555": "adminExtra.event555", "666": "adminExtra.event666", "777": "adminExtra.event777",
  skewb: "adminExtra.eventSkewb", pyram: "adminExtra.eventPyram", sq1: "adminExtra.eventSq1", minx: "adminExtra.eventMinx", megaminx: "adminExtra.eventMinx", clock: "adminExtra.eventClock",
  "333oh": "adminExtra.eventOH", "333fm": "adminExtra.eventFM", "333bf": "adminExtra.event333BF", "444bf": "adminExtra.event444BF", "555bf": "adminExtra.event555BF", "333mbf": "adminExtra.eventMBF", "333mbf_unlimited": "adminExtra.eventMBFUnlimited", "333ft": "adminExtra.eventFeet", FTO: "adminExtra.eventFTO",
  "2_7relay": "adminExtra.eventRelay27", alien_relay: "adminExtra.eventAlienRelay", "27alien_relay": "adminExtra.eventAllRelay",
};

export function useAdminExtra() {
  const { locale } = useI18n();
  const t = useCallback((key: AdminExtraKey, params: Record<string, string | number> = {}) =>
    formatMessage(locale, key, catalogs[locale][key], params), [locale]);
  // Translate legacy display labels without changing values persisted by the API.
  const text = (value: string) => {
    const key = sourceKeys.get(value);
    if (key) return t(key);
    const round = /^复赛第(\d+)轮$/.exec(value);
    return round ? t("adminExtra.intermediateRound", { count: round[1] }) : value;
  };
  const eventName = (id: string) => eventKeys[id] ? t(eventKeys[id]) : id;
  return { t, text, eventName, intlLocale: getIntlLocale(locale) };
}
