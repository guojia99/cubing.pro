"use client";

import { useCallback } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { formatMessage } from "@/i18n/formatMessage";
import { adminManagementZhCN, adminManagementEnUS, adminManagementJa, adminManagementYue, adminManagementKo, adminManagementFr, adminManagementEs, type AdminManagementKey } from "@/i18n/messages/admin-management";

const catalogs = { "zh-CN": adminManagementZhCN, "en-US": adminManagementEnUS, ja: adminManagementJa, "yue-Hant-HK": adminManagementYue, ko: adminManagementKo, fr: adminManagementFr, es: adminManagementEs };

export function useAdminManagement() {
  const { locale } = useI18n();
  return useCallback((key: AdminManagementKey, params: Record<string, string | number> = {}) =>
    formatMessage(locale, key, catalogs[locale][key], params), [locale]);
}
