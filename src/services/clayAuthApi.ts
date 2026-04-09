import { appLogger } from './logger';

/** Nested user object returned after successful OTP (Clay API). */
export interface ClayUserPayload {
  userID?: string;
  userName?: string;
  partnerCode?: string;
  role?: string;
  markupdiscount?: string;
}

export interface ClayAuthApiResponse {
  status?: string;
  token?: string;
  isSuccess?: boolean;
  message?: string;
  partnerCode?: string;
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
  return 'https://esimgo.clay.in/api/Authentication';
}

export async function clayUserLogin(
  userName: string,
  password: string,
): Promise<ClayAuthApiResponse> {
  try {
    const response = await fetch(`${clayAuthBase()}/UserLogin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userName, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return (await response.json()) as ClayAuthApiResponse;
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
  partnerCode: string,
): Promise<ClayAuthApiResponse> {
  try {
    const response = await fetch(`${clayAuthBase()}/Verify_loginuser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ otp, partnerCode }),
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
