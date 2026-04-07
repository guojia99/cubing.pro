import type { SeedingEntry, TeamMatchSession } from '@/pages/Tools/TeamMatch/types';

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

/** 兼容旧存档缺少 bronzeMatch */
export function normalizeSession(s: TeamMatchSession): TeamMatchSession {
  const m1 = migrateWizardStep(s);
  const merged = migrateWizardMergeSchoolPlayer({ ...s, wizardStep: m1.wizardStep, wizardSchemaVersion: m1.wizardSchemaVersion });
  return {
    ...s,
    wizardStep: merged.wizardStep,
    wizardSchemaVersion: merged.wizardSchemaVersion,
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
    wizardSchemaVersion: 3,
    uiFocusMatchId: null,
    oneCompImport: { cId: null, eRound: 1 },
  };
}
