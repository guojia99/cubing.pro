import type { BracketSlot16, TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { MIN_TEAMS } from '@/pages/Tools/TeamMatch/types';
import { schoolIdForDrawPairing } from '@/pages/Tools/TeamMatch/teamClassify';
import { rankedBracketTeamIds, teamSeedingSum } from '@/pages/Tools/TeamMatch/seedingMath';

const SEED_FLAT = [0, 4, 8, 12];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

/**
 * 在「合计平均」有效（三人正式平均之和可算）的非种子队中，取合计平均最大（最弱）的至多 2 支。
 * 无合计平均的队伍不参与「最差」判定，视为种子之下的非种子，可进种子对位池。
 */
function worstTwoByValidAverageSum(nonSeedIds: string[], session: TeamMatchSession): Set<string> {
  const eventId = session.eventIds[0] ?? '333';
  const rows: { id: string; sum: number }[] = [];
  for (const id of nonSeedIds) {
    const t = session.teams.find((x) => x.id === id);
    if (!t) continue;
    const { sum, valid } = teamSeedingSum(t, session.players, session.seeding, eventId, 'average');
    if (valid) rows.push({ id, sum });
  }
  rows.sort((a, b) => b.sum - a.sum);
  return new Set(rows.slice(0, 2).map((r) => r.id));
}

/**
 * 按主排序总分升序（sum 越小越强，强队在前列）排好后，再按固定段长分段、段内随机打乱。
 * 同段内队伍名次相邻、成绩通常更接近；整体仍保持大致强弱顺序；首轮「同校避战」仍由后续逻辑处理。
 */
const SCORE_DRAW_BAND_SIZE = 4;

function shuffleWithinStrengthBands(
  ids: string[],
  session: TeamMatchSession,
  rng: () => number,
): string[] {
  const sorted = [...ids].sort((a, b) => teamStrength(session, a) - teamStrength(session, b));
  const out: string[] = [];
  for (let i = 0; i < sorted.length; i += SCORE_DRAW_BAND_SIZE) {
    const chunk = sorted.slice(i, i + SCORE_DRAW_BAND_SIZE);
    out.push(...shuffle(chunk, rng));
  }
  return out;
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
    for (let i = lo; i <= hi; i++) if (flat[i] === null) n++;
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
        if (flat[i] === null && movable(i)) {
          si = i;
          break;
        }
      }
      for (let i = 8; i <= 15; i++) {
        if (flat[i] !== null && movable(i)) {
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
        if (flat[i] === null && movable(i)) {
          si = i;
          break;
        }
      }
      for (let i = 0; i <= 7; i++) {
        if (flat[i] !== null && movable(i)) {
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
  const school = (tid: string) => schoolIdForDrawPairing(session, tid);
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
  const school = (tid: string) => schoolIdForDrawPairing(session, tid);
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

export function regionsFromFlat(flat: BracketSlot16): TeamMatchSession['regionSlots'] {
  const out: TeamMatchSession['regionSlots'] = [
    flat.slice(0, 4) as BracketSlot16,
    flat.slice(4, 8) as BracketSlot16,
    flat.slice(8, 12) as BracketSlot16,
    flat.slice(12, 16) as BracketSlot16,
  ];
  return out;
}

/**
 * 有种子时：将非种子拆成「内部槽位组」与「种子对位」两组。
 * - 「按成绩」：可剔除有合计平均的最差 2 队不进种子对位（人数够时）；对位池按主排序取相对弱侧后再段内随机。
 * - 「完全随机」：非种子一次打乱后按前/后段切分，不按成绩排序、不剔尾巴，仅后续首轮避战逻辑仍生效。
 */
function splitNonSeedsForSeedBracket(
  nonSeedIds: string[],
  session: TeamMatchSession,
  mode: 'score' | 'pure',
  rng: () => number,
): { internal: string[]; oppSeed: string[] } {
  const n = nonSeedIds.length;
  const needOpp = Math.min(4, n);
  const rest = n - needOpp;

  if (mode === 'pure') {
    const ordered = shuffle([...nonSeedIds], rng);
    return {
      internal: ordered.slice(0, rest),
      oppSeed: ordered.slice(rest, rest + needOpp),
    };
  }

  const excludeFromOppWorst = worstTwoByValidAverageSum(nonSeedIds, session);
  const eligibleForOpp = nonSeedIds.filter((id) => !excludeFromOppWorst.has(id));

  if (eligibleForOpp.length >= needOpp) {
    const sortedEligible = [...eligibleForOpp].sort((a, b) => teamStrength(session, a) - teamStrength(session, b));
    const pool = sortedEligible.slice(-needOpp);
    const oppSeed = shuffleWithinStrengthBands(pool, session, rng);
    const oset = new Set(oppSeed);
    const internalIds = nonSeedIds.filter((id) => !oset.has(id));
    const internal = shuffleWithinStrengthBands(internalIds, session, rng);
    return { internal, oppSeed };
  }

  const ordered = shuffleWithinStrengthBands(nonSeedIds, session, rng);
  return {
    internal: ordered.slice(0, rest),
    oppSeed: ordered.slice(rest, rest + needOpp),
  };
}

/**
 * 随机分区：种子在四区首位；非种子按模式排列后填入（按成绩或完全随机），
 * 可选首轮同校避战；有种子时内部/对位槽分配逻辑与原先一致（仅排序来源不同）。
 * 「按成绩」时：先按总分排序，再在相邻若干队（默认 4 队）内随机打乱，避免完全钉死且同段实力相近。
 * 有种子且为「按成绩」时：可有合计平均的最差 2 支不进种子对位（除非凑不满对位）。「完全随机」无此项。
 */
export function randomizeDraw(session: TeamMatchSession): TeamMatchSession['regionSlots'] {
  const rng = Math.random;
  const avoid = session.drawAvoidSameSchool ?? true;
  const mode = session.drawRandomMode ?? 'score';
  const eventId = session.eventIds[0] ?? '333';
  const bracketIds = rankedBracketTeamIds(
    session.teams,
    session.players,
    session.seeding,
    eventId,
    session.seedingPrimary,
  );
  const n = bracketIds.length;
  if (n < MIN_TEAMS) {
    return session.regionSlots;
  }

  const bracketIdSet = new Set(bracketIds);
  const seedTeamIdsBracket: TeamMatchSession['seedTeamIds'] = [
    session.seedTeamIds[0] && bracketIdSet.has(session.seedTeamIds[0]) ? session.seedTeamIds[0] : null,
    session.seedTeamIds[1] && bracketIdSet.has(session.seedTeamIds[1]) ? session.seedTeamIds[1] : null,
    session.seedTeamIds[2] && bracketIdSet.has(session.seedTeamIds[2]) ? session.seedTeamIds[2] : null,
    session.seedTeamIds[3] && bracketIdSet.has(session.seedTeamIds[3]) ? session.seedTeamIds[3] : null,
  ];

  const seeds = seedTeamIdsBracket.filter(Boolean) as string[];
  const seedSet = new Set(seeds);
  const nonSeedIds = bracketIds.filter((id) => !seedSet.has(id));
  /** 无种子时：按成绩为段内随机后的顺序；有种子时在 split 内处理 */
  const orderedNoSeeds =
    mode === 'pure'
      ? shuffle([...nonSeedIds], rng)
      : shuffleWithinStrengthBands(nonSeedIds, session, rng);

  const flat: BracketSlot16 = Array(16).fill(null) as unknown as BracketSlot16;

  for (let r = 0; r < 4; r++) {
    const sid = seedTeamIdsBracket[r];
    if (sid) flat[r * 4] = sid;
  }

  const seedCount = seeds.length;

  if (seedCount === 0) {
    /** 完全随机只打乱一次；按成绩已在 orderedNoSeeds 中段内随机，此处再洗一遍保持与旧行为接近 */
    const shuffled = mode === 'pure' ? orderedNoSeeds : shuffle(orderedNoSeeds, rng);
    const mixed = avoid ? tryPairDifferentSchools(shuffled, session) : shuffled;
    let idx = 0;
    for (let slot = 0; slot < 16 && idx < mixed.length; slot++) {
      if (flat[slot] !== null) continue;
      flat[slot] = mixed[idx];
      idx++;
    }
    balanceNullsAcrossHalves(flat, false);
    return regionsFromFlat(flat);
  }

  const { internal, oppSeed } = splitNonSeedsForSeedBracket(nonSeedIds, session, mode, rng);

  const internalPaired = internal.length
    ? avoid
      ? tryPairDifferentSchools(internal, session)
      : shuffle([...internal], rng)
    : [];

  for (let k = 0; k < 4; k++) {
    const p = INTERNAL_PAIR_ORDER[k];
    const a = internalPaired[k * 2];
    const b = internalPaired[k * 2 + 1];
    const [sa, sb] = INTERNAL_PAIR_SLOTS[p];
    if (a) flat[sa] = a;
    if (b) flat[sb] = b;
  }

  const oppOrdered = avoid
    ? permuteOpponentsForSeeds(seedTeamIdsBracket, oppSeed, session)
    : shuffle([...oppSeed], rng);
  for (let i = 0; i < Math.min(4, oppOrdered.length); i++) {
    if (oppOrdered[i]) flat[SEED_OPP_SLOTS[i]] = oppOrdered[i];
  }

  balanceNullsAcrossHalves(flat, true);
  return regionsFromFlat(flat);
}
