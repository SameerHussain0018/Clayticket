import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthUser } from '../types/models';
import { authService, type LoginCredentials } from '../services/auth/authService';
import { ticketService } from '../services/tickets/ticketService';

interface AuthContextValue {
  user: AuthUser | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  /** Clay / OTP: store user + token after successful verification. */
  loginWithExternalSession: (payload: { user: AuthUser; token: string }) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getStoredUser());

  const login = useCallback(async (credentials: LoginCredentials) => {
    const next = await authService.login(credentials);
    setUser(next);
  }, []);

  const loginWithExternalSession = useCallback(
    (payload: { user: AuthUser; token: string }) => {
      authService.establishSession(payload.user, payload.token);
      setUser(payload.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    ticketService.clearSessionData();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      loginWithExternalSession,
      logout,
    }),
    [user, login, loginWithExternalSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
