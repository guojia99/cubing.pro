import { getToken } from '@/services/cubing-pro/auth/token';
import { getKeyMap, setSubKeyValue } from '@/services/cubing-pro/key_value/keyvalue_store';
const KV_KEY = 'algs:daily_random_pick';
const LS_KEY = 'algs:daily_random_pick';
const MAX_PICKS_PER_DAY = 2;
function getTodayKey() {
    const now = new Date();
    return now.toISOString().slice(0, 10);
}
async function getFromServer() {
    try {
        const token = getToken();
        if (!token?.token)
            return null;
        const map = await getKeyMap(KV_KEY);
        const today = getTodayKey();
        const data = map[today];
        if (!data)
            return null;
        return data;
    }
    catch {
        return null;
    }
}
function getFromLocalStorage() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw)
            return null;
        const data = JSON.parse(raw);
        if (data.date !== getTodayKey())
            return null;
        return data;
    }
    catch {
        return null;
    }
}
export async function getDailyPickState() {
    const fromServer = await getFromServer();
    if (fromServer)
        return fromServer;
    return getFromLocalStorage();
}
async function saveToServer(state) {
    try {
        const token = getToken();
        if (!token?.token)
            return;
        await setSubKeyValue(KV_KEY, state.date, state);
    }
    catch {
        // ignore
    }
}
function saveToLocalStorage(state) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(state));
    }
    catch {
        // ignore
    }
}
export async function saveDailyPick(picks) {
    const state = {
        date: getTodayKey(),
        picks,
    };
    try {
        await saveToServer(state);
    }
    catch {
        // Server may fail when not logged in
    }
    saveToLocalStorage(state);
}
export function getRemainingPicks(state) {
    if (!state || state.date !== getTodayKey())
        return MAX_PICKS_PER_DAY;
    return Math.max(0, MAX_PICKS_PER_DAY - state.picks.length);
}
export async function clearDailyPick() {
    const today = getTodayKey();
    try {
        await setSubKeyValue(KV_KEY, today, { date: today, picks: [] });
    }
    catch {
        // ignore
    }
    try {
        localStorage.removeItem(LS_KEY);
    }
    catch {
        // ignore
    }
}
//# sourceMappingURL=dailyRandomPick.js.map