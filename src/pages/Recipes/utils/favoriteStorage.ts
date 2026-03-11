const STORAGE_KEY = 'cubing-pro-recipes-favorites';
const MAX_FAVORITES = 20;

export interface FavoriteRecipe {
  category: string;
  id: string;
}

export function getFavorites(): FavoriteRecipe[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_FAVORITES) : [];
  } catch {
    return [];
  }
}

export function saveFavorites(list: FavoriteRecipe[]) {
  const trimmed = list.slice(0, MAX_FAVORITES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function isFavorite(category: string, id: string): boolean {
  const list = getFavorites();
  return list.some((f) => f.category === category && f.id === id);
}

export function addFavorite(category: string, id: string): boolean {
  const list = getFavorites();
  if (list.some((f) => f.category === category && f.id === id)) return false;
  if (list.length >= MAX_FAVORITES) return false;
  list.push({ category, id });
  saveFavorites(list);
  return true;
}

export function removeFavorite(category: string, id: string): boolean {
  const list = getFavorites().filter((f) => !(f.category === category && f.id === id));
  if (list.length === getFavorites().length) return false;
  saveFavorites(list);
  return true;
}

export function toggleFavorite(category: string, id: string): boolean {
  if (isFavorite(category, id)) {
    removeFavorite(category, id);
    return false;
  }
  return addFavorite(category, id);
}
