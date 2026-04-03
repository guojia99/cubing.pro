import { createEmptySession, normalizeSession } from '@/pages/Tools/TeamMatch/sessionFactory';
import type { TeamMatchAction } from '@/pages/Tools/TeamMatch/sessionReducer';
import { reduceSession } from '@/pages/Tools/TeamMatch/sessionReducer';
import type { TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import {
  deleteSession,
  loadStorage,
  schedulePersist,
  upsertSession,
} from '@/pages/Tools/TeamMatch/storage';
import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

export type TeamMatchStoreAction =
  | TeamMatchAction
  | { type: 'HYDRATE'; session: TeamMatchSession }
  | { type: 'NEW_SESSION' }
  | { type: 'LOAD_SESSION'; id: string }
  | { type: 'DELETE_SESSION'; id: string }
  | { type: 'INIT' };

type TeamStoreState = {
  root: ReturnType<typeof loadStorage>;
  session: TeamMatchSession;
};

function loadFromStorage(): TeamStoreState {
  const root = loadStorage();
  let session = createEmptySession();
  if (root.currentSessionId && root.sessions[root.currentSessionId]) {
    session = normalizeSession(root.sessions[root.currentSessionId]);
  } else if (root.historyIds[0] && root.sessions[root.historyIds[0]]) {
    session = normalizeSession(root.sessions[root.historyIds[0]]);
  }
  return { root, session };
}

function storeReducer(state: TeamStoreState, action: TeamMatchStoreAction): TeamStoreState {
  switch (action.type) {
    case 'INIT':
      return loadFromStorage();
    case 'HYDRATE': {
      const root = upsertSession(state.root, action.session);
      schedulePersist(root);
      return { root, session: normalizeSession(action.session) };
    }
    case 'NEW_SESSION': {
      const s = createEmptySession();
      const root = upsertSession(state.root, s);
      schedulePersist(root);
      return { root, session: s };
    }
    case 'LOAD_SESSION': {
      const s = state.root.sessions[action.id];
      if (!s) return state;
      const root = { ...state.root, currentSessionId: action.id };
      schedulePersist(root);
      return { root, session: normalizeSession(s) };
    }
    case 'DELETE_SESSION': {
      const root = deleteSession(state.root, action.id);
      let session = state.session;
      if (session.id === action.id) {
        session = createEmptySession();
      }
      schedulePersist(root);
      return { root, session };
    }
    default: {
      const nextSession = reduceSession(state.session, action as TeamMatchAction);
      const nextRoot = upsertSession(state.root, nextSession);
      schedulePersist(nextRoot);
      return { root: nextRoot, session: nextSession };
    }
  }
}

type Ctx = {
  state: TeamStoreState;
  dispatch: React.Dispatch<TeamMatchStoreAction>;
};

const TeamMatchCtx = createContext<Ctx | null>(null);

export function TeamMatchProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, loadFromStorage());

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <TeamMatchCtx.Provider value={value}>{children}</TeamMatchCtx.Provider>;
}

export function useTeamMatchStore() {
  const v = useContext(TeamMatchCtx);
  if (!v) throw new Error('useTeamMatchStore outside provider');
  return v;
}

export function useTeamMatchDispatch() {
  const { dispatch } = useTeamMatchStore();
  return useCallback((a: TeamMatchStoreAction) => dispatch(a), [dispatch]);
}
