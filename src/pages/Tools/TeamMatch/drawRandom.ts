import type { BracketSlot16, TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { teamSeedingSum } from '@/pages/Tools/TeamMatch/seedingMath';

const SEED_FLAT = [0, 4, 8, 12];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function schoolIdOf(session: TeamMatchSession, teamId: string): string | undefined {
  return session.teams.find((t) => t.id === teamId)?.schoolId;
}

function teamStrength(session: TeamMatchSession, teamId: string): number {
  const team = session.teams.find((t) => t.id === teamId);
  if (!team) return Number.POSITIVE_INFINITY;
  const eventId = session.eventIds[0] ?? '333';
  const { sum, valid } = teamSeedingSum(
    team,
    session.players,
    session.seeding,
    eventId,
    session.seedingPrimary,
  );
  return valid ? sum : Number.POSITIVE_INFINITY;
}

/** 首轮 8 组相邻槽位：成绩相近（排序相邻）的一组尽量放一起；同校尽量不在同一组 */
const INTERNAL_PAIR_SLOTS: [number, number][] = [
  [2, 3],
  [6, 7],
  [10, 11],
  [14, 15],
];

const SEED_OPP_SLOTS = [1, 5, 9, 13];

/** 内部四组配对填入顺序：先 0 与 2，再 1 与 3，使首轮空位尽量分散到左右半区 [0–7] / [8–15] */
const INTERNAL_PAIR_ORDER = [0, 2, 1, 3];

const PROTECTED_SEED_OPP_SLOTS = new Set<number>([...SEED_FLAT, ...SEED_OPP_SLOTS]);

/**
 * 首轮轮空（null）尽量左右半区均衡：在可交换槽位上把 null 与另一侧半区的队伍对换。
 * 有种子时：种子位与种子对位槽 0–3 区、1–5–9–13 等不交换（避免拆种子 vs 对位）。
 * 无种子时：任意 [0–7] / [8–15] 半区对调。
 */
function balanceNullsAcrossHalves(flat: BracketSlot16, protectSeedOppSlots: boolean): void {
  const movable = (i: number): boolean => !protectSeedOppSlots || !PROTECTED_SEED_OPP_SLOTS.has(i);

  function countNulls(lo: number, hi: number): number {
    let n = 0;
    for (let i = lo; i <= hi; i++) if (flat[i] == null) n++;
    return n;
  }

  for (let iter = 0; iter < 64; iter++) {
    const L = countNulls(0, 7);
    const R = countNulls(8, 15);
    if (Math.abs(L - R) <= 1) break;

    if (L > R) {
      let si = -1;
      let ti = -1;
      for (let i = 0; i <= 7; i++) {
        if (flat[i] == null && movable(i)) {
          si = i;
          break;
        }
      }
      for (let i = 8; i <= 15; i++) {
        if (flat[i] != null && movable(i)) {
          ti = i;
          break;
        }
      }
      if (si >= 0 && ti >= 0) {
        const t = flat[si];
        flat[si] = flat[ti];
        flat[ti] = t;
        continue;
      }
      break;
    } else {
      let si = -1;
      let ti = -1;
      for (let i = 8; i <= 15; i++) {
        if (flat[i] == null && movable(i)) {
          si = i;
          break;
        }
      }
      for (let i = 0; i <= 7; i++) {
        if (flat[i] != null && movable(i)) {
          ti = i;
          break;
        }
      }
      if (si >= 0 && ti >= 0) {
        const t = flat[si];
        flat[si] = flat[ti];
        flat[ti] = t;
        continue;
      }
      break;
    }
  }
}

/**
 * 将 8 个队伍按「两两一组」重排，尽量使同校不同组（多轮交换）
 */
function tryPairDifferentSchools(ids: string[], session: TeamMatchSession): string[] {
  const school = (tid: string) => schoolIdOf(session, tid);
  const out = [...ids];
  for (let round = 0; round < 24; round++) {
    let bad = false;
    for (let p = 0; p < 4; p++) {
      const a = out[p * 2];
      const b = out[p * 2 + 1];
      if (!a || !b) continue;
      if (school(a) !== school(b)) continue;
      bad = true;
      for (let q = p + 1; q < 4; q++) {
        const qa = out[q * 2];
        const qb = out[q * 2 + 1];
        if (qb && school(a) !== school(qb)) {
          [out[p * 2 + 1], out[q * 2 + 1]] = [out[q * 2 + 1], out[p * 2 + 1]];
          break;
        }
        if (qa && school(a) !== school(qa)) {
          [out[p * 2 + 1], out[q * 2]] = [out[q * 2], out[p * 2 + 1]];
          break;
        }
      }
    }
    if (!bad) break;
  }
  return out;
}

function permuteOpponentsForSeeds(
  seedTeamIds: TeamMatchSession['seedTeamIds'],
  opp: string[],
  session: TeamMatchSession,
): string[] {
  const school = (tid: string) => schoolIdOf(session, tid);
  const seedSchool = (i: number) => {
    const sid = seedTeamIds[i];
    return sid ? school(sid) : undefined;
  };

  if (opp.length <= 1) return opp;

  function* perms(arr: string[]): Generator<string[]> {
    if (arr.length === 0) {
      yield [];
      return;
    }
    if (arr.length === 1) {
      yield [...arr];
      return;
    }
    for (let i = 0; i < arr.length; i++) {
      const rest = arr.filter((_, j) => j !== i);
      for (const sub of perms(rest)) {
        yield [arr[i], ...sub];
      }
    }
  }

  for (const p of perms(opp)) {
    let ok = true;
    for (let i = 0; i < Math.min(4, p.length); i++) {
      const ss = seedSchool(i);
      if (!ss || !p[i]) continue;
      if (school(p[i]) === ss) {
        ok = false;
        break;
      }
    }
    if (ok) return p;
  }
  return opp;
}

/**
 * 随机分区：种子在四区首位；非种子按成绩排序后，强侧进内部「相近」对位，
 * 较弱侧优先填种子对位；同校队伍首轮尽量避免同场（能换则换）。
 */
export function randomizeDraw(session: TeamMatchSession): TeamMatchSession['regionSlots'] {
  const rng = Math.random;
  const activeTeams = session.teams.filter((t) => !t.disabled && t.playerIds.length === 3);
  const n = activeTeams.length;
  if (n < 8 || n > 16) {
    return session.regionSlots;
  }

  const seeds = session.seedTeamIds.filter(Boolean) as string[];
  const seedSet = new Set(seeds);
  const nonSeedIds = activeTeams.map((t) => t.id).filter((id) => !seedSet.has(id));
  /** 成绩越好（sum 越小）越靠前 */
  const sorted = [...nonSeedIds].sort((a, b) => teamStrength(session, a) - teamStrength(session, b));

  const flat: BracketSlot16 = Array(16).fill(null) as unknown as BracketSlot16;

  for (let r = 0; r < 4; r++) {
    const sid = session.seedTeamIds[r];
    if (sid) flat[r * 4] = sid;
  }

  const seedCount = seeds.length;

  if (seedCount === 0) {
    const mixed = tryPairDifferentSchools(shuffle(sorted, rng), session);
    let idx = 0;
    for (let slot = 0; slot < 16 && idx < mixed.length; slot++) {
      if (flat[slot] != null) continue;
      flat[slot] = mixed[idx];
      idx++;
    }
    balanceNullsAcrossHalves(flat, false);
    return regionsFromFlat(flat);
  }

  const needOpp = Math.min(4, sorted.length);
  const rest = sorted.length - needOpp;
  const internal = sorted.slice(0, rest);
  const oppSeed = sorted.slice(rest, rest + needOpp);

  const internalPaired = internal.length ? tryPairDifferentSchools(internal, session) : [];

  for (let k = 0; k < 4; k++) {
    const p = INTERNAL_PAIR_ORDER[k];
    const a = internalPaired[k * 2];
    const b = internalPaired[k * 2 + 1];
    const [sa, sb] = INTERNAL_PAIR_SLOTS[p];
    if (a) flat[sa] = a;
    if (b) flat[sb] = b;
  }

  const oppOrdered = permuteOpponentsForSeeds(session.seedTeamIds, oppSeed, session);
  for (let i = 0; i < Math.min(4, oppOrdered.length); i++) {
    if (oppOrdered[i]) flat[SEED_OPP_SLOTS[i]] = oppOrdered[i];
  }

  balanceNullsAcrossHalves(flat, true);
  return regionsFromFlat(flat);
}

export function regionsFromFlat(flat: BracketSlot16): TeamMatchSession['regionSlots'] {
  const out: TeamMatchSession['regionSlots'] = [
    flat.slice(0, 4) as BracketSlot16,
    flat.slice(4, 8) as BracketSlot16,
    flat.slice(8, 12) as BracketSlot16,
    flat.slice(12, 16) as BracketSlot16,
  ];
  return out;
}
