import { AlgorithmClass, AlgorithmGroupsResponse } from '@/services/cubing-pro/algs/typings';
import { Request } from '@/services/cubing-pro/request';

const CACHE_PREFIX = 'algs:cubing.pro:detail:';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 小时

function getAlgDetailCacheKey(cube: string, classID: string): string {
  return `${CACHE_PREFIX}${encodeURIComponent(cube)}::${encodeURIComponent(classID)}`;
}

function getCachedAlgClass(cube: string, classID: string): AlgorithmClass | null {
  try {
    const key = getAlgDetailCacheKey(cube, classID);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: AlgorithmClass; ts: number };
    if (typeof ts !== 'number' || Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function setCachedAlgClass(cube: string, classID: string, data: AlgorithmClass): void {
  try {
    const key = getAlgDetailCacheKey(cube, classID);
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // ignore
  }
}

export async function getAlgCubeMap():Promise<AlgorithmGroupsResponse>{
  const response = await Request.get<AlgorithmGroupsResponse>("/public/algorithm/", {});
  return response.data;
}

export async function getAlgCubeClass(cube: string, classID: string):Promise<AlgorithmClass>{
  const cached = getCachedAlgClass(cube, classID);
  if (cached) return cached;

  const response = await Request.get<AlgorithmClass>(`/public/algorithm/${cube}/${classID}`, {});
  const data = response.data;
  setCachedAlgClass(cube, classID, data);
  return data;
}
