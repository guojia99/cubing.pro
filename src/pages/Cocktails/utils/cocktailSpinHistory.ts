/** 按本地日历日保存「今晚喝什么」转盘结果，便于当天回顾 */

export interface CocktailSpinRecord {
  slug: string;
  zhName: string;
  enName: string;
  ts: number;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/** 本地日期 YYYY-MM-DD */
export function cocktailSpinDateKey(d = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

const dayKey = (dateStr: string) => `cubing-pro-cocktail-spin-${dateStr}`;

export function getCocktailSpinHistoryForDate(dateStr: string): CocktailSpinRecord[] {
  try {
    const raw = localStorage.getItem(dayKey(dateStr));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x: unknown) =>
        x &&
        typeof x === 'object' &&
        typeof (x as CocktailSpinRecord).slug === 'string' &&
        typeof (x as CocktailSpinRecord).zhName === 'string',
    ) as CocktailSpinRecord[];
  } catch {
    return [];
  }
}

/** 今日（本机时区）转盘历史，按时间升序 */
export function getTodayCocktailSpinHistory(): CocktailSpinRecord[] {
  return getCocktailSpinHistoryForDate(cocktailSpinDateKey());
}

export function appendTodayCocktailSpin(record: Omit<CocktailSpinRecord, 'ts'> & { ts?: number }): void {
  const key = cocktailSpinDateKey();
  const list = getCocktailSpinHistoryForDate(key);
  list.push({
    ...record,
    ts: record.ts ?? Date.now(),
  });
  localStorage.setItem(dayKey(key), JSON.stringify(list));
}
