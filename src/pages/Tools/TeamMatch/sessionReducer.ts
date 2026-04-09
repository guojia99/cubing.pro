import {
  advanceWinners,
  newSnapshotId,
  rebuildBracketFromSession,
  regionsToFlat,
  syncBronzeToSession,
} from '@/pages/Tools/TeamMatch/bracketGen';
import { randomizeDraw } from '@/pages/Tools/TeamMatch/drawRandom';
import {
  buildElimGroupMatches,
  defaultEliminationState,
  groupTeamIdsRandom,
  isEliminationGroupMatch,
} from '@/pages/Tools/TeamMatch/eliminationDraw';
import { computeMainBracketTeamIds } from '@/pages/Tools/TeamMatch/eliminationResolve';
import { appendMockGroups, buildMockTeamMatchData16 } from '@/pages/Tools/TeamMatch/mockLocal';
import { computeMultiTeamPkSettlement, computePkSettlement } from '@/pages/Tools/TeamMatch/pkSettlement';
import { allRankedActiveTeamIds, pickSeedTeamIds } from '@/pages/Tools/TeamMatch/seedingMath';
import { createEmptySession, normalizeSession } from '@/pages/Tools/TeamMatch/sessionFactory';
import type {
  BracketMatch,
  EliminationGroupMatch,
  ElimGroupPkState,
  Player,
  PkMatchState,
  PkPlayerResult,
  School,
  SeedingEntry,
  Team,
  TeamMatchSession,
} from '@/pages/Tools/TeamMatch/types';
import {
  MAX_ELIMINATION_BYE_TEAMS,
  TEAM_PLAYERS,
  WIZARD_STEP_MAIN_DRAW,
  WIZARD_STEP_MAIN_LIVE,
  type ElimGroupSize,
} from '@/pages/Tools/TeamMatch/types';
export type TeamMatchAction =
  | { type: 'RESET_SESSION'; session: TeamMatchSession }
  | { type: 'MOCK_FILL_TEST_DATA' }
  | { type: 'MOCK_APPEND_GROUPS'; count: number }
  | { type: 'SET_NAME'; name: string }
  | { type: 'SET_WIZARD_STEP'; step: number }
  | { type: 'SET_STATUS'; status: TeamMatchSession['status'] }
  | { type: 'SET_EVENT_IDS'; eventIds: string[] }
  | { type: 'SET_SEEDING_PRIMARY'; primary: TeamMatchSession['seedingPrimary'] }
  | { type: 'SET_DRAW_RANDOM_MODE'; mode: TeamMatchSession['drawRandomMode'] }
  | { type: 'SET_DRAW_AVOID_SAME_SCHOOL'; value: boolean }
  | { type: 'SET_SEED_TEAM_IDS'; seedTeamIds: TeamMatchSession['seedTeamIds'] }
  | { type: 'UPSERT_SCHOOLS'; schools: School[] }
  | { type: 'UPSERT_PLAYERS'; players: Player[] }
  | { type: 'UPSERT_TEAMS'; teams: Team[] }
  | { type: 'DELETE_TEAM'; teamId: string }
  | { type: 'SET_TEAM_DISABLED'; teamId: string; disabled: boolean }
  | { type: 'SET_SEEDING'; seeding: SeedingEntry[] }
  | { type: 'SET_ONE_COMP_IMPORT'; value: TeamMatchSession['oneCompImport'] }
  | { type: 'COMPUTE_SEED_TEAMS' }
  | { type: 'RANDOMIZE_DRAW' }
  | { type: 'REBUILD_BRACKET' }
  | { type: 'SET_SKIP_BRONZE_MATCH'; value: boolean }
  | { type: 'SET_UI_FOCUS'; matchId: string | null }
  | { type: 'SET_PK_DRAFT'; matchId: string; results: PkPlayerResult[] }
  | {
      type: 'PK_SETTLE';
      matchId: string;
      results: PkPlayerResult[];
    }
  | { type: 'PK_MANUAL_WINNER'; matchId: string; winnerTeamId: string }
  | { type: 'PK_REPLAY'; matchId: string }
  | { type: 'PK_CLEAR_CURRENT'; matchId: string }
  | { type: 'SET_MATCH_WINNER'; matchId: string; winnerTeamId: string }
  | { type: 'ENSURE_ELIMINATION_STATE' }
  | { type: 'SET_ELIM_GROUP_SIZE'; value: ElimGroupSize }
  | { type: 'SET_ELIM_BYE_TEAM_IDS'; teamIds: string[] }
  | { type: 'SKIP_ELIMINATION_TO_MAIN_DRAW' }
  | { type: 'RANDOMIZE_ELIM_DRAW' }
  /** 在「正赛名单确认」页提交：写入 16 强、清空分区、进入正赛抽签 */
  | { type: 'CONFIRM_MAIN_BRACKET_POOL' };

function touch(s: TeamMatchSession): TeamMatchSession {
  return { ...normalizeSession(s), updatedAt: Date.now() };
}

function emptyRosterRegionSlots(): TeamMatchSession['regionSlots'] {
  const row = [null, null, null, null] as TeamMatchSession['regionSlots'][0];
  return [row, row, row, row];
}

/** 队伍确认（step≥3）之后任意队伍/种子变更：清空预选赛、正赛名单与对阵，回到队伍确认 */
function resetDownstreamAfterRosterEdit(s: TeamMatchSession): TeamMatchSession {
  if (s.wizardStep < 3) return s;
  const wasLiveOrLater = s.wizardStep >= WIZARD_STEP_MAIN_LIVE;
  return {
    ...s,
    wizardStep: 3,
    status: wasLiveOrLater ? 'draft' : s.status,
    elimination: null,
    mainBracketTeamIds: null,
    regionSlots: emptyRosterRegionSlots(),
    flatSlots: null,
    rounds: [],
    bronzeMatch: null,
    skipBronzeMatch: false,
    drawVersion: 0,
    uiFocusMatchId: null,
  };
}

/** 保证每位选手 × 每个比赛项目都有一条 seeding（供初赛导入等合并写入） */
export function mergeSeeding(prev: SeedingEntry[], players: Player[], eventIds: string[]): SeedingEntry[] {
  const map = new Map<string, SeedingEntry>();
  for (const e of prev) {
    map.set(`${e.playerId}:${e.eventId}`, e);
  }
  for (const p of players) {
    for (const ev of eventIds) {
      const k = `${p.id}:${ev}`;
      if (!map.has(k)) {
        map.set(k, {
          playerId: p.id,
          eventId: ev,
          single: null,
          average: null,
          adoptStrategy: undefined,
          wcaBest: null,
          oneBest: null,
          preliminary: null,
        });
      }
    }
  }
  return [...map.values()].filter(
    (e) => players.some((p) => p.id === e.playerId) && eventIds.includes(e.eventId),
  );
}

function findMatch(
  session: TeamMatchSession,
  matchId: string,
): BracketMatch | EliminationGroupMatch | undefined {
  const elim = session.elimination?.matches?.find((x) => x.id === matchId);
  if (elim) return elim;
  if (session.bronzeMatch?.id === matchId) return session.bronzeMatch;
  for (const round of session.rounds) {
    const m = round.find((x) => x.id === matchId);
    if (m) return m;
  }
  return undefined;
}

function isEliminationMatchId(session: TeamMatchSession, matchId: string): boolean {
  return !!session.elimination?.matches?.some((x) => x.id === matchId);
}

function mapRounds(session: TeamMatchSession, fn: (m: BracketMatch) => BracketMatch): TeamMatchSession {
  const rounds = session.rounds.map((r) => r.map(fn));
  return { ...session, rounds };
}

function setMatch(session: TeamMatchSession, matchId: string, patch: Partial<BracketMatch>): TeamMatchSession {
  if (session.bronzeMatch?.id === matchId) {
    return { ...session, bronzeMatch: { ...session.bronzeMatch, ...patch } };
  }
  return mapRounds(session, (m) => (m.id === matchId ? { ...m, ...patch } : m));
}

function patchBracketOrElimMatch(
  session: TeamMatchSession,
  matchId: string,
  patch: Partial<BracketMatch> | Partial<EliminationGroupMatch>,
): TeamMatchSession {
  const elim = session.elimination;
  if (elim?.matches?.length) {
    const idx = elim.matches.findIndex((m) => m.id === matchId);
    if (idx >= 0) {
      const cur = elim.matches[idx];
      const merged = { ...cur, ...patch } as EliminationGroupMatch;
      const matches = elim.matches.map((m, i) => (i === idx ? merged : m));
      return { ...session, elimination: { ...elim, matches } };
    }
  }
  return setMatch(session, matchId, patch as Partial<BracketMatch>);
}

function cascadeRounds(session: TeamMatchSession): TeamMatchSession {
  if (!session.rounds.length) return session;
  const flat = session.flatSlots ?? regionsToFlat(session.regionSlots);
  const rounds = advanceWinners(session.rounds.map((r) => r.map((m) => ({ ...m }))), flat);
  return syncBronzeToSession({ ...session, rounds });
}

export function reduceSession(session: TeamMatchSession, action: TeamMatchAction): TeamMatchSession {
  let next = session;

  switch (action.type) {
    case 'RESET_SESSION':
      return touch(action.session);
    case 'SET_NAME':
      next = { ...next, name: action.name };
      break;
    case 'MOCK_FILL_TEST_DATA': {
      const { schools, players, teams } = buildMockTeamMatchData16();
      let seeding = mergeSeeding([], players, next.eventIds);
      seeding = seeding.map((e) => ({
        ...e,
        single: Math.round((9 + Math.random() * 8) * 100) / 100,
        average: Math.round((10 + Math.random() * 8) * 100) / 100,
      }));
      next = {
        ...next,
        name: next.name?.trim() ? next.name : '测试比赛',
        schools,
        players,
        teams,
        seeding,
        seedTeamIds: [null, null, null, null],
        regionSlots: [
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
        ],
        flatSlots: null,
        rounds: [],
        bronzeMatch: null,
        skipBronzeMatch: false,
        drawVersion: 0,
        mainBracketTeamIds: null,
        elimination: null,
      };
      break;
    }
    case 'MOCK_APPEND_GROUPS': {
      const { schools: addSchools, players: addPlayers, teams: addTeams } = appendMockGroups(
        next,
        action.count,
      );
      if (addTeams.length === 0) break;
      const newIds = new Set(addPlayers.map((p) => p.id));
      const players = [...next.players, ...addPlayers];
      const schools = [...next.schools, ...addSchools];
      const teams = [...next.teams, ...addTeams];
      let seeding = mergeSeeding(next.seeding, players, next.eventIds);
      seeding = seeding.map((e) => {
        if (!newIds.has(e.playerId)) return e;
        return {
          ...e,
          single: Math.round((9 + Math.random() * 8) * 100) / 100,
          average: Math.round((10 + Math.random() * 8) * 100) / 100,
        };
      });
      next = { ...next, schools, players, teams, seeding };
      if (next.wizardStep >= 3) next = resetDownstreamAfterRosterEdit(next);
      break;
    }
    case 'SET_WIZARD_STEP':
      next = { ...next, wizardStep: action.step };
      break;
    case 'SET_STATUS':
      next = { ...next, status: action.status };
      break;
    case 'SET_EVENT_IDS':
      next = {
        ...next,
        eventIds: action.eventIds,
        seeding: mergeSeeding(next.seeding, next.players, action.eventIds),
      };
      break;
    case 'SET_SEEDING_PRIMARY':
      next = { ...next, seedingPrimary: action.primary };
      break;
    case 'SET_DRAW_RANDOM_MODE':
      next = { ...next, drawRandomMode: action.mode };
      break;
    case 'SET_DRAW_AVOID_SAME_SCHOOL':
      next = { ...next, drawAvoidSameSchool: action.value };
      break;
    case 'SET_SEED_TEAM_IDS': {
      const ids = action.seedTeamIds;
      const set = new Set(ids.filter(Boolean) as string[]);
      next = {
        ...next,
        seedTeamIds: ids,
        teams: next.teams.map((t) => ({ ...t, isSeed: set.has(t.id) })),
      };
      if (next.wizardStep >= 3) next = resetDownstreamAfterRosterEdit(next);
      break;
    }
    case 'UPSERT_SCHOOLS':
      next = { ...next, schools: action.schools };
      break;
    case 'UPSERT_PLAYERS':
      next = {
        ...next,
        players: action.players,
        seeding: mergeSeeding(next.seeding, action.players, next.eventIds),
      };
      break;
    case 'UPSERT_TEAMS': {
      next = { ...next, teams: action.teams };
      if (next.wizardStep >= 3) next = resetDownstreamAfterRosterEdit(next);
      break;
    }
    case 'DELETE_TEAM': {
      const id = action.teamId;
      const teams = next.teams.filter((t) => t.id !== id);
      const seedTeamIds = next.seedTeamIds.map((sid) => (sid === id ? null : sid)) as TeamMatchSession['seedTeamIds'];
      const seedSet = new Set(seedTeamIds.filter(Boolean));
      const teamsWithSeed = teams.map((t) => ({ ...t, isSeed: seedSet.has(t.id) }));
      const mapSlot = (tid: string | null) => (tid === id ? null : tid);
      const regionSlots = next.regionSlots.map((row) =>
        row.map(mapSlot),
      ) as TeamMatchSession['regionSlots'];
      const flatSlots = next.flatSlots ? (next.flatSlots.map(mapSlot) as typeof next.flatSlots) : null;
      let patched: TeamMatchSession = {
        ...next,
        teams: teamsWithSeed,
        seedTeamIds,
        regionSlots,
        flatSlots,
      };
      if (patched.rounds.length) {
        patched = rebuildBracketFromSession(patched);
      }
      if (patched.elimination) {
        const e = patched.elimination;
        const byeTeamIds = e.byeTeamIds.filter((tid) => tid !== id);
        const touched =
          e.byeTeamIds.includes(id) || e.matches.some((m) => m.teamIds.includes(id));
        patched = {
          ...patched,
          elimination: touched
            ? {
                ...e,
                byeTeamIds,
                matches: [],
                waveSizes: [],
                drawVersion: 0,
                naturalByeTeamIds: [],
                naturalByeTeamId: null,
              }
            : { ...e, byeTeamIds },
          mainBracketTeamIds: patched.mainBracketTeamIds?.filter((tid) => tid !== id) ?? null,
        };
      }
      next = patched;
      if (next.wizardStep >= 3) next = resetDownstreamAfterRosterEdit(next);
      break;
    }
    case 'SET_TEAM_DISABLED':
      next = {
        ...next,
        teams: next.teams.map((t) => (t.id === action.teamId ? { ...t, disabled: action.disabled } : t)),
      };
      if (next.wizardStep >= 3) next = resetDownstreamAfterRosterEdit(next);
      break;
    case 'SET_SEEDING':
      next = { ...next, seeding: action.seeding };
      break;
    case 'SET_ONE_COMP_IMPORT':
      next = { ...next, oneCompImport: action.value };
      break;
    case 'ENSURE_ELIMINATION_STATE': {
      if (!next.elimination) {
        next = { ...next, elimination: defaultEliminationState(next) };
      }
      break;
    }
    case 'SET_ELIM_GROUP_SIZE': {
      const base = next.elimination ?? defaultEliminationState(next);
      next = { ...next, elimination: { ...base, groupSize: action.value } };
      break;
    }
    case 'SET_ELIM_BYE_TEAM_IDS': {
      const base = next.elimination ?? defaultEliminationState(next);
      const eventId = next.eventIds[0] ?? '333';
      const ranked = new Set(
        allRankedActiveTeamIds(next.teams, next.players, next.seeding, eventId, next.seedingPrimary),
      );
      const uniq = [...new Set(action.teamIds)].filter((id) => ranked.has(id)).slice(0, MAX_ELIMINATION_BYE_TEAMS);
      next = { ...next, elimination: { ...base, byeTeamIds: uniq } };
      break;
    }
    case 'SKIP_ELIMINATION_TO_MAIN_DRAW': {
      const elimBase = next.elimination ?? defaultEliminationState(next);
      const skippedElim = {
        ...elimBase,
        skipped: true,
        matches: [],
        waveSizes: [],
        drawVersion: 0,
        naturalByeTeamIds: [],
        naturalByeTeamId: null,
      };
      next = {
        ...next,
        elimination: skippedElim,
        mainBracketTeamIds: null,
        regionSlots: emptyRosterRegionSlots(),
        flatSlots: null,
        rounds: [],
        bronzeMatch: null,
        drawVersion: 0,
      };
      break;
    }
    case 'RANDOMIZE_ELIM_DRAW': {
      const base = next.elimination ?? defaultEliminationState(next);
      const eventId = next.eventIds[0] ?? '333';
      const all = allRankedActiveTeamIds(next.teams, next.players, next.seeding, eventId, next.seedingPrimary);
      const byeSet = new Set(base.byeTeamIds);
      const competitors = all.filter((id) => !byeSet.has(id));
      const { groups, naturalByeTeamIds } = groupTeamIdsRandom(competitors, base.groupSize, Math.random);
      const waveSizes = groups.length > 0 ? [groups.length] : [];
      const matches = groups.length > 0 ? buildElimGroupMatches(groups, waveSizes) : [];
      next = {
        ...next,
        elimination: {
          ...base,
          skipped: false,
          matches,
          waveSizes,
          naturalByeTeamIds,
          naturalByeTeamId: naturalByeTeamIds[0] ?? null,
          drawVersion: base.drawVersion + 1,
        },
        uiFocusMatchId: null,
      };
      break;
    }
    case 'CONFIRM_MAIN_BRACKET_POOL': {
      const mainIds = computeMainBracketTeamIds(next);
      const eventId = next.eventIds[0] ?? '333';
      const picked = pickSeedTeamIds(
        next.teams,
        next.players,
        next.seeding,
        eventId,
        next.seedingPrimary,
        mainIds,
      );
      const seedTeamIds: TeamMatchSession['seedTeamIds'] = [
        picked[0] ?? null,
        picked[1] ?? null,
        picked[2] ?? null,
        picked[3] ?? null,
      ];
      const seedSet = new Set(seedTeamIds.filter(Boolean) as string[]);
      next = {
        ...next,
        mainBracketTeamIds: mainIds,
        seedTeamIds,
        teams: next.teams.map((t) => ({ ...t, isSeed: seedSet.has(t.id) })),
        regionSlots: [
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
          [null, null, null, null],
        ],
        flatSlots: null,
        rounds: [],
        bronzeMatch: null,
        drawVersion: 0,
        wizardStep: WIZARD_STEP_MAIN_DRAW,
      };
      break;
    }
    case 'COMPUTE_SEED_TEAMS': {
      const eventId = next.eventIds[0] ?? '333';
      const mainIds = computeMainBracketTeamIds(next);
      const ids = pickSeedTeamIds(
        next.teams,
        next.players,
        next.seeding,
        eventId,
        next.seedingPrimary,
        mainIds,
      );
      const seedTeamIds: TeamMatchSession['seedTeamIds'] = [
        ids[0] ?? null,
        ids[1] ?? null,
        ids[2] ?? null,
        ids[3] ?? null,
      ];
      next = {
        ...next,
        seedTeamIds,
        teams: next.teams.map((t) => ({ ...t, isSeed: ids.includes(t.id) })),
      };
      break;
    }
    case 'RANDOMIZE_DRAW': {
      const regionSlots = randomizeDraw(next);
      const flat = [
        ...regionSlots[0],
        ...regionSlots[1],
        ...regionSlots[2],
        ...regionSlots[3],
      ] as TeamMatchSession['flatSlots'];
      next = {
        ...next,
        regionSlots,
        flatSlots: flat,
        drawVersion: next.drawVersion + 1,
      };
      next = rebuildBracketFromSession(next);
      break;
    }
    case 'REBUILD_BRACKET':
      next = rebuildBracketFromSession(next);
      break;
    case 'SET_SKIP_BRONZE_MATCH':
      next = { ...next, skipBronzeMatch: action.value };
      next = action.value ? { ...next, bronzeMatch: null } : syncBronzeToSession(next);
      break;
    case 'SET_UI_FOCUS':
      next = { ...next, uiFocusMatchId: action.matchId };
      break;
    case 'SET_PK_DRAFT': {
      const m = findMatch(next, action.matchId);
      if (!m?.pk) break;
      if (isEliminationGroupMatch(m)) {
        const pk: ElimGroupPkState = { ...m.pk, currentResults: action.results };
        next = patchBracketOrElimMatch(next, action.matchId, { pk });
      } else {
        const pk: PkMatchState = { ...m.pk, currentResults: action.results };
        next = patchBracketOrElimMatch(next, action.matchId, { pk });
      }
      break;
    }
    case 'PK_SETTLE': {
      const m = findMatch(next, action.matchId);
      if (!m?.pk) break;
      const results = action.results;
      if (isEliminationGroupMatch(m)) {
        const teamIds = m.pk.teamIds;
        const computed = computeMultiTeamPkSettlement(teamIds, results);
        const snap = {
          id: newSnapshotId(),
          recordedAt: Date.now(),
          reason: 'submit' as const,
          results: [...results],
          computed,
        };
        let resolution: ElimGroupPkState['resolution'] = null;
        if (computed.allTeamsDnf) {
          resolution = { mode: 'pending_both_dnf' };
        } else if (computed.computedWinnerTeamId) {
          resolution = { mode: 'computed', winnerTeamId: computed.computedWinnerTeamId };
        }
        const pk: ElimGroupPkState = {
          ...m.pk,
          currentResults: results,
          scoreHistory: [...m.pk.scoreHistory, snap],
          lastComputed: computed,
          resolution,
        };
        const patch: Partial<EliminationGroupMatch> = { pk };
        if (resolution?.mode === 'computed' && resolution.winnerTeamId) {
          patch.winnerId = resolution.winnerTeamId;
        }
        next = patchBracketOrElimMatch(next, action.matchId, patch);
        break;
      }
      const { teamAId, teamBId } = m.pk;
      const computed = computePkSettlement(teamAId, teamBId, results);
      const snap = {
        id: newSnapshotId(),
        recordedAt: Date.now(),
        reason: 'submit' as const,
        results: [...results],
        computed,
      };
      let resolution: PkMatchState['resolution'] = null;
      if (computed.bothSidesDnf) {
        resolution = { mode: 'pending_both_dnf' };
      } else if (computed.computedWinnerTeamId) {
        resolution = { mode: 'computed', winnerTeamId: computed.computedWinnerTeamId };
      }
      const pk: PkMatchState = {
        ...m.pk,
        currentResults: results,
        scoreHistory: [...m.pk.scoreHistory, snap],
        lastComputed: computed,
        resolution,
      };
      const patch: Partial<BracketMatch> = { pk };
      if (resolution?.mode === 'computed' && resolution.winnerTeamId) {
        patch.winnerId = resolution.winnerTeamId;
      }
      next = patchBracketOrElimMatch(next, action.matchId, patch);
      if (patch.winnerId && !isEliminationMatchId(next, action.matchId)) next = cascadeRounds(next);
      break;
    }
    case 'PK_MANUAL_WINNER': {
      const m = findMatch(next, action.matchId);
      if (!m?.pk) break;
      if (isEliminationGroupMatch(m)) {
        if (!m.pk.teamIds.includes(action.winnerTeamId)) break;
        const pk: ElimGroupPkState = {
          ...m.pk,
          resolution: { mode: 'manual', winnerTeamId: action.winnerTeamId },
        };
        next = patchBracketOrElimMatch(next, action.matchId, {
          winnerId: action.winnerTeamId,
          pk,
        });
        break;
      }
      const pk: PkMatchState = {
        ...m.pk,
        resolution: { mode: 'manual', winnerTeamId: action.winnerTeamId },
      };
      next = patchBracketOrElimMatch(next, action.matchId, {
        winnerId: action.winnerTeamId,
        pk,
      });
      if (!isEliminationMatchId(next, action.matchId)) next = cascadeRounds(next);
      break;
    }
    case 'PK_REPLAY': {
      const m = findMatch(next, action.matchId);
      if (!m?.pk) break;
      if (isEliminationGroupMatch(m)) {
        const snap = {
          id: newSnapshotId(),
          recordedAt: Date.now(),
          reason: 'replay' as const,
          results: [...m.pk.currentResults],
        };
        const pk: ElimGroupPkState = {
          ...m.pk,
          currentResults: [],
          scoreHistory: [...m.pk.scoreHistory, snap],
          resolution: null,
          lastComputed: undefined,
        };
        next = patchBracketOrElimMatch(next, action.matchId, { pk, winnerId: null });
        break;
      }
      const snap = {
        id: newSnapshotId(),
        recordedAt: Date.now(),
        reason: 'replay' as const,
        results: [...m.pk.currentResults],
      };
      const pk: PkMatchState = {
        ...m.pk,
        currentResults: [],
        scoreHistory: [...m.pk.scoreHistory, snap],
        resolution: null,
        lastComputed: undefined,
      };
      next = patchBracketOrElimMatch(next, action.matchId, { pk, winnerId: null });
      if (!isEliminationMatchId(next, action.matchId)) next = cascadeRounds(next);
      break;
    }
    case 'PK_CLEAR_CURRENT': {
      const m = findMatch(next, action.matchId);
      if (!m?.pk) break;
      if (isEliminationGroupMatch(m)) {
        const snap = {
          id: newSnapshotId(),
          recordedAt: Date.now(),
          reason: 'correct' as const,
          results: [...m.pk.currentResults],
        };
        const pk: ElimGroupPkState = {
          ...m.pk,
          currentResults: [],
          scoreHistory: [...m.pk.scoreHistory, snap],
          resolution: null,
          lastComputed: undefined,
        };
        next = patchBracketOrElimMatch(next, action.matchId, { pk, winnerId: null });
        break;
      }
      const snap = {
        id: newSnapshotId(),
        recordedAt: Date.now(),
        reason: 'correct' as const,
        results: [...m.pk.currentResults],
      };
      const pk: PkMatchState = {
        ...m.pk,
        currentResults: [],
        scoreHistory: [...m.pk.scoreHistory, snap],
        resolution: null,
        lastComputed: undefined,
      };
      next = patchBracketOrElimMatch(next, action.matchId, { pk, winnerId: null });
      if (!isEliminationMatchId(next, action.matchId)) next = cascadeRounds(next);
      break;
    }
    case 'SET_MATCH_WINNER':
      next = patchBracketOrElimMatch(next, action.matchId, { winnerId: action.winnerTeamId });
      if (!isEliminationMatchId(next, action.matchId)) next = cascadeRounds(next);
      break;
    default:
      break;
  }

  return touch(next);
}

/** 为 PK 初始化六条占位（由 UI 绑定选手顺序） */
export function buildPkTemplateRows(
  teamAId: string,
  teamBId: string,
  teamA: Team,
  teamB: Team,
): PkPlayerResult[] {
  const rows: PkPlayerResult[] = [];
  for (let i = 0; i < TEAM_PLAYERS; i++) {
    rows.push({ playerId: teamA.playerIds[i], teamId: teamAId, value: 0 });
  }
  for (let i = 0; i < TEAM_PLAYERS; i++) {
    rows.push({ playerId: teamB.playerIds[i], teamId: teamBId, value: 0 });
  }
  return rows;
}

/** 预选赛小组战：按 teamIds 顺序，每队三人一行 */
export function buildPkGroupTemplateRows(teamIds: string[], teams: Team[]): PkPlayerResult[] {
  const rows: PkPlayerResult[] = [];
  for (const tid of teamIds) {
    const team = teams.find((t) => t.id === tid);
    if (!team) continue;
    for (let i = 0; i < TEAM_PLAYERS; i++) {
      rows.push({ playerId: team.playerIds[i], teamId: tid, value: 0 });
    }
  }
  return rows;
}

export { createEmptySession };
