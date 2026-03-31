"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCurrentProfile } from "@/features/auth/api/get-profile";
import { loginWithPassword } from "@/features/auth/api/login";
import { logoutCurrentSession } from "@/features/auth/api/logout";
import { authStore } from "@/lib/auth/auth-store";
import {
  EMPTY_AUTH_SESSION,
  type AuthSession,
} from "@/lib/auth/auth-session";
import type { LoginCredentials, ProfileResponsePayload } from "@/features/auth/model/auth-types";

type AuthContextValue = {
  session: AuthSession;
  user: AuthSession["user"];
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ ok: true } | { ok: false; errors: string[] }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<{ ok: true; profile: ProfileResponsePayload } | { ok: false; errors: string[] }>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession>(EMPTY_AUTH_SESSION);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback<
    AuthContextValue["refreshProfile"]
  >(async () => {
    const result = await getCurrentProfile();
    if (!result.ok) {
      return { ok: false, errors: result.errors };
    }

    const current = await authStore.getSession();
    const nextSession: AuthSession = {
      token: current.token,
      user: {
        id: String(result.data.id),
        sub: String(result.data.id),
        nombre: result.data.nombre,
        email: result.data.email,
        rol: result.data.rol,
      },
    };

    await authStore.setSession(nextSession);
    setSession(nextSession);

    return { ok: true, profile: result.data };
  }, []);

  const login = useCallback<AuthContextValue["login"]>(async (credentials) => {
    const result = await loginWithPassword(credentials);
    if (!result.ok) {
      return { ok: false, errors: result.errors };
    }

    const nextSession = await authStore.getSession();
    setSession(nextSession);
    return { ok: true };
  }, []);

  const logout = useCallback<AuthContextValue["logout"]>(async () => {
    await logoutCurrentSession();
    setSession(EMPTY_AUTH_SESSION);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      session,
      user: session.user,
      token: session.token,
      isAuthenticated: Boolean(session.token && session.user),
      isLoading,
      login,
      logout,
      refreshProfile,
    };
  }, [isLoading, login, logout, refreshProfile, session]);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      const storedSession = await authStore.getSession();
      if (cancelled) {
        return;
      }

      setSession(storedSession);

      if (storedSession.token && !storedSession.user) {
        const result = await refreshProfile();
        if (cancelled) {
          return;
        }

        if (!result.ok) {
          await authStore.clearSession();
          setSession(EMPTY_AUTH_SESSION);
        }
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
