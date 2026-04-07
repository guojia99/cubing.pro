import type { Player, School, Team, TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { MAX_ROSTER_TEAMS, MIN_TEAMS, TEAM_PLAYERS } from '@/pages/Tools/TeamMatch/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 真实 WCA ID（三阶顶尖选手示例，用于 mock 循环分配）
 * Feliks / Max / Tymon / Luke / SeungBeom Cho / Patrick Ponce
 */
export const MOCK_STRONG_333_WCA_IDS = [
  '2010ZEMD01',
  '2012PARK01',
  '2019KOLA01',
  '2014GARR01',
  '2016CHOE01',
  '2014PONC01',
] as const;

/** One 平台数字 uid 示例（与公开接口一致，用于 mock 循环） */
export const MOCK_ONE_UIDS = [2572, 2533, 2556, 1002, 7052] as const;

/** 测试用学校名（与业务约定一致） */
export const MOCK_SCHOOL_NAMES = [
  '中山大学',
  '华南理工',
  '暨南大学',
  '华师',
  '深大',
  '南方科',
  '广工',
  '广外',
  '广州大学',
  '南方医科大学',
] as const;

/**
 * 满 16 队时：广工 5 队，其余 11 队分布在其他学校（多校多队）
 * 顺序即 append 时的槽位顺序（从第 0 队到第 15 队）
 */
export const MOCK_TEAM_PLAN_16: { school: string; teamLabel: string }[] = [
  { school: '广工', teamLabel: '一队' },
  { school: '广工', teamLabel: '二队' },
  { school: '广工', teamLabel: '三队' },
  { school: '广工', teamLabel: '四队' },
  { school: '广工', teamLabel: '五队' },
  { school: '中山大学', teamLabel: '一队' },
  { school: '中山大学', teamLabel: '二队' },
  { school: '华南理工', teamLabel: '一队' },
  { school: '华南理工', teamLabel: '二队' },
  { school: '暨南大学', teamLabel: '一队' },
  { school: '暨南大学', teamLabel: '二队' },
  { school: '华师', teamLabel: '一队' },
  { school: '深大', teamLabel: '一队' },
  { school: '南方科', teamLabel: '一队' },
  { school: '广外', teamLabel: '一队' },
  { school: '南方医科大学', teamLabel: '一队' },
];

/** MIN_TEAMS 支：每校一队，取前若干校名 */
const MOCK_TEAM_PLAN_8: { school: string; teamLabel: string }[] = MOCK_SCHOOL_NAMES.slice(0, MIN_TEAMS).map(
  (school) => ({ school, teamLabel: '一队' }),
);

function buildFromPlan(plan: { school: string; teamLabel: string }[]): {
  schools: School[];
  players: Player[];
  teams: Team[];
} {
  const nameToSchoolId = new Map<string, string>();
  const schools: School[] = [];
  for (const row of plan) {
    if (!nameToSchoolId.has(row.school)) {
      const s: School = { id: uuidv4(), name: row.school, kind: 'standard' };
      nameToSchoolId.set(row.school, s.id);
      schools.push(s);
    }
  }

  const players: Player[] = [];
  const teams: Team[] = [];
  let mockPlayerIdx = 0;

  plan.forEach((row, idx) => {
    const schoolId = nameToSchoolId.get(row.school)!;
    const pids: string[] = [];
    for (let k = 0; k < TEAM_PLAYERS; k++) {
      const wcaId = MOCK_STRONG_333_WCA_IDS[mockPlayerIdx % MOCK_STRONG_333_WCA_IDS.length];
      const oneId = String(MOCK_ONE_UIDS[mockPlayerIdx % MOCK_ONE_UIDS.length]);
      mockPlayerIdx += 1;
      const p: Player = {
        id: uuidv4(),
        schoolId,
        name: `${row.school.slice(0, 2)}${idx + 1}-${k + 1}`,
        wcaId,
        oneId,
        avatarDataUrl: null,
      };
      players.push(p);
      pids.push(p.id);
    }
    teams.push({
      id: uuidv4(),
      schoolId,
      kind: 'school',
      name: `${row.school}${row.teamLabel}`,
      playerIds: pids,
      disabled: false,
      isSeed: false,
    });
  });

  return { schools, players, teams };
}

/** 生成 MIN_TEAMS 支队伍（每校一队，使用前 MIN_TEAMS 个校名） */
export function buildMockTeamMatchData(): { schools: School[]; players: Player[]; teams: Team[] } {
  return buildFromPlan(MOCK_TEAM_PLAN_8);
}

/** 生成 16 支队伍（广工 5 队 + 其余分布） */
export function buildMockTeamMatchData16(): { schools: School[]; players: Player[]; teams: Team[] } {
  return buildFromPlan(MOCK_TEAM_PLAN_16);
}

/**
 * 在现有数据后追加若干「分组」：按 MOCK_TEAM_PLAN_16 从当前队伍数继续取槽位。
 */
export function appendMockGroups(
  session: TeamMatchSession,
  count: number,
): { schools: School[]; players: Player[]; teams: Team[] } {
  const n = Math.max(0, Math.min(count, MAX_ROSTER_TEAMS - session.teams.length));
  const start = session.teams.length;
  const plan = MOCK_TEAM_PLAN_16.slice(start, start + n);
  if (plan.length === 0) {
    return { schools: [], players: [], teams: [] };
  }

  const existingNames = new Map(session.schools.map((s) => [s.name, s] as const));
  const newSchools: School[] = [];
  const nameToId = new Map<string, string>();

  for (const s of session.schools) {
    nameToId.set(s.name, s.id);
  }

  for (const row of plan) {
    if (!nameToId.has(row.school)) {
      const ex = existingNames.get(row.school);
      if (ex) {
        nameToId.set(row.school, ex.id);
      } else {
        const sch: School = { id: uuidv4(), name: row.school, kind: 'standard' };
        newSchools.push(sch);
        nameToId.set(row.school, sch.id);
      }
    }
  }

  const players: Player[] = [];
  const teams: Team[] = [];
  const basePlayerIdx = session.players.length;

  plan.forEach((row, i) => {
    const globalIdx = start + i;
    const schoolId = nameToId.get(row.school)!;
    const pids: string[] = [];
    for (let k = 0; k < TEAM_PLAYERS; k++) {
      const mockPlayerIdx = basePlayerIdx + i * TEAM_PLAYERS + k;
      const wcaId = MOCK_STRONG_333_WCA_IDS[mockPlayerIdx % MOCK_STRONG_333_WCA_IDS.length];
      const oneId = String(MOCK_ONE_UIDS[mockPlayerIdx % MOCK_ONE_UIDS.length]);
      const p: Player = {
        id: uuidv4(),
        schoolId,
        name: `${row.school.slice(0, 2)}${globalIdx + 1}-${k + 1}`,
        wcaId,
        oneId,
        avatarDataUrl: null,
      };
      players.push(p);
      pids.push(p.id);
    }
    teams.push({
      id: uuidv4(),
      schoolId,
      kind: 'school',
      name: `${row.school}${row.teamLabel}`,
      playerIds: pids,
      disabled: false,
      isSeed: false,
    });
  });

  return { schools: newSchools, players, teams };
}
