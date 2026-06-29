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
