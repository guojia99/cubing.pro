export interface Recipe {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  category: string;
  categoryName: string;
  mdPath: string;
  ingredients?: string[];
  hasImage?: boolean;
  coverImage?: string | null;
}

export interface RecipesData {
  recipes: Recipe[];
  categories: string[];
}

export const CATEGORY_NAMES: Record<string, string> = {
  aquatic: '水产',
  breakfast: '早餐',
  condiment: '调味料',
  dessert: '甜品',
  drink: '饮料',
  'meat_dish': '荤菜',
  'semi-finished': '半成品',
  soup: '汤',
  staple: '主食',
  template: '模板',
  vegetable_dish: '素菜',
};
