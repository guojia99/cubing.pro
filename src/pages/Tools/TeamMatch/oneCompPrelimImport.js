import { fetchOneCompGrades, wcaEventIdToOneEid, } from '@/pages/Tools/TeamMatch/oneGradeApi';
import { mergeSeeding } from '@/pages/Tools/TeamMatch/sessionReducer';
import { resolveOfficialScores } from '@/pages/Tools/TeamMatch/seedingScorePick';
import { wcaCentisecondsToSeconds } from '@/pages/Tools/TeamMatch/wcaSeeding';
function defaultEntry(playerId, eventId) {
    return {
        playerId,
        eventId,
        single: null,
        average: null,
        adoptStrategy: undefined,
        wcaBest: null,
        oneBest: null,
        preliminary: null,
    };
}
function parseOneCompTimeField(s) {
    const t = s.trim().toLowerCase();
    if (t === 'd' || t === 'dnf')
        return 'DNF';
    if (!t)
        return null;
    const n = parseInt(t, 10);
    if (!Number.isFinite(n) || n <= 0)
        return null;
    return wcaCentisecondsToSeconds(n);
}
export function oneCompRowToPreliminary(row) {
    return {
        single: parseOneCompTimeField(row.t_single),
        average: parseOneCompTimeField(row.t_avg),
    };
}
function rankAvgCenti(tAvg) {
    const t = tAvg.trim().toLowerCase();
    if (t === 'd' || t === 'dnf' || !t)
        return Infinity;
    const n = parseInt(t, 10);
    return Number.isFinite(n) && n > 0 ? n : Infinity;
}
/** 同一 u_id 多条时保留平均更好（百分之一秒更小）的一条（u_id 与选手 oneId 对应，为比赛中的选手） */
export function mergeDuplicateUidRows(rows) {
    const m = new Map();
    for (const r of rows) {
        const uid = Number(r.u_id);
        if (!Number.isFinite(uid))
            continue;
        const prev = m.get(uid);
        if (!prev) {
            m.set(uid, r);
            continue;
        }
        if (rankAvgCenti(r.t_avg) < rankAvgCenti(prev.t_avg)) {
            m.set(uid, r);
        }
    }
    return m;
}
/**
 * 拉取数据并生成预览（不写 session）：按 API 行字段 **u_id**（参赛选手）与本地选手 **oneId** 对齐。
 */
export async function fetchOneCompPrelimPreview(session, cId, eRound) {
    const playerOneIds = new Set(session.players
        .map((p) => p.oneId?.trim())
        .filter((x) => !!x && /^\d+$/.test(x))
        .map((x) => Number(x)));
    const events = [];
    const unassignedApi = [];
    const seenUnassigned = new Set();
    for (const ev of session.eventIds) {
        const eid = wcaEventIdToOneEid(ev);
        if (eid === null)
            continue;
        const rows = await fetchOneCompGrades(cId, eid, eRound);
        const byUid = mergeDuplicateUidRows(rows);
        const playerRows = session.players.map((p) => {
            const oid = p.oneId?.trim();
            if (!oid || !/^\d+$/.test(oid)) {
                return { player: p, status: 'no_one_id', row: null, preliminary: null };
            }
            const row = byUid.get(Number(oid));
            if (!row) {
                return { player: p, status: 'no_result', row: null, preliminary: null };
            }
            return {
                player: p,
                status: 'matched',
                row,
                preliminary: oneCompRowToPreliminary(row),
            };
        });
        for (const [uid, row] of byUid) {
            if (!playerOneIds.has(uid)) {
                const key = `${eid}-${uid}`;
                if (!seenUnassigned.has(key)) {
                    seenUnassigned.add(key);
                    unassignedApi.push({
                        eventId: ev,
                        eidOne: eid,
                        u_id: uid,
                        u_name: row.u_name,
                        t_single: row.t_single,
                        t_avg: row.t_avg,
                    });
                }
            }
        }
        events.push({ eventId: ev, eidOne: eid, playerRows });
    }
    return { events, unassignedApi };
}
/**
 * 从 One 指定比赛拉取各项目轮次成绩，按 API **u_id** 与选手 **oneId** 匹配，写入「初赛」列，并按 adoptStrategy 重算正式成绩。
 * 先 mergeSeeding，避免尚未有条目的选手在导入后丢失成绩行。
 */
export async function fetchAndApplyOneCompPreliminary(session, cId, eRound) {
    const players = session.players;
    const mergedBase = mergeSeeding(session.seeding, players, session.eventIds);
    const map = new Map(mergedBase.map((e) => [`${e.playerId}:${e.eventId}`, { ...e }]));
    for (const ev of session.eventIds) {
        const eid = wcaEventIdToOneEid(ev);
        if (eid === null)
            continue;
        const rows = await fetchOneCompGrades(cId, eid, eRound);
        const byUid = mergeDuplicateUidRows(rows);
        for (const p of players) {
            const oid = p.oneId?.trim();
            if (!oid || !/^\d+$/.test(oid))
                continue;
            const row = byUid.get(Number(oid));
            if (!row)
                continue;
            const pre = oneCompRowToPreliminary(row);
            const k = `${p.id}:${ev}`;
            const base = map.get(k) ?? defaultEntry(p.id, ev);
            const next = {
                ...base,
                preliminary: pre,
            };
            const strat = next.adoptStrategy ?? 'best_average';
            let resolved = resolveOfficialScores(strat, next.wcaBest, next.oneBest, pre);
            if (!resolved && strat !== 'manual') {
                resolved = resolveOfficialScores('best_average', next.wcaBest, next.oneBest, pre);
            }
            if (!resolved && strat !== 'manual' && pre && (pre.single !== null || pre.average !== null)) {
                resolved = resolveOfficialScores('preliminary', null, null, pre);
            }
            if (strat !== 'manual' && resolved) {
                next.single = resolved.single;
                next.average = resolved.average;
                next.activeSource = resolved.activeSource;
            }
            map.set(k, next);
        }
    }
    return [...map.values()].filter((e) => players.some((pl) => pl.id === e.playerId) && session.eventIds.includes(e.eventId));
}
//# sourceMappingURL=oneCompPrelimImport.js.map