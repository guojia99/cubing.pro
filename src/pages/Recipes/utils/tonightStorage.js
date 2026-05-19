const TONIGHT_LIST_KEY = 'cubing-pro-recipes-tonight-list';
const TONIGHT_CHECKED_KEY = 'cubing-pro-recipes-tonight-checked';
const MAX_TONIGHT = 20;
export function getTonightList() {
    try {
        const raw = localStorage.getItem(TONIGHT_LIST_KEY);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.slice(0, MAX_TONIGHT) : [];
    }
    catch {
        return [];
    }
}
export function saveTonightList(list) {
    const trimmed = list.slice(0, MAX_TONIGHT);
    localStorage.setItem(TONIGHT_LIST_KEY, JSON.stringify(trimmed));
    return trimmed;
}
export function isInTonight(category, id) {
    const list = getTonightList();
    return list.some((t) => t.category === category && t.id === id);
}
export function addToTonight(category, id) {
    const list = getTonightList();
    if (list.some((t) => t.category === category && t.id === id))
        return false;
    if (list.length >= MAX_TONIGHT)
        return false;
    list.push({ category, id });
    saveTonightList(list);
    return true;
}
export function removeFromTonight(category, id) {
    const list = getTonightList().filter((t) => !(t.category === category && t.id === id));
    if (list.length === getTonightList().length)
        return false;
    saveTonightList(list);
    return true;
}
export function clearTonightList() {
    localStorage.removeItem(TONIGHT_LIST_KEY);
    localStorage.removeItem(TONIGHT_CHECKED_KEY);
}
export function getCheckedIngredients() {
    try {
        const raw = localStorage.getItem(TONIGHT_CHECKED_KEY);
        if (!raw)
            return new Set();
        const parsed = JSON.parse(raw);
        return new Set(Array.isArray(parsed) ? parsed : []);
    }
    catch {
        return new Set();
    }
}
export function setCheckedIngredients(checked) {
    localStorage.setItem(TONIGHT_CHECKED_KEY, JSON.stringify([...checked]));
}
export function toggleIngredientChecked(ingredient) {
    const checked = getCheckedIngredients();
    if (checked.has(ingredient)) {
        checked.delete(ingredient);
    }
    else {
        checked.add(ingredient);
    }
    setCheckedIngredients(checked);
}
//# sourceMappingURL=tonightStorage.js.map