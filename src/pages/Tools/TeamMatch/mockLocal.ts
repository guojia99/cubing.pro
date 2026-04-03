import type { Player, School, Team, TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { MAX_TEAMS, MIN_TEAMS, TEAM_PLAYERS } from '@/pages/Tools/TeamMatch/types';
import { v4 as uuidv4 } from 'uuid';

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
      const s: School = { id: uuidv4(), name: row.school };
      nameToSchoolId.set(row.school, s.id);
      schools.push(s);
    }
  }

  const players: Player[] = [];
  const teams: Team[] = [];

  plan.forEach((row, idx) => {
    const schoolId = nameToSchoolId.get(row.school)!;
    const pids: string[] = [];
    for (let k = 0; k < TEAM_PLAYERS; k++) {
      const p: Player = {
        id: uuidv4(),
        schoolId,
        name: `${row.school.slice(0, 2)}${idx + 1}-${k + 1}`,
        wcaId: null,
        avatarDataUrl: null,
      };
      players.push(p);
      pids.push(p.id);
    }
    teams.push({
      id: uuidv4(),
      schoolId,
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
  const n = Math.max(0, Math.min(count, MAX_TEAMS - session.teams.length));
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
        const sch: School = { id: uuidv4(), name: row.school };
        newSchools.push(sch);
        nameToId.set(row.school, sch.id);
      }
    }
  }

  const players: Player[] = [];
  const teams: Team[] = [];

  plan.forEach((row, i) => {
    const globalIdx = start + i;
    const schoolId = nameToId.get(row.school)!;
    const pids: string[] = [];
    for (let k = 0; k < TEAM_PLAYERS; k++) {
      const p: Player = {
        id: uuidv4(),
        schoolId,
        name: `${row.school.slice(0, 2)}${globalIdx + 1}-${k + 1}`,
        wcaId: null,
        avatarDataUrl: null,
      };
      players.push(p);
      pids.push(p.id);
    }
    teams.push({
      id: uuidv4(),
      schoolId,
      name: `${row.school}${row.teamLabel}`,
      playerIds: pids,
      disabled: false,
      isSeed: false,
    });
  });

  return { schools: newSchools, players, teams };
}
