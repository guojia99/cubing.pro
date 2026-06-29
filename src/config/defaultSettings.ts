/**
 * 站点默认布局配置 — 对齐原 Umi defaultSettings（顶栏布局）
 * @see docs/project/app-and-config.md
 */

export const defaultSettings = {
  navTheme: "light" as const,
  layout: "top" as const,
  contentWidth: "Fluid" as const,
  fixedHeader: true,
  locale: "zh-CN" as const,
  supportedLocales: ["zh-CN", "en-US"] as const,
};

export const siteMeta = {
  name: "Cubing Pro",
  version: "4.0.0",
  apiPrefix: "/v3/cube-api",
};
