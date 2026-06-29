export interface Cocktail {
  name: string;
  category: string;
  ingredients: string[];
  method: string[];
  garnish: string[];
  source_url: string;
  slug: string;
  image_url?: string | null;
  image_path?: string | null;
  image_name?: string | null;
  image_error?: string | null;
}

export const COCKTAILS_JSON = "/iba/cocktails.json";
export const MAX_COCKTAIL_FAVORITES = 20;
export const MAX_COCKTAIL_TONIGHT = 20;
export const COCKTAIL_PAGE_SIZE = 15;
