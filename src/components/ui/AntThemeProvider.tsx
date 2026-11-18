"use client";

import { ConfigProvider, theme } from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import jaJP from "antd/locale/ja_JP";
import zhHK from "antd/locale/zh_HK";
import koKR from "antd/locale/ko_KR";
import frFR from "antd/locale/fr_FR";
import esES from "antd/locale/es_ES";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import "dayjs/locale/zh-hk";
import "dayjs/locale/ja";
import "dayjs/locale/ko";
import "dayjs/locale/fr";
import "dayjs/locale/es";
import { useEffect, useState, type ReactNode } from "react";
import { useI18n } from "@/contexts/I18nProvider";

const initial = {
  dark: false, accent: "#1a8aad", foreground: "#0c3a4d", mutedForeground: "#456574",
  background: "#f7fafb", card: "#ffffff", muted: "#eef4f6", popover: "#ffffff",
};
const locales = { "zh-CN": zhCN, "en-US": enUS, ja: jaJP, "yue-Hant-HK": zhHK, ko: koKR, fr: frFR, es: esES };
const dayjsLocales = { "zh-CN": "zh-cn", "en-US": "en", ja: "ja", "yue-Hant-HK": "zh-hk", ko: "ko", fr: "fr", es: "es" };

export function AntThemeProvider({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  const [colors, setColors] = useState(initial);
  useEffect(() => { dayjs.locale(dayjsLocales[locale]); }, [locale]);

  useEffect(() => {
    const root = document.documentElement;
    const refresh = () => {
      const css = getComputedStyle(root);
      const read = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
      const next = {
        dark: root.classList.contains("dark"),
        accent: read("--accent", initial.accent),
        foreground: read("--foreground", initial.foreground),
        mutedForeground: read("--muted-foreground", initial.mutedForeground),
        background: read("--background", initial.background),
        card: read("--card", initial.card),
        muted: read("--muted", initial.muted),
        popover: read("--popover", initial.popover),
      };
      setColors((previous) => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(root, { attributes: true, attributeFilter: ["class", "data-palette", "style"] });
    return () => observer.disconnect();
  }, []);

  return (
    <ConfigProvider locale={locales[locale]} button={{ autoInsertSpace: false }} theme={{
      cssVar: { key: "cubing" },
      algorithm: colors.dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: colors.accent, colorInfo: colors.accent,
        colorText: colors.foreground, colorTextSecondary: colors.mutedForeground,
        colorBgBase: colors.background, colorBgContainer: colors.card,
        colorBgElevated: colors.popover, colorFillAlter: colors.muted,
        colorBorder: colors.dark ? "rgba(230,243,248,.16)" : "rgba(12,58,77,.12)",
        colorBorderSecondary: colors.dark ? "rgba(230,243,248,.09)" : "rgba(12,58,77,.07)",
        borderRadius: 12, borderRadiusLG: 16, controlHeight: 40,
        fontFamily: '"Avenir Next", "Trebuchet MS", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: 14, lineHeight: 1.65,
        boxShadow: "0 8px 32px rgba(12,58,77,.10)",
        boxShadowSecondary: "0 4px 20px rgba(12,58,77,.07)",
      },
      components: {
        Table: { headerBg: colors.muted, headerColor: colors.mutedForeground, rowHoverBg: colors.muted, headerSplitColor: "transparent", cellPaddingBlock: 14 },
        Card: { headerBg: "transparent" },
        Modal: { contentBg: colors.card, headerBg: colors.card },
        Tabs: { horizontalItemGutter: 24 },
        Button: { primaryShadow: "none", defaultShadow: "none", fontWeight: 600 },
        Segmented: { trackBg: colors.muted, itemSelectedBg: colors.card },
      },
    }}>{children}</ConfigProvider>
  );
}
