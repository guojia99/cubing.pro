import { Request } from '@/services/cubing-pro/request';
const CACHE_PREFIX = 'algs:cubing.pro:detail:';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 小时
function getAlgDetailCacheKey(cube, classID) {
    return `${CACHE_PREFIX}${encodeURIComponent(cube)}::${encodeURIComponent(classID)}`;
}
function getCachedAlgClass(cube, classID) {
    try {
        const key = getAlgDetailCacheKey(cube, classID);
        const raw = localStorage.getItem(key);
        if (!raw)
            return null;
        const { data, ts } = JSON.parse(raw);
        if (typeof ts !== 'number' || Date.now() - ts > CACHE_TTL_MS)
            return null;
        return data;
    }
    catch {
        return null;
    }
}
function setCachedAlgClass(cube, classID, data) {
    try {
        const key = getAlgDetailCacheKey(cube, classID);
        localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    }
    catch {
        // ignore
    }
}
export async function getAlgCubeMap() {
    const response = await Request.get("/public/algorithm/", {});
    return response.data;
}
export async function getAlgCubeClass(cube, classID) {
    const cached = getCachedAlgClass(cube, classID);
    if (cached)
        return cached;
    const response = await Request.get(`/public/algorithm/${cube}/${classID}`, {});
    const data = response.data;
    setCachedAlgClass(cube, classID, data);
    return data;
}
//# sourceMappingURL=algs.js.map