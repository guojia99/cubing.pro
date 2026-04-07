import type { Player, School, Team, TeamKind, TeamMatchSession } from '@/pages/Tools/TeamMatch/types';

export type ClassifyResult =
  | { ok: true; kind: TeamKind; schoolId: string }
  | { ok: false; message: string };

export function getFreelancerSchoolId(schools: School[]): string | undefined {
  return schools.find((s) => s.kind === 'freelancer')?.id;
}

function isFreelancerPlayerSchool(schools: School[], playerSchoolId: string): boolean {
  return schools.some((s) => s.id === playerSchoolId && s.kind === 'freelancer');
}

/**
 * 根据三名队员的学校归属判定队伍类型与归属 schoolId：
 * - 学校队：至少两名队员来自同一所「普通」学校（非自由人池），归属该校；可含外援或自由人选手。
 * - 自由人队：三名来自三所不同普通校，或无法形成「同校至少两人」等（如两自由人+一校、三自由人等），归属自由人池学校。
 */
export function classifyTeamComposition(
  playerIds: [string, string, string],
  players: Player[],
  schools: School[],
): ClassifyResult {
  const flSchoolId = getFreelancerSchoolId(schools);
  const plist = playerIds.map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[];
  if (plist.length !== 3) return { ok: false, message: '请选择 3 名选手' };

  const isFl = (sid: string) => flSchoolId !== undefined && sid === flSchoolId;

  const standardSchoolIds = plist.map((p) => p.schoolId).filter((sid) => !isFl(sid));
  const distinctStandard = [...new Set(standardSchoolIds)];

  const counts = new Map<string, number>();
  for (const p of plist) {
    if (!isFl(p.schoolId)) {
      counts.set(p.schoolId, (counts.get(p.schoolId) ?? 0) + 1);
    }
  }

  let maxSid: string | null = null;
  let maxN = 0;
  for (const [sid, n] of counts) {
    if (n > maxN) {
      maxN = n;
      maxSid = sid;
    }
  }

  if (distinctStandard.length >= 3) {
    if (!flSchoolId) {
      return {
        ok: false,
        message: '三名队员来自三所不同学校，须设为自由人队；请先在「学校」步骤添加类型为「自由人池」的学校',
      };
    }
    return { ok: true, kind: 'freelancer', schoolId: flSchoolId };
  }

  if (maxN >= 2 && maxSid) {
    return { ok: true, kind: 'school', schoolId: maxSid };
  }

  if (!flSchoolId) {
    return {
      ok: false,
      message: '当前组合须作为自由人队，请先在「学校」步骤添加「自由人池」类型学校',
    };
  }
  return { ok: true, kind: 'freelancer', schoolId: flSchoolId };
}

/** 默认队名 */
export function defaultTeamName(kind: TeamKind, schoolId: string, schools: School[]): string {
  if (kind === 'freelancer') {
    return schools.find((s) => s.id === schoolId)?.name ? `${schools.find((s) => s.id === schoolId)!.name}队` : '自由人队';
  }
  return schools.find((s) => s.id === schoolId)?.name ?? '队伍';
}

/**
 * 抽签「同校避战」用：自由人队每队视为不同「虚拟校」，不参与同校首轮回避。
 */
export function schoolIdForDrawPairing(session: TeamMatchSession, teamId: string): string | undefined {
  const t = session.teams.find((x) => x.id === teamId);
  if (!t) return undefined;
  if (t.kind === 'freelancer') return t.id;
  return t.schoolId;
}

export function teamKindLabel(team: Team, schools: School[]): string {
  if (team.kind === 'freelancer') {
    const n = schools.find((s) => s.id === team.schoolId)?.name;
    return n ? `自由人队（${n}）` : '自由人队';
  }
  const sn = schools.find((s) => s.id === team.schoolId)?.name ?? '';
  return sn ? `学校队 · ${sn}` : '学校队';
}
