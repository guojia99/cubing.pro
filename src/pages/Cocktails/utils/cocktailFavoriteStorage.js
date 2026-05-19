const STORAGE_KEY = 'cubing-pro-cocktails-favorites';
const MAX_FAVORITES = 20;
export function getCocktailFavorites() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed
            .filter((x) => x && typeof x === 'object' && typeof x.slug === 'string')
            .slice(0, MAX_FAVORITES);
    }
    catch {
        return [];
    }
}
export function saveCocktailFavorites(list) {
    const trimmed = list.slice(0, MAX_FAVORITES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
}
export function isCocktailFavorite(slug) {
    return getCocktailFavorites().some((f) => f.slug === slug);
}
export function addCocktailFavorite(slug) {
    const list = getCocktailFavorites();
    if (list.some((f) => f.slug === slug))
        return false;
    if (list.length >= MAX_FAVORITES)
        return false;
    list.push({ slug });
    saveCocktailFavorites(list);
    return true;
}
export function removeCocktailFavorite(slug) {
    const before = getCocktailFavorites();
    const list = before.filter((f) => f.slug !== slug);
    if (list.length === before.length)
        return false;
    saveCocktailFavorites(list);
    return true;
}
//# sourceMappingURL=cocktailFavoriteStorage.js.map