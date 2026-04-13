import { appLogger } from './logger';

/** Nested user object returned after successful OTP (Clay API). */
export interface ClayUserPayload {
  userID?: string;
  userName?: string;
  auCode?: string;
  role?: string;
  markupdiscount?: string;
}

export interface ClayAuthApiResponse {
  status?: string;
  token?: string;
  isSuccess?: boolean;
  message?: string;
  auCode?: string;
  data?: ClayUserPayload;
  token_expire?: string;
}

/** Treats typical Clay success shapes (incl. message "Login Successful"). */
export function isClayOtpLoginSuccess(response: ClayAuthApiResponse): boolean {
  const flag = response.isSuccess as unknown;
  if (flag === true || String(flag).toLowerCase() === 'true') return true;
  if (response.status === 'success') return true;
  const m = response.message?.toLowerCase() ?? '';
  if (m.includes('login successful')) return true;
  if (m.includes('successful') && response.token) return true;
  return Boolean(response.token && response.data?.userID);
}

function clayAuthBase(): string {
  const raw = import.meta.env.VITE_CLAY_AUTH_BASE;
  if (typeof raw === 'string' && raw.replace(/\/$/, '').length > 0) {
    return raw.replace(/\/$/, '');
  }
  return 'https://localhost:44304/api/';
}

export async function clayUserLogin(
  userName: string,
  password: string,
): Promise<ClayAuthApiResponse> {
  try {
    const response = await fetch(`${clayAuthBase()}Auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // backend expects `username` (lowercase) according to curl examples
      body: JSON.stringify({ username: userName, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = (await response.json()) as Record<string, any>;

    // Normalize fields some Clay endpoints return (e.g. `aucode`)
    if (json.aucode && !json.auCode) {
      json.auCode = json.aucode;
    }

    // Treat presence of aucode as success for OTP generation flows
    if (json.aucode && !json.status) {
      json.status = 'success';
    }

    return json as ClayAuthApiResponse;
  } catch (error) {
    appLogger.error('Clay UserLogin failed', error);
    return {
      status: 'error',
      message: 'Network error. Please check your connection and try again.',
    };
  }
}

export async function clayVerifyOtp(
  otp: string,
  auCode: string,
): Promise<ClayAuthApiResponse> {
  try {
    // verify endpoint uses kebab-case `verify-user` under Auth
    const response = await fetch(`${clayAuthBase()}Auth/verify-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ otp, auCode }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return (await response.json()) as ClayAuthApiResponse;
  } catch (error) {
    appLogger.error('Clay Verify_loginuser failed', error);
    return {
      status: 'error',
      isSuccess: false,
      message: 'Network error. Please check your connection and try again.',
    };
  }
}
