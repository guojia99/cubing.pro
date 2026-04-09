import type {
  BracketMatch,
  EliminationGroupMatch,
  EliminationPhaseState,
  ElimGroupSize,
  SeedingEntry,
  TeamMatchSession,
} from '@/pages/Tools/TeamMatch/types';

function normalizeSeedingEntry(e: SeedingEntry): SeedingEntry {
  return {
    ...e,
    wcaBest: e.wcaBest ?? null,
    oneBest: e.oneBest ?? null,
    preliminary: e.preliminary ?? null,
    adoptStrategy: e.adoptStrategy,
  };
}
import { v4 as uuidv4 } from 'uuid';

const emptyRegion = () => [null, null, null, null] as TeamMatchSession['regionSlots'][0];

function migrateWizardStep(s: TeamMatchSession): { wizardStep: number; wizardSchemaVersion: number } {
  const ver = s.wizardSchemaVersion ?? 1;
  if (ver >= 2) {
    return { wizardStep: s.wizardStep, wizardSchemaVersion: ver };
  }
  let w = s.wizardStep;
  if (w >= 3) w += 1;
  return { wizardStep: w, wizardSchemaVersion: 2 };
}

/** 合并「学校」与「选手」为一步：原 1→0，2→1 … 5→4；6/7 不变 */
function migrateWizardMergeSchoolPlayer(s: TeamMatchSession): { wizardStep: number; wizardSchemaVersion: number } {
  const ver = s.wizardSchemaVersion ?? 1;
  if (ver >= 3) {
    return { wizardStep: s.wizardStep, wizardSchemaVersion: ver };
  }
  let w = s.wizardStep;
  if (w >= 1 && w <= 5) w -= 1;
  return { wizardStep: w, wizardSchemaVersion: 3 };
}

/** 插入预选赛两步：原 4→6 正赛抽签，6→7 正赛，7→8 领奖台 */
function migrateWizardElimSteps(s: TeamMatchSession): { wizardStep: number; wizardSchemaVersion: number } {
  const ver = s.wizardSchemaVersion ?? 1;
  if (ver >= 4) {
    return { wizardStep: s.wizardStep, wizardSchemaVersion: ver };
  }
  let w = s.wizardStep;
  if (w === 4) w = 6;
  else if (w === 6) w = 7;
  else if (w === 7) w = 8;
  return { wizardStep: w, wizardSchemaVersion: 4 };
}

/** 插入「正赛名单确认」：原 6→7 抽签，7→8 正赛，8→9 领奖台 */
function migrateWizardMainPoolConfirmStep(s: TeamMatchSession): { wizardStep: number; wizardSchemaVersion: number } {
  const ver = s.wizardSchemaVersion ?? 1;
  if (ver >= 5) {
    return { wizardStep: s.wizardStep, wizardSchemaVersion: ver };
  }
  let w = s.wizardStep;
  if (w >= 6) w += 1;
  return { wizardStep: w, wizardSchemaVersion: 5 };
}

function isLegacyElimBracketMatch(m: unknown): m is BracketMatch {
  return (
    typeof m === 'object' &&
    m !== null &&
    'teamAId' in m &&
    'teamBId' in m &&
    'roundIndex' in m
  );
}

/** 旧预选赛（两场一队）→ 小组战 EliminationGroupMatch */
function migrateEliminationPhase(elim: TeamMatchSession['elimination']): TeamMatchSession['elimination'] {
  if (!elim) return null;
  const first = elim.matches?.[0];
  let matches: EliminationGroupMatch[] = (elim.matches ?? []) as EliminationGroupMatch[];
  if (first && isLegacyElimBracketMatch(first)) {
    matches = (elim.matches as unknown as BracketMatch[]).map((m) => ({
      id: m.id,
      teamIds: [m.teamAId, m.teamBId].filter(Boolean) as string[],
      winnerId: m.winnerId,
      pk: m.pk
        ? {
            teamIds: [m.pk.teamAId, m.pk.teamBId],
            currentResults: m.pk.currentResults,
            scoreHistory: m.pk.scoreHistory,
            resolution: m.pk.resolution,
            lastComputed: m.pk.lastComputed,
          }
        : null,
    }));
  }
  const naturalByeTeamIds =
    elim.naturalByeTeamIds?.length > 0
      ? [...elim.naturalByeTeamIds]
      : elim.naturalByeTeamId
        ? [elim.naturalByeTeamId]
        : [];
  const groupSize: ElimGroupSize =
    elim.groupSize ?? (first && isLegacyElimBracketMatch(first) ? 2 : 3);
  const out: EliminationPhaseState = {
    skipped: elim.skipped,
    groupSize,
    byeTeamIds: elim.byeTeamIds ?? [],
    drawVersion: elim.drawVersion ?? 0,
    naturalByeTeamIds,
    waveSizes: elim.waveSizes ?? [],
    matches,
  };
  return out;
}

/** 兼容旧存档缺少 bronzeMatch */
export function normalizeSession(s: TeamMatchSession): TeamMatchSession {
  const m1 = migrateWizardStep(s);
  const merged = migrateWizardMergeSchoolPlayer({ ...s, wizardStep: m1.wizardStep, wizardSchemaVersion: m1.wizardSchemaVersion });
  const m4 = migrateWizardElimSteps({
    ...s,
    wizardStep: merged.wizardStep,
    wizardSchemaVersion: merged.wizardSchemaVersion,
  });
  const m5 = migrateWizardMainPoolConfirmStep({
    ...s,
    wizardStep: m4.wizardStep,
    wizardSchemaVersion: m4.wizardSchemaVersion,
  });
  return {
    ...s,
    wizardStep: m5.wizardStep,
    wizardSchemaVersion: m5.wizardSchemaVersion,
    mainBracketTeamIds: s.mainBracketTeamIds ?? null,
    elimination: migrateEliminationPhase(s.elimination),
    bronzeMatch: s.bronzeMatch ?? null,
    skipBronzeMatch: s.skipBronzeMatch ?? false,
    schools: s.schools.map((x) => ({ ...x, kind: x.kind ?? 'standard' })),
    teams: s.teams.map((t) => ({ ...t, kind: t.kind ?? 'school' })),
    players: s.players.map((p) => ({ ...p, oneId: p.oneId ?? null })),
    seeding: s.seeding.map(normalizeSeedingEntry),
    drawRandomMode: s.drawRandomMode ?? 'score',
    drawAvoidSameSchool: s.drawAvoidSameSchool ?? true,
    oneCompImport: s.oneCompImport ?? { cId: null, eRound: 1 },
  };
}

export function createEmptySession(): TeamMatchSession {
  return {
    id: uuidv4(),
    name: '',
    status: 'draft',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    eventIds: ['333'],
    seedingPrimary: 'average',
    schools: [],
    players: [],
    teams: [],
    seeding: [],
    drawVersion: 0,
    drawRandomMode: 'score',
    drawAvoidSameSchool: true,
    regionSlots: [emptyRegion(), emptyRegion(), emptyRegion(), emptyRegion()],
    seedTeamIds: [null, null, null, null],
    flatSlots: null,
    rounds: [],
    bronzeMatch: null,
    skipBronzeMatch: false,
    wizardStep: 0,
    wizardSchemaVersion: 5,
    uiFocusMatchId: null,
    oneCompImport: { cId: null, eRound: 1 },
    mainBracketTeamIds: null,
    elimination: null,
  };
}
