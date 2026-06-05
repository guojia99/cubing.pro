import { readStoredLocale } from "@/i18n";

/** 替代 umi `getLocale()`，供迁移模块在客户端读取当前语言 */
export function getLocale(): string {
  if (typeof window === "undefined") return "zh-CN";
  return readStoredLocale();
}
