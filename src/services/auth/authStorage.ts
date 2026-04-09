import type { AuthUser } from '../../types/models';

const USER_KEY = 'ticket_app_user';
const BEARER_KEY = 'ticket_app_bearer';

/**
 * Session snapshot for UI and reload persistence.
 * Tokens must not be readable from JS when using HttpOnly cookies only — in that case
 * `getBearerTokenIfAny` stays empty and the browser sends cookies automatically (`withCredentials: true`).
 *
 * If your backend returns a JWT in the JSON body (common in dev), set VITE_DEV_BEARER_FROM_BODY=true
 * and store it here only for that environment — production should rely on Set-Cookie + HttpOnly.
 */
export const authStorage = {
  getUser(): AuthUser | null {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  setUser(user: AuthUser): void {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /** Dev / non-HttpOnly fallback only — empty when using pure cookie sessions. */
  getBearerTokenIfAny(): string | null {
    return sessionStorage.getItem(BEARER_KEY);
  },

  setBearerToken(token: string | null): void {
    if (token) sessionStorage.setItem(BEARER_KEY, token);
    else sessionStorage.removeItem(BEARER_KEY);
  },

  clearSession(): void {
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(BEARER_KEY);
  },
};
