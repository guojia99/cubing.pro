const TONIGHT_LIST_KEY = "cubing-pro-recipes-tonight-list";
const TONIGHT_CHECKED_KEY = "cubing-pro-recipes-tonight-checked";
const MAX_TONIGHT = 20;

export interface TonightRecipe {
  category: string;
  id: string;
}

export function getTonightList(): TonightRecipe[] {
  try {
    const raw = localStorage.getItem(TONIGHT_LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_TONIGHT) : [];
  } catch {
    return [];
  }
}

function saveTonightList(list: TonightRecipe[]) {
  localStorage.setItem(TONIGHT_LIST_KEY, JSON.stringify(list.slice(0, MAX_TONIGHT)));
}

export function isInTonight(category: string, id: string): boolean {
  return getTonightList().some((t) => t.category === category && t.id === id);
}

export function addToTonight(category: string, id: string): boolean {
  const list = getTonightList();
  if (list.some((t) => t.category === category && t.id === id)) return false;
  if (list.length >= MAX_TONIGHT) return false;
  list.push({ category, id });
  saveTonightList(list);
  return true;
}

export function removeFromTonight(category: string, id: string): boolean {
  const before = getTonightList();
  const list = before.filter((t) => !(t.category === category && t.id === id));
  if (list.length === before.length) return false;
  saveTonightList(list);
  return true;
}

export function clearTonightList(): void {
  localStorage.removeItem(TONIGHT_LIST_KEY);
  localStorage.removeItem(TONIGHT_CHECKED_KEY);
}

export function getCheckedIngredients(): Set<string> {
  try {
    const raw = localStorage.getItem(TONIGHT_CHECKED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function setCheckedIngredients(checked: Set<string>): void {
  localStorage.setItem(TONIGHT_CHECKED_KEY, JSON.stringify([...checked]));
}

export function toggleIngredientChecked(ingredient: string): void {
  const checked = getCheckedIngredients();
  if (checked.has(ingredient)) checked.delete(ingredient);
  else checked.add(ingredient);
  setCheckedIngredients(checked);
}
