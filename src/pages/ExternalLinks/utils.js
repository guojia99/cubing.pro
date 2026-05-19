import { arrayMove } from '@dnd-kit/sortable';
export const MAX_TOP_LINKS = 3;
/** 无自定义图标时的占位图（与站点 logo 区分） */
export const DEFAULT_LINK_ICON = '/pro_icon.svg';
function asLinkList(links) {
    return Array.isArray(links) ? links : [];
}
function asStringList(a) {
    return Array.isArray(a) ? a : [];
}
export function linkIndex(links) {
    const m = new Map();
    for (const l of asLinkList(links)) {
        m.set(l.key, l);
    }
    return m;
}
/** `icon` 字段约定：`antd:LinkOutlined`、`fc:FcGlobe`、`gi:GiCube`、`cube:333` */
export const ANTD_ICON_PREFIX = 'antd:';
export const FC_ICON_PREFIX = 'fc:';
export const GI_ICON_PREFIX = 'gi:';
export const CUBE_ICON_PREFIX = 'cube:';
/** 单字母黑体图标：`letter:A` … `letter:Z` */
export const LETTER_ICON_PREFIX = 'letter:';
export function parsePrefixedIconKey(prefix, raw) {
    const t = raw?.trim();
    if (!t?.startsWith(prefix))
        return null;
    const key = t.slice(prefix.length).trim();
    return key || null;
}
export function parseAntdIconKey(icon) {
    return parsePrefixedIconKey(ANTD_ICON_PREFIX, icon);
}
export function parseFcIconKey(icon) {
    return parsePrefixedIconKey(FC_ICON_PREFIX, icon);
}
export function parseGiIconKey(icon) {
    return parsePrefixedIconKey(GI_ICON_PREFIX, icon);
}
export function parseCubeIconKey(icon) {
    return parsePrefixedIconKey(CUBE_ICON_PREFIX, icon);
}
export function parseLetterIconKey(icon) {
    const k = parsePrefixedIconKey(LETTER_ICON_PREFIX, icon);
    if (!k)
        return null;
    return /^[A-Z]$/.test(k) ? k : null;
}
export function resolveIconSrc(link) {
    const u = link.icon_url?.trim();
    if (u)
        return u;
    const i = link.icon?.trim();
    if (i && (i.startsWith('http://') || i.startsWith('https://') || i.startsWith('/'))) {
        return i;
    }
    return undefined;
}
export function buildGroupSections(data, includeEmptyGroups) {
    const idx = linkIndex(data.links);
    const out = [];
    for (const g of asStringList(data.groups)) {
        const keys = data.group_map[g] ?? [];
        const resolved = keys
            .map((k) => idx.get(k))
            .filter((x) => x !== undefined && x !== null);
        if (includeEmptyGroups || resolved.length > 0) {
            out.push({ title: g, links: resolved });
        }
    }
    return out;
}
/** 分组名命中则整组保留；否则只保留名称 / 描述 / URL / key 命中的链接 */
export function filterGroupSectionsByQuery(sections, query) {
    const q = query.trim().toLowerCase();
    if (!q)
        return sections;
    return sections
        .map((s) => {
        if (s.title.toLowerCase().includes(q)) {
            return s;
        }
        const links = s.links.filter((l) => {
            const blob = [l.name, l.desc, l.url, l.key].join('\u0000').toLowerCase();
            return blob.includes(q);
        });
        return { title: s.title, links };
    })
        .filter((s) => s.links.length > 0);
}
export function getTopLinks(data) {
    const idx = linkIndex(data.links);
    const out = [];
    for (const k of asStringList(data.tops)) {
        if (out.length >= MAX_TOP_LINKS)
            break;
        const link = idx.get(k);
        if (link)
            out.push(link);
    }
    return out;
}
export function ensureUniqueTops(tops) {
    const seen = new Set();
    const out = [];
    for (const t of asStringList(tops)) {
        if (!seen.has(t)) {
            seen.add(t);
            out.push(t);
            if (out.length >= MAX_TOP_LINKS)
                break;
        }
    }
    return out;
}
export function toggleTop(tops, key, pinned) {
    const list = asStringList(tops);
    if (pinned) {
        if (list.includes(key))
            return ensureUniqueTops(list);
        if (list.length >= MAX_TOP_LINKS)
            return list;
        return ensureUniqueTops([...list, key]);
    }
    return list.filter((t) => t !== key);
}
export function newEmptyLink(key) {
    return { key, name: '', desc: '', url: '', icon: '', icon_url: '' };
}
export function collectAllKeysFromGroups(data) {
    const s = new Set();
    for (const g of asStringList(data.groups)) {
        for (const k of data.group_map[g] ?? []) {
            s.add(k);
        }
    }
    return s;
}
export function pruneOrphanLinks(data) {
    const used = collectAllKeysFromGroups(data);
    const tops = asStringList(data.tops).filter((k) => used.has(k));
    const links = asLinkList(data.links).filter((l) => used.has(l.key));
    return { ...data, tops: ensureUniqueTops(tops), links };
}
export const GROUP_SORT_PREFIX = 'grp:';
/** 分组内拖放区域（含空分组），用于把卡片拖入其他分组 */
export const GROUP_DROP_PREFIX = 'drop:';
export function groupDropId(name) {
    return `${GROUP_DROP_PREFIX}${encodeURIComponent(name)}`;
}
export function parseGroupDropId(id) {
    if (!id.startsWith(GROUP_DROP_PREFIX))
        return null;
    try {
        return decodeURIComponent(id.slice(GROUP_DROP_PREFIX.length));
    }
    catch {
        return null;
    }
}
export function groupSortId(name) {
    return `${GROUP_SORT_PREFIX}${name}`;
}
export function parseGroupSortId(id) {
    return id.startsWith(GROUP_SORT_PREFIX) ? id.slice(GROUP_SORT_PREFIX.length) : null;
}
export function findGroupForLinkKey(data, key) {
    for (const g of asStringList(data.groups)) {
        if ((data.group_map[g] ?? []).includes(key))
            return g;
    }
    return null;
}
export function reorderGroupsOrder(data, activeGroup, overGroup) {
    const groups = [...asStringList(data.groups)];
    const oldIndex = groups.indexOf(activeGroup);
    const newIndex = groups.indexOf(overGroup);
    if (oldIndex < 0 || newIndex < 0)
        return data;
    return { ...data, groups: arrayMove(groups, oldIndex, newIndex) };
}
export function reorderKeysInGroup(data, group, activeKey, overKey) {
    const keys = [...(data.group_map[group] ?? [])];
    const oldIndex = keys.indexOf(activeKey);
    const newIndex = keys.indexOf(overKey);
    if (oldIndex < 0 || newIndex < 0)
        return data;
    return {
        ...data,
        group_map: { ...data.group_map, [group]: arrayMove(keys, oldIndex, newIndex) },
    };
}
export function moveLinkBetweenGroups(data, key, fromGroup, toGroup, beforeKey) {
    const from = [...(data.group_map[fromGroup] ?? [])].filter((k) => k !== key);
    const to = [...(data.group_map[toGroup] ?? [])].filter((k) => k !== key);
    const insertAt = to.indexOf(beforeKey);
    const nextTo = insertAt < 0 ? [...to, key] : [...to.slice(0, insertAt), key, ...to.slice(insertAt)];
    return {
        ...data,
        group_map: {
            ...data.group_map,
            [fromGroup]: from,
            [toGroup]: nextTo,
        },
    };
}
export function renameGroup(data, oldName, newName) {
    const name = newName.trim();
    if (!name || name === oldName)
        return data;
    const groupList = asStringList(data.groups);
    if (groupList.includes(name))
        return data;
    const groups = groupList.map((g) => (g === oldName ? name : g));
    const gm = { ...data.group_map };
    if (gm[oldName] !== undefined) {
        gm[name] = gm[oldName];
        delete gm[oldName];
    }
    return { ...data, groups, group_map: gm };
}
export function removeGroup(data, group, deleteLinks) {
    const keys = data.group_map[group] ?? [];
    const groups = asStringList(data.groups).filter((g) => g !== group);
    const restMap = { ...data.group_map };
    delete restMap[group];
    if (deleteLinks) {
        const rm = new Set(keys);
        return {
            ...data,
            groups,
            group_map: restMap,
            links: asLinkList(data.links).filter((l) => !rm.has(l.key)),
            tops: ensureUniqueTops(asStringList(data.tops).filter((k) => !rm.has(k))),
        };
    }
    if (groups.length === 0) {
        return data;
    }
    const target = groups[0];
    const nextKeys = [...(restMap[target] ?? []), ...keys];
    return {
        ...data,
        groups,
        group_map: { ...restMap, [target]: nextKeys },
    };
}
//# sourceMappingURL=utils.js.map