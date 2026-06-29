"use client";

import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { isLoggedIn } from "@/lib/auth";
import { parseCurrentUserData } from "@/lib/parseCurrentUser";
import {
  applyWebsiteUiToDocument,
  readWebsiteUiFromStorage,
  writeWebsiteUiToStorage,
  type WebsiteUiConfig,
} from "@/lib/websiteUiConfig";
import { currentUser } from "@/services/cubing-pro/auth/auth";
import type { CurrentUserData } from "@/services/cubing-pro/auth/types";
import {
  AuthHeader,
  getToken,
  processWcaCallbackToken,
  removeToken,
  startTokenRefresh,
} from "@/services/cubing-pro/auth/token";
import { USER_KV_KEYS } from "@/services/cubing-pro/user/user_kv";
import { Request } from "@/services/cubing-pro/request";

type AuthContextValue = {
  currentUser: CurrentUserData | null;
  loading: boolean;
  refreshUser: () => Promise<CurrentUserData | null>;
  setCurrentUser: (user: CurrentUserData | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

let refreshUserInflight: Promise<CurrentUserData | null> | null = null;

function shouldClearTokenOnAuthError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 401 || status === 403 || status === 429;
}

async function syncWebsiteUiFromCloud(userId: number) {
  if (!userId) return;
  const tryKeys = [
    USER_KV_KEYS.website_ui_config,
    USER_KV_KEYS.websize_ui_config,
  ];
  for (const kvKey of tryKeys) {
    try {
      const r = await Request.get<{
        data: { value?: string; Value?: string };
      }>(`/user/kv/${encodeURIComponent(kvKey)}`, { headers: AuthHeader() });
      const inner = r.data?.data;
      const raw = inner?.value ?? inner?.Value;
      if (raw) {
        const cfg = JSON.parse(raw) as WebsiteUiConfig;
        writeWebsiteUiToStorage(cfg);
        applyWebsiteUiToDocument(cfg);
        break;
      }
    } catch {
      // not configured
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUserState, setCurrentUserState] = useState<CurrentUserData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async (): Promise<CurrentUserData | null> => {
    if (refreshUserInflight) {
      return refreshUserInflight;
    }

    const run = async (): Promise<CurrentUserData | null> => {
      processWcaCallbackToken();
      if (!getToken()?.token) {
        setCurrentUserState(null);
        return null;
      }

      try {
        const res = await currentUser();
        const data = parseCurrentUserData(res);
        if (data && isLoggedIn(data.id)) {
          setCurrentUserState(data);
          void syncWebsiteUiFromCloud(data.id);
          return data;
        }
        removeToken();
        setCurrentUserState(null);
        return null;
      } catch (error) {
        if (shouldClearTokenOnAuthError(error)) {
          removeToken();
        }
        setCurrentUserState(null);
        return null;
      }
    };

    refreshUserInflight = run().finally(() => {
      refreshUserInflight = null;
    });
    return refreshUserInflight;
  }, []);

  const bootstrapped = useRef(false);

  useEffect(() => {
    applyWebsiteUiToDocument(readWebsiteUiFromStorage());
    startTokenRefresh();

    if (bootstrapped.current) return;
    bootstrapped.current = true;

    void (async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  const setCurrentUser = useCallback((user: CurrentUserData | null) => {
    setCurrentUserState(user);
  }, []);

  const value = useMemo(
    () => ({
      currentUser: currentUserState,
      loading,
      refreshUser,
      setCurrentUser,
    }),
    [currentUserState, loading, refreshUser, setCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
