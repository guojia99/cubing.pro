import { getDefaultBracketPageSettings, type LiveUISettings } from '@/pages/Tools/TeamMatch/liveUiSettings';
import { getDefaultPkArenaSettings } from '@/pages/Tools/TeamMatch/pkArenaSettings';
import { normalizeSession } from '@/pages/Tools/TeamMatch/sessionFactory';
import type { TeamMatchSession } from '@/pages/Tools/TeamMatch/types';

export const TEAM_MATCH_JSON_FORMAT = 'cubing-pro-team-match' as const;
export const TEAM_MATCH_JSON_VERSION = 1;

export type TeamMatchJsonFile = {
  format: typeof TEAM_MATCH_JSON_FORMAT;
  version: number;
  exportedAt: number;
  session: TeamMatchSession;
  /** 可选：正赛/对战界面设置 */
  liveUISettings?: LiveUISettings;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function isTeamMatchSessionShape(v: unknown): v is TeamMatchSession {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    Array.isArray(v.schools) &&
    Array.isArray(v.players) &&
    Array.isArray(v.teams)
  );
}

export function buildTeamMatchJsonFile(session: TeamMatchSession, liveUISettings?: LiveUISettings): TeamMatchJsonFile {
  return {
    format: TEAM_MATCH_JSON_FORMAT,
    version: TEAM_MATCH_JSON_VERSION,
    exportedAt: Date.now(),
    session,
    ...(liveUISettings ? { liveUISettings } : {}),
  };
}

export function parseTeamMatchImport(text: string): { session: TeamMatchSession; liveUISettings?: LiveUISettings } {
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    throw new Error('不是合法的 JSON');
  }

  if (isRecord(raw) && raw.format === TEAM_MATCH_JSON_FORMAT && raw.session) {
    if (!isTeamMatchSessionShape(raw.session)) {
      throw new Error('JSON 中 session 字段不完整');
    }
    const session = normalizeSession(raw.session);
    let liveUISettings: LiveUISettings | undefined;
    if (raw.liveUISettings && isRecord(raw.liveUISettings)) {
      const li = raw.liveUISettings as Partial<LiveUISettings>;
      liveUISettings = {
        bracket: { ...getDefaultBracketPageSettings(), ...(li.bracket as object) },
        arena: { ...getDefaultPkArenaSettings(), ...(li.arena as object) },
      };
    }
    return { session, liveUISettings };
  }

  if (isTeamMatchSessionShape(raw)) {
    return { session: normalizeSession(raw) };
  }

  throw new Error('无法识别：需要 cubing-pro-team-match 格式，或裸 TeamMatchSession 对象');
}

export function downloadTeamMatchJson(filenameBase: string, payload: TeamMatchJsonFile): void {
  const text = JSON.stringify(payload, null, 2);
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameBase.replace(/[/\\?%*:|"<>]/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
