import type { AuthUser } from '../../types/models';
import { apiClient } from '../api/client';
import { authStorage } from './authStorage';

export interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponseBody {
  user: AuthUser;
  accessToken?: string;
}

function isMockMode(): boolean {
  return import.meta.env.VITE_USE_MOCK !== 'false';
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mockLogin(email: string, password: string): AuthUser {
  if (email === 'admin@example.com' && password === 'admin') {
    return {
      id: '1',
      email,
      name: 'Admin User',
      role: 'admin',
    };
  }
  if (email === 'user@example.com' && password === 'user') {
    return {
      id: '2',
      email,
      name: 'Regular User',
      role: 'user',
    };
  }
  throw new Error('Invalid email or password.');
}

export const authService = {
  async login({ email, password }: LoginCredentials): Promise<AuthUser> {
    if (isMockMode()) {
      await delay(350);
      const user = mockLogin(email.trim(), password);
      authStorage.setUser(user);
      authStorage.setBearerToken(`mock-jwt-${user.id}`);
      return user;
    }

    const { data } = await apiClient.post<LoginResponseBody>('/auth/login', {
      email,
      password,
    });

    authStorage.setUser(data.user);

    const allowBearer =
      import.meta.env.VITE_DEV_BEARER_FROM_BODY === 'true' && data.accessToken;
    if (allowBearer) {
      authStorage.setBearerToken(data.accessToken!);
    } else {
      authStorage.setBearerToken(null);
    }

    return data.user;
  },

  async logout(): Promise<void> {
    const hasApiBase =
      typeof import.meta.env.VITE_API_URL === 'string' &&
      import.meta.env.VITE_API_URL.replace(/\/$/, '').length > 0;
    if (!isMockMode() && hasApiBase) {
      try {
        await apiClient.post('/auth/logout');
      } catch {
        // Still clear local session even if the server call fails
      }
    }
    authStorage.clearSession();
  },

  getStoredUser(): AuthUser | null {
    return authStorage.getUser();
  },

  /** After external OTP (e.g. Clay) — persists user + Bearer token for axios. */
  establishSession(user: AuthUser, bearerToken: string): void {
    authStorage.setUser(user);
    authStorage.setBearerToken(bearerToken);
  },
};
