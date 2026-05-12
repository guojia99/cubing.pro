const STORAGE_KEY = 'cubing-pro-cocktails-favorites';
const MAX_FAVORITES = 20;

export interface FavoriteCocktail {
  slug: string;
}

export function getCocktailFavorites(): FavoriteCocktail[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x: unknown) => x && typeof x === 'object' && typeof (x as FavoriteCocktail).slug === 'string')
      .slice(0, MAX_FAVORITES);
  } catch {
    return [];
  }
}

export function saveCocktailFavorites(list: FavoriteCocktail[]) {
  const trimmed = list.slice(0, MAX_FAVORITES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function isCocktailFavorite(slug: string): boolean {
  return getCocktailFavorites().some((f) => f.slug === slug);
}

export function addCocktailFavorite(slug: string): boolean {
  const list = getCocktailFavorites();
  if (list.some((f) => f.slug === slug)) return false;
  if (list.length >= MAX_FAVORITES) return false;
  list.push({ slug });
  saveCocktailFavorites(list);
  return true;
}

export function removeCocktailFavorite(slug: string): boolean {
  const before = getCocktailFavorites();
  const list = before.filter((f) => f.slug !== slug);
  if (list.length === before.length) return false;
  saveCocktailFavorites(list);
  return true;
}
