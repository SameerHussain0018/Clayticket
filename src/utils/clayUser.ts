import type { AuthUser, UserRole } from '../types/models';
import type { ClayAuthApiResponse } from '../services/clayAuthApi';

function resolveAdminFromEnv(userKeys: string[]): boolean {
  const raw = import.meta.env.VITE_CLAY_ADMIN_USERNAMES;
  if (typeof raw !== 'string' || !raw.trim()) return false;
  const admins = new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  return userKeys.some((k) => admins.has(k.toLowerCase()));
}

/**
 * Maps Clay OTP success payload into app AuthUser (session + sidebar).
 * Clay `role` (e.g. Partner) maps to app `user` unless env admin list / Admin-like role applies.
 */
export function buildAuthUserFromClayOtp(
  response: ClayAuthApiResponse,
  fallbackUserName: string,
  fallbackPartnerCode: string,
): AuthUser {
  const d = response.data;
  const userID = d?.userID?.trim();
  const email =
    userID && userID.includes('@')
      ? userID
      : userID
        ? `${userID}@clay.local`
        : `${fallbackUserName}@clay.local`;
  const name = d?.userName?.trim() || fallbackUserName;
  const id = String(d?.partnerCode ?? fallbackPartnerCode ?? userID ?? name);

  const clayRole = (d?.role ?? '').toLowerCase();
  let role: UserRole = 'user';
  if (resolveAdminFromEnv([name, fallbackUserName, email, id])) {
    role = 'admin';
  } else if (clayRole.includes('admin')) {
    role = 'admin';
  }

  return { id, email, name, role };
}

/** @deprecated use buildAuthUserFromClayOtp with full response */
export function buildClayAuthUser(userName: string, partnerCode?: string): AuthUser {
  return {
    id: partnerCode?.trim() || userName,
    email: `${userName}@clay.local`,
    name: userName,
    role: resolveAdminFromEnv([userName]) ? 'admin' : 'user',
  };
}
