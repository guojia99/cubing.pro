"use client";

import { useCallback, useMemo } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import type { MessageKey } from "@/i18n";

/** Umi `useIntl` 兼容层，便于迁移 WCA 等 antd 页面 */
export function useIntlMessage() {
  const { t, tf, locale } = useI18n();

  const formatMessage = useCallback(
    (
      descriptor: { id: string },
      values?: Record<string, string | number>,
    ) => {
      const key = descriptor.id as MessageKey;
      if (values && Object.keys(values).length > 0) {
        return tf(key, values);
      }
      return t(key);
    },
    [t, tf],
  );

  return useMemo(
    () => ({ locale, formatMessage }),
    [locale, formatMessage],
  );
}

/** @deprecated 使用 useIntlMessage */
export const useIntl = useIntlMessage;
