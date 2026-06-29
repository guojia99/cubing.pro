import type { Recipe } from "../types";

export function getRecipeDisplayName(recipe: Recipe): string {
  return recipe.title.replace(/的做法$/, "");
}

export const RECIPES_JSON = "/recipes.json";
export const RECIPES_DATA_SOURCE_URL = "https://github.com/Anduin2017/HowToCook";
export const MAX_RECIPE_FAVORITES = 20;
export const MAX_RECIPE_TONIGHT = 20;
export const RECIPE_PAGE_SIZE = 15;
