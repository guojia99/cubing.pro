import type { ArchivedSessionMeta, TeamMatchSession, TeamMatchStorageRoot } from '@/pages/Tools/TeamMatch/types';
import { HISTORY_LIMIT, STORAGE_KEY } from '@/pages/Tools/TeamMatch/types';

const emptyRoot = (): TeamMatchStorageRoot => ({
  version: 1,
  currentSessionId: null,
  sessions: {},
  historyIds: [],
});

export function loadStorage(): TeamMatchStorageRoot {
  if (typeof window === 'undefined') return emptyRoot();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyRoot();
    const parsed = JSON.parse(raw) as TeamMatchStorageRoot;
    if (parsed?.version !== 1 || !parsed.sessions) return emptyRoot();
    return parsed;
  } catch {
    return emptyRoot();
  }
}

export function saveStorage(root: TeamMatchStorageRoot): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
  } catch (e) {
    console.warn('team-match storage save failed', e);
  }
}

export function upsertSession(root: TeamMatchStorageRoot, session: TeamMatchSession): TeamMatchStorageRoot {
  const sessions = { ...root.sessions, [session.id]: session };
  let historyIds = root.historyIds.filter((id) => id !== session.id);
  historyIds = [session.id, ...historyIds].slice(0, HISTORY_LIMIT);
  return {
    ...root,
    currentSessionId: session.id,
    sessions,
    historyIds,
  };
}

export function deleteSession(root: TeamMatchStorageRoot, id: string): TeamMatchStorageRoot {
  const { [id]: _, ...rest } = root.sessions;
  return {
    ...root,
    sessions: rest,
    historyIds: root.historyIds.filter((x) => x !== id),
    currentSessionId: root.currentSessionId === id ? null : root.currentSessionId,
  };
}

export function metaFromSession(s: TeamMatchSession): ArchivedSessionMeta {
  const teamCount = s.teams.filter((t) => !t.disabled).length;
  return {
    id: s.id,
    name: s.name || '未命名',
    updatedAt: s.updatedAt,
    status: s.status,
    summary: `${teamCount} 队 · ${s.status}`,
  };
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

export function schedulePersist(root: TeamMatchStorageRoot): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    saveStorage(root);
  }, 200);
}
