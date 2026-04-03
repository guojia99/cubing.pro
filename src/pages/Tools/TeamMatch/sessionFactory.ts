import type { TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { v4 as uuidv4 } from 'uuid';

const emptyRegion = () => [null, null, null, null] as TeamMatchSession['regionSlots'][0];

/** 兼容旧存档缺少 bronzeMatch */
export function normalizeSession(s: TeamMatchSession): TeamMatchSession {
  return {
    ...s,
    bronzeMatch: s.bronzeMatch ?? null,
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
    regionSlots: [emptyRegion(), emptyRegion(), emptyRegion(), emptyRegion()],
    seedTeamIds: [null, null, null, null],
    flatSlots: null,
    rounds: [],
    bronzeMatch: null,
    wizardStep: 0,
    uiFocusMatchId: null,
  };
}
