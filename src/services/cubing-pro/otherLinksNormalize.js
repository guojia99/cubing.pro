export function emptyOtherLinks() {
    return { tops: [], groups: [], group_map: {}, links: [] };
}
function asRecord(data) {
    return data;
}
/** 兼容 Go/JSON 大小写与别名字段 */
function pickTops(data) {
    const r = asRecord(data);
    const raw = r.tops ?? r.Tops ?? r.top ?? r.Top;
    if (!Array.isArray(raw))
        return [];
    return raw.filter((x) => typeof x === 'string');
}
function pickGroups(data) {
    const r = asRecord(data);
    const raw = r.groups ?? r.Groups;
    if (!Array.isArray(raw))
        return [];
    return raw.filter((x) => typeof x === 'string');
}
function pickLinks(data) {
    const r = asRecord(data);
    const raw = r.links ?? r.Links;
    if (!Array.isArray(raw))
        return [];
    return raw.filter((x) => typeof x === 'object' && x !== null && 'key' in x);
}
function pickGroupMap(data) {
    const r = asRecord(data);
    const gm = r.group_map ?? r.groupMap ?? r.GroupMap;
    if (gm !== null && gm !== undefined && typeof gm === 'object' && !Array.isArray(gm)) {
        return gm;
    }
    return {};
}
/** 后端可能返回 null 字段，统一成可安全迭代的结构 */
export function sanitizeOtherLinks(data) {
    return {
        tops: pickTops(data),
        groups: pickGroups(data),
        group_map: pickGroupMap(data),
        links: pickLinks(data),
    };
}
export function unwrapOtherLinks(data) {
    if (data === null || data === undefined) {
        return emptyOtherLinks();
    }
    if (Array.isArray(data)) {
        return sanitizeOtherLinks(data[0] ?? emptyOtherLinks());
    }
    return sanitizeOtherLinks(data);
}
//# sourceMappingURL=otherLinksNormalize.js.map