import {
  EMPTY_AUTH_SESSION,
  type AuthSession,
  type AuthSessionAdapter,
} from "@/lib/auth/auth-session";
import { isDesktopApp } from "@/lib/runtime/platform";
import {
  deleteDesktopStoredValue,
  getDesktopStoredValue,
  setDesktopStoredValue,
} from "@/lib/runtime/tauri-bridge";

const AUTH_STORAGE_KEY = "econolab.auth.session";

let memorySession: AuthSession = EMPTY_AUTH_SESSION;

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function readLegacyCookie(): string | null {
  if (!hasWindow()) {
    return null;
  }

  const match = document.cookie.match(/(?:^|;\s*)ECONOLAB_TOKEN=([^;]+)/);
  if (!match?.[1]) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function syncLegacyCookie(token: string | null) {
  if (!hasWindow()) {
    return;
  }

  if (!token) {
    document.cookie = "ECONOLAB_TOKEN=; path=/; max-age=0; SameSite=Lax";
    return;
  }

  document.cookie = `ECONOLAB_TOKEN=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
}

function readStoredSession(): AuthSession {
  if (!hasWindow()) {
    return memorySession;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    const legacyToken = readLegacyCookie();
    if (legacyToken && memorySession.token !== legacyToken) {
      memorySession = {
        token: legacyToken,
        user: null,
      };
    }
    return memorySession;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    memorySession = {
      token: parsed?.token ?? null,
      user: parsed?.user ?? null,
    };
    return memorySession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    const legacyToken = readLegacyCookie();
    memorySession = {
      token: legacyToken,
      user: null,
    };
    return memorySession;
  }
}

function persistSession(session: AuthSession) {
  memorySession = session;

  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  syncLegacyCookie(session.token);
}

function removeStoredSession() {
  memorySession = EMPTY_AUTH_SESSION;

  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  syncLegacyCookie(null);
}

async function readDesktopStoredSession(): Promise<AuthSession> {
  const raw = await getDesktopStoredValue(AUTH_STORAGE_KEY);
  if (!raw) {
    return readStoredSession();
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    memorySession = {
      token: parsed?.token ?? null,
      user: parsed?.user ?? null,
    };
    return memorySession;
  } catch {
    await deleteDesktopStoredValue(AUTH_STORAGE_KEY);
    return readStoredSession();
  }
}

class BrowserAuthSessionAdapter implements AuthSessionAdapter {
  async getSession(): Promise<AuthSession> {
    return readStoredSession();
  }

  async setSession(session: AuthSession): Promise<void> {
    persistSession(session);
  }

  async clearSession(): Promise<void> {
    removeStoredSession();
  }
}

class DesktopAuthSessionAdapter implements AuthSessionAdapter {
  async getSession(): Promise<AuthSession> {
    return readDesktopStoredSession();
  }

  async setSession(session: AuthSession): Promise<void> {
    memorySession = session;
    const persisted = await setDesktopStoredValue(
      AUTH_STORAGE_KEY,
      JSON.stringify(session),
    );

    if (persisted) {
      syncLegacyCookie(null);
      if (hasWindow()) {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      return;
    }

    persistSession(session);
  }

  async clearSession(): Promise<void> {
    memorySession = EMPTY_AUTH_SESSION;
    const deleted = await deleteDesktopStoredValue(AUTH_STORAGE_KEY);
    if (deleted) {
      syncLegacyCookie(null);
      if (hasWindow()) {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      return;
    }

    removeStoredSession();
  }
}

const browserAdapter = new BrowserAuthSessionAdapter();
const desktopAdapter = new DesktopAuthSessionAdapter();

function getSessionAdapter(): AuthSessionAdapter {
  return isDesktopApp() ? desktopAdapter : browserAdapter;
}

export const authStore = {
  getSession: () => getSessionAdapter().getSession(),
  setSession: (session: AuthSession) => getSessionAdapter().setSession(session),
  clearSession: () => getSessionAdapter().clearSession(),
  async getToken(): Promise<string | null> {
    return (await getSessionAdapter().getSession()).token;
  },
};

export { AUTH_STORAGE_KEY };
