import { Request } from "@/services/cubing-pro/request";

export type AlgListItem = {
  name: string;
  image?: string;
  alg?: string;
};

export type AlgCubeMap = {
  CubeKeys: string[];
  ClassMap: Record<string, AlgListItem[]>;
};

export type AlgItem = {
  name: string;
  algs: string[];
  image?: string;
  scrambles?: string[];
  [key: string]: unknown;
};

export type AlgGroupItem = {
  name: string;
  algs: AlgItem[];
};

export type AlgSetItem = {
  name: string;
  groups: AlgGroupItem[];
  groups_keys?: string[];
};

export type AlgClassDetail = {
  name: string;
  sets: AlgSetItem[];
  setKeys?: string[];
  [key: string]: unknown;
};

const CACHE_KEY_MAP = "alg_cubemap_cache";
const CACHE_KEY_CLASS_PREFIX = "alg_class_cache_";
const CACHE_TTL_MAP = 10 * 60 * 1000;
const CACHE_TTL_CLASS = 12 * 60 * 60 * 1000;

function getCached<T>(key: string, ttl: number): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: T; ts: number };
    if (Date.now() - ts > ttl) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCached<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // storage full
  }
}

export async function getAlgCubeMap(): Promise<AlgCubeMap> {
  const cached = getCached<AlgCubeMap>(CACHE_KEY_MAP, CACHE_TTL_MAP);
  if (cached) return cached;

  const res = await Request.get<AlgCubeMap>("/public/algorithm/");
  setCached(CACHE_KEY_MAP, res.data);
  return res.data;
}

export async function getAlgCubeClass(
  cube: string,
  classID: string,
): Promise<AlgClassDetail> {
  const cacheKey = `${CACHE_KEY_CLASS_PREFIX}${cube}_${classID}`;
  const cached = getCached<AlgClassDetail>(cacheKey, CACHE_TTL_CLASS);
  if (cached) return cached;

  const res = await Request.get<AlgClassDetail>(
    `/public/algorithm/${cube}/${classID}`,
  );
  setCached(cacheKey, res.data);
  return res.data;
}
