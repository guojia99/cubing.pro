import { getToken } from '@/services/cubing-pro/auth/token';
import { getKeyMap, setSubKeyValue } from '@/services/cubing-pro/key_value/keyvalue_store';

const KV_KEY = 'algs:daily_random_pick';
const LS_KEY = 'algs:daily_random_pick';
const MAX_PICKS_PER_DAY = 2;

export interface PickedOption {
  cube: string;
  className: string;
  image: string;
}

export interface DailyPickState {
  date: string; // YYYY-MM-DD
  picks: PickedOption[];
}

function getTodayKey(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

async function getFromServer(): Promise<DailyPickState | null> {
  try {
    const token = getToken();
    if (!token?.token) return null;
    const map = await getKeyMap(KV_KEY);
    const today = getTodayKey();
    const data = map[today];
    if (!data) return null;
    return data as DailyPickState;
  } catch {
    return null;
  }
}

function getFromLocalStorage(): DailyPickState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as DailyPickState;
    if (data.date !== getTodayKey()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getDailyPickState(): Promise<DailyPickState | null> {
  const fromServer = await getFromServer();
  if (fromServer) return fromServer;
  return getFromLocalStorage();
}

async function saveToServer(state: DailyPickState): Promise<void> {
  try {
    const token = getToken();
    if (!token?.token) return;
    await setSubKeyValue(KV_KEY, state.date, state);
  } catch {
    // ignore
  }
}

function saveToLocalStorage(state: DailyPickState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export async function saveDailyPick(picks: PickedOption[]): Promise<void> {
  const state: DailyPickState = {
    date: getTodayKey(),
    picks,
  };
  try {
    await saveToServer(state);
  } catch {
    // Server may fail when not logged in
  }
  saveToLocalStorage(state);
}

export function getRemainingPicks(state: DailyPickState | null): number {
  if (!state || state.date !== getTodayKey()) return MAX_PICKS_PER_DAY;
  return Math.max(0, MAX_PICKS_PER_DAY - state.picks.length);
}

export async function clearDailyPick(): Promise<void> {
  const today = getTodayKey();
  try {
    await setSubKeyValue(KV_KEY, today, { date: today, picks: [] });
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}
