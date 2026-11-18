/**
 * 站点默认布局配置 — 对齐原 Umi defaultSettings（顶栏布局）
 * @see docs/project/app-and-config.md
 */

import { SUPPORTED_LOCALES } from "@/i18n/locales";

export const defaultSettings = {
  navTheme: "light" as const,
  layout: "top" as const,
  contentWidth: "Fluid" as const,
  fixedHeader: true,
  locale: "zh-CN" as const,
  supportedLocales: SUPPORTED_LOCALES.map(({ key }) => key),
};

export const siteMeta = {
  name: "Cubing Pro",
  version: "4.0.0",
  apiPrefix: "/v3/cube-api",
};
