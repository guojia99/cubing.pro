/** 两场半决赛均决出胜负时，两名负者 id（用于跳过季军赛时的并列名次） */
export function semiLoserPair(rounds) {
    const r2 = rounds[2];
    if (!r2 || r2.length < 2)
        return null;
    const s0 = r2[0];
    const s1 = r2[1];
    if (!s0?.winnerId || !s1?.winnerId)
        return null;
    const loser = (m) => {
        if (!m.winnerId)
            return null;
        if (m.winnerId === m.teamAId)
            return m.teamBId ?? null;
        return m.teamAId ?? null;
    };
    const la = loser(s0);
    const lb = loser(s1);
    if (!la || !lb)
        return null;
    return [la, lb];
}
/** 淘汰赛 +（未跳过季军赛时）铜牌战均已分出胜负 */
export function isBracketFullyComplete(session) {
    for (const r of session.rounds) {
        for (const m of r) {
            if (m.teamAId && m.teamBId && !m.winnerId)
                return false;
        }
    }
    if (session.skipBronzeMatch)
        return true;
    const b = session.bronzeMatch;
    if (b?.teamAId && b?.teamBId && !b.winnerId)
        return false;
    return true;
}
/** 全部完赛后：决赛冠亚军 + 铜牌或并列第三、四名 */
export function getPodiumTeamIds(session) {
    if (!isBracketFullyComplete(session))
        return null;
    const final = session.rounds[3]?.[0];
    if (!final?.winnerId || !final.teamAId || !final.teamBId)
        return null;
    const gold = final.winnerId;
    const silver = final.winnerId === final.teamAId ? final.teamBId : final.teamAId;
    if (session.skipBronzeMatch) {
        const pair = semiLoserPair(session.rounds);
        if (!pair)
            return null;
        return {
            gold,
            silver,
            bronze: null,
            thirdFourthShared: pair,
        };
    }
    return {
        gold,
        silver,
        bronze: session.bronzeMatch?.winnerId ?? null,
        thirdFourthShared: null,
    };
}
//# sourceMappingURL=bracketComplete.js.map