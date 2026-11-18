import type { Locale } from "../locales";

// Columns: Simplified Chinese, English, Japanese, Cantonese, Korean, French, Spanish.
const messages = {
  "finishing.organizerOption": ["{name}（ID：{id}）", "{name} (ID: {id})", "{name}（ID：{id}）", "{name}（ID：{id}）", "{name} (ID: {id})", "{name} (ID : {id})", "{name} (ID: {id})"],
  "finishing.recipeCategory.aquatic": ["水产", "Seafood", "魚介料理", "海鮮", "해산물", "Poissons et fruits de mer", "Pescados y mariscos"],
  "finishing.recipeCategory.breakfast": ["早餐", "Breakfast", "朝食", "早餐", "아침 식사", "Petit-déjeuner", "Desayunos"],
  "finishing.recipeCategory.condiment": ["调味料", "Condiments", "調味料", "調味料", "양념", "Condiments", "Condimentos"],
  "finishing.recipeCategory.dessert": ["甜品", "Desserts", "デザート", "甜品", "디저트", "Desserts", "Postres"],
  "finishing.recipeCategory.drink": ["饮料", "Drinks", "飲み物", "飲品", "음료", "Boissons", "Bebidas"],
  "finishing.recipeCategory.meat_dish": ["荤菜", "Meat dishes", "肉料理", "葷菜", "고기 요리", "Plats de viande", "Platos de carne"],
  "finishing.recipeCategory.semi-finished": ["半成品", "Preparations", "下ごしらえ", "半成品", "반조리 식품", "Préparations", "Preparaciones"],
  "finishing.recipeCategory.soup": ["汤", "Soups", "スープ", "湯", "국과 수프", "Soupes", "Sopas"],
  "finishing.recipeCategory.staple": ["主食", "Staple dishes", "主食", "主食", "주식", "Plats de base", "Platos básicos"],
  "finishing.recipeCategory.template": ["模板", "Templates", "テンプレート", "範本", "템플릿", "Modèles", "Plantillas"],
  "finishing.recipeCategory.vegetable_dish": ["素菜", "Vegetable dishes", "野菜料理", "素菜", "채소 요리", "Plats de légumes", "Platos de verduras"],
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
