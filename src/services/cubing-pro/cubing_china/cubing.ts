import { Request } from '@/services/cubing-pro/request';
// === 辅助函数 ===
function extractYear(str: string): string | null {
  const match = str.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : null;
}

function normalizeForFuzzy(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
export interface CubingCompetition {
  id: string;
  wcaid: string;
  name: string;
  enName: string;
  city: string;
  address: string;
}

const CACHE_KEY = 'cubing_china_comps_v1';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day in ms

// 从 localStorage 读取缓存（带验证）
function getCacheFromStorage(): { data: CubingCompetition[]; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed as { data: CubingCompetition[]; timestamp: number };
  } catch (e) {
    console.warn('Failed to parse competition cache from localStorage', e);
  }
  return null;
}

// 写入缓存到 localStorage
function setCacheToStorage(data: CubingCompetition[]): void {
  try {
    const payload = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Failed to write competition cache to localStorage', e);
    // 可能是 localStorage 满了或被禁用，静默失败
  }
}

// === 原有异步接口（保留 + 支持持久化缓存）===
export async function getCubingChinaComps(): Promise<{ data: CubingCompetition[] }> {
  const now = Date.now();
  let cachedData: CubingCompetition[] | null = null;

  // 尝试从 localStorage 读取
  const storageCache = getCacheFromStorage();
  if (storageCache && now - storageCache.timestamp < CACHE_DURATION) {
    cachedData = storageCache.data;
    return { data: cachedData };
  }

  try {
    const response = await Request.get<{ data: CubingCompetition[] }>("/wca/comps/china", {});
    const freshData = response.data.data;

    // 更新内存 & localStorage
    setCacheToStorage(freshData);

    return response.data;
  } catch (error) {
    // 如果 localStorage 有旧数据（即使过期），也尝试降级返回
    if (storageCache) {
      console.warn('Failed to fetch competitions, returning stale cached data.', error);
      return { data: storageCache.data };
    }
    throw error;
  }
}

// === 同步查找函数（使用 localStorage 缓存）===
export function findCubingCompetitionByIdentifier(identifier: string): CubingCompetition | null {
  const storageCache = getCacheFromStorage();
  const now = Date.now();

  // 即使过期，只要存在就用于同步查找（你也可以选择只用未过期的）
  const useData = storageCache && (now - storageCache.timestamp < CACHE_DURATION)
    ? storageCache.data
    : storageCache?.data; // 或者这里也限制必须未过期：把三元去掉，只用第一个条件

  if (!useData || !Array.isArray(useData)) {
    return null;
  }

  // 1. 精确匹配 id
  let comp = useData.find(c => c.id === identifier);
  if (comp) return comp;

  // 2. 精确匹配 wcaid
  comp = useData.find(c => c.wcaid === identifier);
  if (comp) return comp;

  // 3. 精确匹配 enName
  comp = useData.find(c => c.enName === identifier);
  if (comp) return comp;

  // 4. 模糊匹配 enName（年份必须一致）
  const inputYear = extractYear(identifier);
  if (!inputYear) return null;

  const normalizedInput = normalizeForFuzzy(identifier);
  const inputWords = normalizedInput.split(' ').filter(Boolean);

  const candidates = useData.filter(c => extractYear(c.enName) === inputYear);
  if (candidates.length === 0) return null;

  let bestMatch: CubingCompetition | null = null;
  let maxMatchCount = -1;

  for (const c of candidates) {
    const normEnName = normalizeForFuzzy(c.enName);
    const enWords = normEnName.split(' ').filter(Boolean);
    const matchCount = inputWords.filter(word => enWords.includes(word)).length;

    if (matchCount > maxMatchCount) {
      maxMatchCount = matchCount;
      bestMatch = c;
    }
  }

  return maxMatchCount > 0 ? bestMatch : null;
}

