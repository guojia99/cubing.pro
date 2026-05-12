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
