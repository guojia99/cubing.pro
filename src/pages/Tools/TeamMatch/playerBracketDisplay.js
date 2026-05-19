export function fmtSeedingVal(v) {
    if (v === 'DNF')
        return 'DNF';
    if (v === null || v === undefined)
        return '—';
    return String(v);
}
export function seedingEntryForPlayer(seeding, playerId, eventId) {
    return seeding.find((e) => e.playerId === playerId && e.eventId === eventId);
}
/** 当前项目下正式录入的「最佳」单次 / 平均（与成绩录入表一致） */
export function formatPlayerSingleAverageLine(entry) {
    if (!entry)
        return `单次 ${fmtSeedingVal(null)} · 平均 ${fmtSeedingVal(null)}`;
    return `单次 ${fmtSeedingVal(entry.single)} · 平均 ${fmtSeedingVal(entry.average)}`;
}
export function schoolNameForPlayer(player, schools) {
    if (!player)
        return '—';
    return schools.find((s) => s.id === player.schoolId)?.name ?? '—';
}
//# sourceMappingURL=playerBracketDisplay.js.map