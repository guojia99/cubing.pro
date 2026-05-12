/** IBA 官方英文分类 → 简体中文（列表筛选与展示用） */
export const COCKTAIL_CATEGORY_ZH: Record<string, string> = {
  'The unforgettables': '难忘经典',
  'Contemporary Classics': '当代经典',
  'New Era': '新纪元',
};

export function getCategoryLabelZh(categoryEn: string): string {
  return COCKTAIL_CATEGORY_ZH[categoryEn] ?? categoryEn;
}
