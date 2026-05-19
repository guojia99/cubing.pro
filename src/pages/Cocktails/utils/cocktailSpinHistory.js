/** 按本地日历日保存「今晚喝什么」转盘结果，便于当天回顾 */
function pad2(n) {
    return String(n).padStart(2, '0');
}
/** 本地日期 YYYY-MM-DD */
export function cocktailSpinDateKey(d = new Date()) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
const dayKey = (dateStr) => `cubing-pro-cocktail-spin-${dateStr}`;
export function getCocktailSpinHistoryForDate(dateStr) {
    try {
        const raw = localStorage.getItem(dayKey(dateStr));
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter((x) => x &&
            typeof x === 'object' &&
            typeof x.slug === 'string' &&
            typeof x.zhName === 'string');
    }
    catch {
        return [];
    }
}
/** 今日（本机时区）转盘历史，按时间升序 */
export function getTodayCocktailSpinHistory() {
    return getCocktailSpinHistoryForDate(cocktailSpinDateKey());
}
export function appendTodayCocktailSpin(record) {
    const key = cocktailSpinDateKey();
    const list = getCocktailSpinHistoryForDate(key);
    list.push({
        ...record,
        ts: record.ts ?? Date.now(),
    });
    localStorage.setItem(dayKey(key), JSON.stringify(list));
}
//# sourceMappingURL=cocktailSpinHistory.js.map