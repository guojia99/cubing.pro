import type { OtherLink, OtherLinks } from '@/services/cubing-pro/auth/typings';

export function emptyOtherLinks(): OtherLinks {
  return { tops: [], groups: [], group_map: {}, links: [] };
}

function asRecord(data: OtherLinks): Record<string, unknown> {
  return data as unknown as Record<string, unknown>;
}

/** 兼容 Go/JSON 大小写与别名字段 */
function pickTops(data: OtherLinks): string[] {
  const r = asRecord(data);
  const raw = r.tops ?? r.Tops ?? r.top ?? r.Top;
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}

function pickGroups(data: OtherLinks): string[] {
  const r = asRecord(data);
  const raw = r.groups ?? r.Groups;
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}

function pickLinks(data: OtherLinks): OtherLink[] {
  const r = asRecord(data);
  const raw = r.links ?? r.Links;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is OtherLink => typeof x === 'object' && x !== null && 'key' in x,
  );
}

function pickGroupMap(data: OtherLinks): Record<string, string[]> {
  const r = asRecord(data);
  const gm = r.group_map ?? r.groupMap ?? r.GroupMap;
  if (gm !== null && gm !== undefined && typeof gm === 'object' && !Array.isArray(gm)) {
    return gm as Record<string, string[]>;
  }
  return {};
}

/** 后端可能返回 null 字段，统一成可安全迭代的结构 */
export function sanitizeOtherLinks(data: OtherLinks): OtherLinks {
  return {
    tops: pickTops(data),
    groups: pickGroups(data),
    group_map: pickGroupMap(data),
    links: pickLinks(data),
  };
}

export function unwrapOtherLinks(data: OtherLinks | OtherLinks[] | null | undefined): OtherLinks {
  if (data === null || data === undefined) {
    return emptyOtherLinks();
  }
  if (Array.isArray(data)) {
    return sanitizeOtherLinks(data[0] ?? emptyOtherLinks());
  }
  return sanitizeOtherLinks(data);
}
