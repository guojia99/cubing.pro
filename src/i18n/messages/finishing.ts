import type { Locale } from "../locales";

// Columns: Simplified Chinese, English, Japanese, Cantonese, Korean, French, Spanish.
const messages = {
  "finishing.organizerOption": ["{name}（ID：{id}）", "{name} (ID: {id})", "{name}（ID：{id}）", "{name}（ID：{id}）", "{name} (ID: {id})", "{name} (ID : {id})", "{name} (ID: {id})"],
  "finishing.downloadJpg": ["下载 JPG", "Download JPG", "JPG をダウンロード", "下載 JPG", "JPG 다운로드", "Télécharger JPG", "Descargar JPG"],
} satisfies Record<string, readonly [string, string, string, string, string, string, string]>;

export type FinishingKey = keyof typeof messages;

function catalog(column: number): Record<FinishingKey, string> {
  return Object.fromEntries(Object.entries(messages).map(([key, values]) => [key, values[column]])) as Record<FinishingKey, string>;
}

export const finishingZhCN = catalog(0);
export const finishingEnUS = catalog(1);
export const finishingJa = catalog(2);
export const finishingYue = catalog(3);
export const finishingKo = catalog(4);
export const finishingFr = catalog(5);
export const finishingEs = catalog(6);

const catalogs: Record<Locale, Record<FinishingKey, string>> = {
  "zh-CN": finishingZhCN,
  "en-US": finishingEnUS,
  ja: finishingJa,
  "yue-Hant-HK": finishingYue,
  ko: finishingKo,
  fr: finishingFr,
  es: finishingEs,
};

export function isFinishingKey(key: string): key is FinishingKey {
  return Object.hasOwn(messages, key);
}

export function translateFinishing(locale: Locale, key: FinishingKey): string {
  return catalogs[locale][key];
}
