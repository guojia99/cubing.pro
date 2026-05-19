import { formatPkLineForPlayer } from '@/pages/Tools/TeamMatch/pkSettlement';
export function buildPkArenaHeroDetail(p, team, currentResults) {
    return {
        name: p.name,
        avatarDataUrl: p.avatarDataUrl,
        schoolName: p.schoolName,
        teamName: team.name,
        seedScoresLine: p.scoresLine,
        pkResultLine: formatPkLineForPlayer(currentResults, p.id),
        playerBattlecry: p.playerBattlecry,
        teamBattlecry: (team.battlecry ?? '').trim(),
        wcaId: p.wcaId,
    };
}
//# sourceMappingURL=pkArenaHeroBuild.js.map