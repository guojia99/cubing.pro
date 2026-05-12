const TONIGHT_LIST_KEY = 'cubing-pro-cocktails-tonight-list';
const TONIGHT_CHECKED_KEY = 'cubing-pro-cocktails-tonight-checked';
const MAX_TONIGHT = 20;

export interface TonightCocktail {
  slug: string;
}

export function getCocktailTonightList(): TonightCocktail[] {
  try {
    const raw = localStorage.getItem(TONIGHT_LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x: unknown) => x && typeof x === 'object' && typeof (x as TonightCocktail).slug === 'string')
      .slice(0, MAX_TONIGHT);
  } catch {
    return [];
  }
}

export function saveCocktailTonightList(list: TonightCocktail[]) {
  const trimmed = list.slice(0, MAX_TONIGHT);
  localStorage.setItem(TONIGHT_LIST_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function isCocktailInTonight(slug: string): boolean {
  return getCocktailTonightList().some((t) => t.slug === slug);
}

export function addCocktailToTonight(slug: string): boolean {
  const list = getCocktailTonightList();
  if (list.some((t) => t.slug === slug)) return false;
  if (list.length >= MAX_TONIGHT) return false;
  list.push({ slug });
  saveCocktailTonightList(list);
  return true;
}

export function removeCocktailFromTonight(slug: string): boolean {
  const before = getCocktailTonightList();
  const list = before.filter((t) => t.slug !== slug);
  if (list.length === before.length) return false;
  saveCocktailTonightList(list);
  return true;
}

export function clearCocktailTonightList(): void {
  localStorage.removeItem(TONIGHT_LIST_KEY);
  localStorage.removeItem(TONIGHT_CHECKED_KEY);
}

export function getCocktailTonightCheckedIngredients(): Set<string> {
  try {
    const raw = localStorage.getItem(TONIGHT_CHECKED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function setCocktailTonightCheckedIngredients(checked: Set<string>): void {
  localStorage.setItem(TONIGHT_CHECKED_KEY, JSON.stringify([...checked]));
}

export function toggleCocktailTonightIngredientChecked(ingredient: string): void {
  const checked = getCocktailTonightCheckedIngredients();
  if (checked.has(ingredient)) checked.delete(ingredient);
  else checked.add(ingredient);
  setCocktailTonightCheckedIngredients(checked);
}
