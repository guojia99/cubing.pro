export interface CocktailSpinRecord {
  slug: string;
  zhName: string;
  enName: string;
  ts: number;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function cocktailSpinDateKey(d = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

const dayKey = (dateStr: string) => `cubing-pro-cocktail-spin-${dateStr}`;

export function appendTodayCocktailSpin(record: Omit<CocktailSpinRecord, "ts"> & { ts?: number }): void {
  const key = cocktailSpinDateKey();
  try {
    const raw = localStorage.getItem(dayKey(key));
    const list: CocktailSpinRecord[] = raw ? JSON.parse(raw) : [];
    list.push({ ...record, ts: record.ts ?? Date.now() });
    localStorage.setItem(dayKey(key), JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
