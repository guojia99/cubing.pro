"use client";

import { useCallback, useMemo } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import type { MessageKey } from "@/i18n";
import { isSharedMessageKey, translateShared } from "@/i18n/messages/shared";

/** Umi `useIntl` 兼容层，便于迁移 WCA 等 antd 页面 */
export function useIntlMessage() {
  const { t, tf, locale } = useI18n();

  const formatMessage = useCallback(
    (
      descriptor: { id: string; defaultMessage?: string },
      values?: Record<string, string | number>,
    ) => {
      if (isSharedMessageKey(descriptor.id)) {
        return translateShared(locale, descriptor.id, values);
      }
      const key = descriptor.id as MessageKey;
      const translated = t(key);
      if (translated === key && descriptor.defaultMessage) {
        return descriptor.defaultMessage.replace(/\{(\w+)\}/g, (token, name: string) => String(values?.[name] ?? token));
      }
      return values && Object.keys(values).length > 0 ? tf(key, values) : translated;
    },
    [t, tf, locale],
  );

  return useMemo(
    () => ({ locale, formatMessage }),
    [locale, formatMessage],
  );
}

/** @deprecated 使用 useIntlMessage */
export const useIntl = useIntlMessage;
