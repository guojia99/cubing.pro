import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { Request } from '@/services/cubing-pro/request';
import { Country } from '@/services/cubing-pro/wca/types';
import { getCountryDisplayName } from '@/pages/WCA/PlayerComponents/region/all_contiry';

/** `/wca/country` 拉取后的全量缓存，供按 WCA id（如 China）解析 iso2 与展示名 */
let cachedCountries: Country[] = [];

export function getCachedWcaCountries(): Country[] {
  return cachedCountries;
}

/**
 * 将接口返回的国家标识解析为 iso2 + 英文国名（来自 WCA country 列表）。
 * 匹配顺序：id 精确 → id 忽略大小写 → iso2 两位 → name 忽略大小写。
 */
export function resolveWcaCountryRecord(
  raw: string | null | undefined,
  list?: Country[] | null,
): { iso2: string; name: string } | null {
  if (raw == null || typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!t) return null;

  const countries = list != null && list.length > 0 ? list : cachedCountries;
  if (!countries.length) return null;

  for (const c of countries) {
    if (c.id === t) {
      return { iso2: (c.iso2 || '').toUpperCase(), name: c.name || c.id };
    }
  }

  const tl = t.toLowerCase();
  for (const c of countries) {
    if (c.id.toLowerCase() === tl) {
      return { iso2: (c.iso2 || '').toUpperCase(), name: c.name || c.id };
    }
  }

  if (/^[A-Za-z]{2}$/.test(t)) {
    const iso = t.toUpperCase();
    for (const c of countries) {
      if ((c.iso2 || '').toUpperCase() === iso) {
        return { iso2: iso, name: c.name || c.id };
      }
    }
    return { iso2: iso, name: t };
  }

  for (const c of countries) {
    if ((c.name || '').toLowerCase() === tl) {
      return { iso2: (c.iso2 || '').toUpperCase(), name: c.name || c.id };
    }
  }

  return null;
}

/**
 * 表格/筛选里展示用：根据 WCA country id、iso2 或英文 name，结合 `/wca/country` 列表与当前语言输出文案。
 */
export function getWcaCountryLabel(raw: string | null | undefined, list?: Country[] | null): string {
  if (raw == null || typeof raw !== 'string' || !raw.trim()) return '';
  const entry = resolveWcaCountryRecord(raw, list);
  if (entry) {
    return getCountryDisplayName(entry.iso2 || undefined, entry.name);
  }
  const t = raw.trim();
  if (/^[A-Za-z]{2}$/.test(t)) {
    return getCountryDisplayName(t.toUpperCase(), t);
  }
  return getCountryDisplayName('', t);
}

export async function CountryList(): Promise<Country[]> {
  const response = await Request.get<Country[]>(`/wca/country`, {
    headers: AuthHeader(),
  });
  const data = Array.isArray(response.data) ? response.data : [];
  cachedCountries = data;
  return data;
}
