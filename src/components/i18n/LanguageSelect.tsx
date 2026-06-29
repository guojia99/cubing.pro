"use client";

import { IconButton } from "@chakra-ui/react";
import { RiTranslateAi } from "react-icons/ri";

import { useI18n } from "@/contexts/I18nProvider";
import type { Locale } from "@/i18n";

export function LanguageSelect() {
  const { locale, setLocale, t } = useI18n();

  const toggleLocale = () => {
    const next: Locale = locale === "zh-CN" ? "en-US" : "zh-CN";
    setLocale(next);
  };

  return (
    <IconButton
      onClick={toggleLocale}
      variant="ghost"
      aria-label={t("lang.label")}
      size="sm"
      css={{
        _icon: {
          width: "5",
          height: "5",
        },
      }}
    >
      <RiTranslateAi />
    </IconButton>
  );
}
