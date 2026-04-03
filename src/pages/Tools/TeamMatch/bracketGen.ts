import type { BracketMatch, BracketSlot16, TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { v4 as uuidv4 } from 'uuid';

const BRONZE_ID = 'bronze-m0';

/** 半决赛均决出胜负后：负者争铜牌 */
export function syncBronzeFromSemis(
  rounds: BracketMatch[][],
  prev: BracketMatch | null,
): BracketMatch | null {
  const r2 = rounds[2];
  if (!r2 || r2.length < 2) return null;
  const s0 = r2[0];
  const s1 = r2[1];
  if (!s0?.winnerId || !s1?.winnerId) {
    return prev
      ? {
          ...prev,
          teamAId: null,
          teamBId: null,
          winnerId: null,
          pk: null,
          byeWinnerId: null,
        }
      : null;
  }

  const loser = (m: BracketMatch): string | null => {
    if (!m.winnerId) return null;
    if (m.winnerId === m.teamAId) return m.teamBId ?? null;
    return m.teamAId ?? null;
  };
  const la = loser(s0);
  const lb = loser(s1);
  if (!la || !lb) {
    return prev
      ? {
          ...prev,
          teamAId: null,
          teamBId: null,
          winnerId: null,
          pk: null,
          byeWinnerId: null,
        }
      : null;
  }

  const same =
    prev &&
    ((prev.teamAId === la && prev.teamBId === lb) || (prev.teamAId === lb && prev.teamBId === la));
  if (same && prev) {
    return prev;
  }

  return {
    id: BRONZE_ID,
    roundIndex: 4,
    indexInRound: 0,
    teamAId: la,
    teamBId: lb,
    byeWinnerId: null,
    winnerId: null,
    pk: {
      teamAId: la,
      teamBId: lb,
      currentResults: [],
      scoreHistory: [],
      resolution: null,
    },
  };
}

export function syncBronzeToSession(session: TeamMatchSession): TeamMatchSession {
  const bronzeMatch = syncBronzeFromSemis(session.rounds, session.bronzeMatch);
  return { ...session, bronzeMatch };
}

function flatRegions(regionSlots: TeamMatchSession['regionSlots']): BracketSlot16 {
  const out: BracketSlot16 = [...regionSlots[0], ...regionSlots[1], ...regionSlots[2], ...regionSlots[3]];
  return out;
}

/** 从 16 槽生成淘汰赛：相邻配对 (0,1)(2,3)... */
export function buildRoundsFromFlat16(flat: BracketSlot16): BracketMatch[][] {
  const rounds: BracketMatch[][] = [];

  // Round 0: 8 matches
  const r0: BracketMatch[] = [];
  for (let i = 0; i < 8; i++) {
    const a = flat[i * 2] ?? null;
    const b = flat[i * 2 + 1] ?? null;
    const id = `r0-m${i}`;
    let byeWinnerId: string | null = null;
    let pk: BracketMatch['pk'] = null;
    if (a && !b) byeWinnerId = a;
    else if (!a && b) byeWinnerId = b;
    else if (a && b) {
      pk = {
        teamAId: a,
        teamBId: b,
        currentResults: [],
        scoreHistory: [],
        resolution: null,
      };
    }
    r0.push({
      id,
      roundIndex: 0,
      indexInRound: i,
      teamAId: a,
      teamBId: b,
      byeWinnerId,
      winnerId: byeWinnerId,
      pk,
    });
  }
  rounds.push(r0);

  let roundIndex = 1;
  let currentSize = 8;
  while (currentSize > 1) {
    currentSize /= 2;
    const rn: BracketMatch[] = [];
    const prevCount = rounds[roundIndex - 1].length;
    for (let i = 0; i < prevCount / 2; i++) {
      const id = `r${roundIndex}-m${i}`;
      rn.push({
        id,
        roundIndex,
        indexInRound: i,
        teamAId: null,
        teamBId: null,
        byeWinnerId: null,
        winnerId: null,
        pk: null,
      });
    }
    rounds.push(rn);
    roundIndex++;
  }

  return rounds;
}

/**
 * 该对阵节点在签表上是否「整段子树无队」（首轮相邻槽位全为 null）。
 * 用于区分：真双空走廊 vs 因同轮次尚有比赛未结束而被清空的空位（后者不应让兄弟侧一路晋级）。
 */
function isSubtreePermanentDoubleEmptyFromFlat(flat: BracketSlot16, m: BracketMatch): boolean {
  const { roundIndex, indexInRound } = m;
  const span = 1 << roundIndex;
  const r0Start = indexInRound * span;
  const r0End = (indexInRound + 1) * span - 1;
  for (let j = r0Start; j <= r0End; j++) {
    const p = j * 2;
    if (flat[p] !== null || flat[p + 1] !== null) return false;
  }
  return true;
}

/** 将上一轮胜者填入下一轮；双亲齐全时生成 PK。若对阵与上一轮相同则保留已有 pk / winner */
export function advanceWinners(rounds: BracketMatch[][], flat: BracketSlot16): BracketMatch[][] {
  const next = rounds.map((r) =>
    r.map((m) => ({
      ...m,
      pk: m.pk
        ? {
            ...m.pk,
            currentResults: [...m.pk.currentResults],
            scoreHistory: [...m.pk.scoreHistory],
          }
        : null,
    })),
  );
  for (let r = 0; r < next.length - 1; r++) {
    const cur = next[r];
    const nxt = next[r + 1];
    for (let i = 0; i < nxt.length; i++) {
      const left = cur[i * 2];
      const right = cur[i * 2 + 1];
      const wa = left?.winnerId ?? null;
      const wb = right?.winnerId ?? null;
      const nm = nxt[i];
      nm.byeWinnerId = null;

      /** 两侧仍有未决胜的「双队 PK」：下一轮先留空 */
      const pendingPk = (m: BracketMatch | undefined) =>
        !!(m?.teamAId && m.teamBId && !m.winnerId);
      if (pendingPk(left) || pendingPk(right)) {
        nm.teamAId = null;
        nm.teamBId = null;
        nm.winnerId = null;
        nm.pk = null;
        nm.byeWinnerId = null;
        continue;
      }

      if (!wa && !wb) {
        nm.teamAId = null;
        nm.teamBId = null;
        nm.winnerId = null;
        nm.pk = null;
        nm.byeWinnerId = null;
        continue;
      }

      /** 仅一侧有胜者：另一侧签表上为永久双空时直接晋级；若同半区/同子树仍有队伍在比赛，则下一轮先留空 */
      if (!wa || !wb) {
        const team = wa ?? wb;
        const emptyFeeder = wa ? right : left;
        const emptyFromDraw =
          emptyFeeder &&
          !emptyFeeder.teamAId &&
          !emptyFeeder.teamBId &&
          isSubtreePermanentDoubleEmptyFromFlat(flat, emptyFeeder);
        if (!emptyFromDraw) {
          nm.teamAId = null;
          nm.teamBId = null;
          nm.winnerId = null;
          nm.pk = null;
          nm.byeWinnerId = null;
          continue;
        }
        nm.teamAId = team;
        nm.teamBId = null;
        nm.byeWinnerId = team;
        nm.winnerId = team;
        nm.pk = null;
        continue;
      }

      const sameTeam = nm.teamAId === wa && nm.teamBId === wb;
      nm.teamAId = wa;
      nm.teamBId = wb;

      if (sameTeam && nm.pk) {
        continue;
      }
      nm.winnerId = null;
      nm.pk = {
        teamAId: wa,
        teamBId: wb,
        currentResults: [],
        scoreHistory: [],
        resolution: null,
      };
    }
  }
  return next;
}

export function rebuildBracketFromSession(session: TeamMatchSession): TeamMatchSession {
  const flat = session.flatSlots ?? flatRegions(session.regionSlots);
  let rounds = buildRoundsFromFlat16(flat);
  rounds = advanceWinners(rounds, flat);
  const bronzeMatch = syncBronzeFromSemis(rounds, session.bronzeMatch);
  return {
    ...session,
    flatSlots: flat,
    rounds,
    bronzeMatch,
  };
}

/** 将 region 4×4 转为 flat（行优先：每区 4 槽） */
export function regionsToFlat(regionSlots: TeamMatchSession['regionSlots']): BracketSlot16 {
  return flatRegions(regionSlots);
}

export function newSnapshotId(): string {
  return uuidv4();
}
