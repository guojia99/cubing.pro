import { getDefaultBracketPageSettings } from '@/pages/Tools/TeamMatch/liveUiSettings';
import { getDefaultPkArenaSettings } from '@/pages/Tools/TeamMatch/pkArenaSettings';
import { normalizeSession } from '@/pages/Tools/TeamMatch/sessionFactory';
export const TEAM_MATCH_JSON_FORMAT = 'cubing-pro-team-match';
export const TEAM_MATCH_JSON_VERSION = 1;
function isRecord(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
}
function isTeamMatchSessionShape(v) {
    if (!isRecord(v))
        return false;
    return (typeof v.id === 'string' &&
        typeof v.name === 'string' &&
        Array.isArray(v.schools) &&
        Array.isArray(v.players) &&
        Array.isArray(v.teams));
}
export function buildTeamMatchJsonFile(session, liveUISettings) {
    return {
        format: TEAM_MATCH_JSON_FORMAT,
        version: TEAM_MATCH_JSON_VERSION,
        exportedAt: Date.now(),
        session,
        ...(liveUISettings ? { liveUISettings } : {}),
    };
}
export function parseTeamMatchImport(text) {
    let raw;
    try {
        raw = JSON.parse(text);
    }
    catch {
        throw new Error('不是合法的 JSON');
    }
    if (isRecord(raw) && raw.format === TEAM_MATCH_JSON_FORMAT && raw.session) {
        if (!isTeamMatchSessionShape(raw.session)) {
            throw new Error('JSON 中 session 字段不完整');
        }
        const session = normalizeSession(raw.session);
        let liveUISettings;
        if (raw.liveUISettings && isRecord(raw.liveUISettings)) {
            const li = raw.liveUISettings;
            liveUISettings = {
                bracket: { ...getDefaultBracketPageSettings(), ...li.bracket },
                arena: { ...getDefaultPkArenaSettings(), ...li.arena },
            };
        }
        return { session, liveUISettings };
    }
    if (isTeamMatchSessionShape(raw)) {
        return { session: normalizeSession(raw) };
    }
    throw new Error('无法识别：需要 cubing-pro-team-match 格式，或裸 TeamMatchSession 对象');
}
export function downloadTeamMatchJson(filenameBase, payload) {
    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenameBase.replace(/[/\\?%*:|"<>]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
//# sourceMappingURL=teamMatchJson.js.map