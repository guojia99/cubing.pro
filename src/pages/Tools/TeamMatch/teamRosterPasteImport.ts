import { classifyTeamComposition, getFreelancerSchoolId } from '@/pages/Tools/TeamMatch/teamClassify';
import type { Player, School, Team, TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { MAX_ROSTER_TEAMS, TEAM_PLAYERS } from '@/pages/Tools/TeamMatch/types';
import { v4 as uuidv4 } from 'uuid';

/** 队名列：队名（学校名）或仅队名；学校名缺省则队员挂靠自由人池并按自由人队处理 */
export function parseTeamColumn(cell: string): { teamName: string; schoolName: string | null } {
  const trimmed = cell.trim();
  const m = trimmed.match(/^(.+?)[（(]([^）)]+)[）)]\s*$/);
  if (m) return { teamName: m[1].trim(), schoolName: m[2].trim() };
  return { teamName: trimmed, schoolName: null };
}

/** 姓名末尾可接 10 位 WCA ID（如 2017XUGE01） */
export function parsePlayerCell(raw: string): { name: string; wcaId: string | null } {
  const s = raw.trim();
  if (!s) return { name: '', wcaId: null };
  const m = s.match(/^(.+?)(\d{4}[A-Za-z0-9]{6})$/);
  if (m && m[2].length === 10) {
    return { name: m[1].trim(), wcaId: m[2].toUpperCase() };
  }
  return { name: s, wcaId: null };
}

export function splitPasteLine(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];
  const byTab = trimmed.split('\t').map((x) => x.trim());
  const nonEmpty = byTab.filter((x) => x !== '');
  if (nonEmpty.length >= 1 + TEAM_PLAYERS) {
    return nonEmpty.slice(0, 1 + TEAM_PLAYERS);
  }
  return trimmed
    .split(/\s{2,}/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 1 + TEAM_PLAYERS);
}

function ensureFreelancerSchool(schools: School[]): School[] {
  if (getFreelancerSchoolId(schools)) return schools;
  return [...schools, { id: uuidv4(), name: '自由人', kind: 'freelancer' as const }];
}

function findOrAddStandardSchool(schools: School[], name: string): { schools: School[]; schoolId: string } {
  const hit = schools.find((s) => s.name === name && s.kind !== 'freelancer');
  if (hit) return { schools, schoolId: hit.id };
  const s: School = { id: uuidv4(), name, kind: 'standard' };
  return { schools: [...schools, s], schoolId: s.id };
}

function activeFullTeamCount(teams: Team[]): number {
  return teams.filter((t) => !t.disabled && t.playerIds.length === TEAM_PLAYERS).length;
}

/**
 * 从粘贴文本解析并合并进 session：增学校、选手、队伍。
 * 无学校列时队员挂靠自由人池，队伍按自由人队规则归类。
 */
export function buildTeamRosterPasteImport(
  session: TeamMatchSession,
  text: string,
): { ok: true; schools: School[]; players: Player[]; teams: Team[] } | { ok: false; message: string } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { ok: false, message: '内容为空' };

  let schools = ensureFreelancerSchool([...session.schools]);
  let players = [...session.players];
  const newTeams: Team[] = [];

  const flId = getFreelancerSchoolId(schools)!;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const cols = splitPasteLine(line);
    if (cols.length < 1 + TEAM_PLAYERS) {
      return { ok: false, message: `第 ${li + 1} 行：需 1 列队名 + ${TEAM_PLAYERS} 列队员（可用 Tab 或两个以上空格分隔）` };
    }
    const teamCol = cols[0]!;
    const playerCols = cols.slice(1, 1 + TEAM_PLAYERS);
    if (playerCols.length !== TEAM_PLAYERS) {
      return { ok: false, message: `第 ${li + 1} 行：需要恰好 ${TEAM_PLAYERS} 名队员` };
    }

    const { teamName, schoolName } = parseTeamColumn(teamCol);
    if (!teamName) return { ok: false, message: `第 ${li + 1} 行：队名为空` };

    let targetSchoolId: string;
    if (schoolName) {
      const r = findOrAddStandardSchool(schools, schoolName);
      schools = r.schools;
      targetSchoolId = r.schoolId;
    } else {
      targetSchoolId = flId;
    }

    const pids: string[] = [];
    for (let pi = 0; pi < playerCols.length; pi++) {
      const { name, wcaId } = parsePlayerCell(playerCols[pi] ?? '');
      if (!name) return { ok: false, message: `第 ${li + 1} 行：第 ${pi + 1} 名队员姓名为空` };

      if (wcaId) {
        const ei = players.findIndex((p) => p.wcaId === wcaId);
        if (ei >= 0) {
          const existing = players[ei]!;
          players[ei] = { ...existing, schoolId: targetSchoolId, name };
          pids.push(existing.id);
          continue;
        }
      }

      const np: Player = {
        id: uuidv4(),
        name,
        schoolId: targetSchoolId,
        wcaId,
        oneId: null,
        avatarDataUrl: null,
      };
      players.push(np);
      pids.push(np.id);
    }

    if (new Set(pids).size !== TEAM_PLAYERS) {
      return { ok: false, message: `第 ${li + 1} 行：三名队员须不同（含 WCA 重复会导致同一人占多席）` };
    }

    const triple = [pids[0]!, pids[1]!, pids[2]!] as [string, string, string];
    const c = classifyTeamComposition(triple, players, schools);
    if (!c.ok) {
      return { ok: false, message: `第 ${li + 1} 行（${teamName}）：${c.message}` };
    }

    if (activeFullTeamCount(session.teams) + newTeams.length + 1 > MAX_ROSTER_TEAMS) {
      return { ok: false, message: `超过最多 ${MAX_ROSTER_TEAMS} 支有效队伍上限` };
    }

    newTeams.push({
      id: uuidv4(),
      name: teamName,
      schoolId: c.schoolId,
      kind: c.kind,
      playerIds: triple,
      disabled: false,
      isSeed: false,
    });
  }

  return {
    ok: true,
    schools,
    players,
    teams: [...session.teams, ...newTeams],
  };
}
