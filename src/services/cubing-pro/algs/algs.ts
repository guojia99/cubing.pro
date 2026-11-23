import { Request } from "@/services/cubing-pro/request";

export type AlgListItem = {
  name: string;
  image?: string;
  alg?: string;
  caseCount?: number;
};

export type AlgCubeMap = {
  CubeKeys: string[];
  ClassMap: Record<string, AlgListItem[]>;
};

export type AlgItem = {
  name: string;
  algs: string[];
  caseId?: string;
  solutionIds?: (string | null)[];
  image?: string;
  scrambles?: string[];
  [key: string]: unknown;
};

export type AlgGroupItem = {
  name: string;
  groupId?: string;
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
const CACHE_KEY_CLASS_PREFIX = "alg_class_cache_v2_";
const CACHE_TTL_MAP = 10 * 60 * 1000;
const CACHE_TTL_CLASS = 12 * 60 * 60 * 1000;
const CATALOG_ID = /^[0-9a-f]{16}$/;

function isCatalogId(value: unknown): boolean {
  return typeof value === "string" && CATALOG_ID.test(value);
}

export function hasStableCatalogIds(data: AlgClassDetail | null): boolean {
  if (!Array.isArray(data?.sets)) return false;
  for (const set of data.sets) {
    if (!Array.isArray(set?.groups)) return false;
    for (const group of set.groups) {
      if (!isCatalogId(group?.groupId) || !Array.isArray(group.algs)) return false;
      for (const item of group.algs) {
        if (!Array.isArray(item?.algs)) return false;
        if (item.algs.length === 0) continue;
        const ids = item.solutionIds;
        if (!Array.isArray(ids) || ids.length !== item.algs.length) return false;
        for (const [index, moves] of item.algs.entries()) {
          if (typeof moves !== "string" || (moves !== "" && !isCatalogId(ids[index]))) return false;
        }
      }
    }
  }
  return true;
}

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

function setCached<T>(key: string, data: T, legacyKey?: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    if (legacyKey) localStorage.removeItem(legacyKey);
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
  if (cached && hasStableCatalogIds(cached)) return cached;

  const res = await Request.get<AlgClassDetail>(
    `/public/algorithm/${encodeURIComponent(cube)}/${encodeURIComponent(classID)}`,
  );
  if (hasStableCatalogIds(res.data)) {
    setCached(cacheKey, res.data, `alg_class_cache_${cube}_${classID}`);
  }
  return res.data;
}
