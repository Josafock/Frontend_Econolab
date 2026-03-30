export type SessionRole = "admin" | "recepcionista" | "unassigned";

export type SessionUser = {
  id: string;
  sub: string;
  nombre: string;
  email: string;
  rol: SessionRole;
};

export type AuthSession = {
  token: string | null;
  user: SessionUser | null;
};

export interface AuthSessionAdapter {
  getSession(): Promise<AuthSession>;
  setSession(session: AuthSession): Promise<void>;
  clearSession(): Promise<void>;
}

export const EMPTY_AUTH_SESSION: AuthSession = {
  token: null,
  user: null,
};

