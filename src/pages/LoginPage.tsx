import { useCallback, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FaCircleCheck } from 'react-icons/fa6';
import { useAuth } from '../hooks/useAuth';
import { appLogger } from '../services/logger';
import {
  clayUserLogin,
  clayVerifyOtp,
  isClayOtpLoginSuccess,
  type ClayAuthApiResponse,
} from '../services/clayAuthApi';
import { buildAuthUserFromClayOtp } from '../utils/clayUser';

interface LoginState {
  userName: string;
  password: string;
  otp: string;
  partnerCode: string;
  isOtpRequired: boolean;
  error: string | null;
  successMessage: string | null;
  isLoading: boolean;
}

const INITIAL_STATE: LoginState = {
  userName: '',
  password: '',
  otp: '',
  partnerCode: '',
  isOtpRequired: false,
  error: null,
  successMessage: null,
  isLoading: false,
};

/**
 * Clay OTP login UI. On success, calls AuthContext so ProtectedRoute allows /tickets.
 * Token is stored via authService (sessionStorage) for axios — not only localStorage.
 */
export function LoginPage() {
  const { user, loginWithExternalSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from
    ?.pathname;

  const [state, setState] = useState<LoginState>(INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);

  const updateState = useCallback((updates: Partial<LoginState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearMessages = useCallback(() => {
    updateState({ error: null, successMessage: null });
  }, [updateState]);

  const processLoginResponse = useCallback(
    (response: ClayAuthApiResponse) => {
      appLogger.info('Clay UserLogin response', response);

      if (
        response.status === 'success' ||
        response.message === 'OTP generated Successfully' ||
        response.message?.toLowerCase().includes('otp')
      ) {
        const partnerCode = response.partnerCode || response.data?.partnerCode || '';
        updateState({
          successMessage:
            'OTP has been sent to your email! Please check and enter it below.',
          isOtpRequired: true,
          partnerCode,
          error: null,
        });
      } else if (response.status === 'error') {
        updateState({
          error: response.message || 'Login failed! Please check your credentials.',
          isOtpRequired: false,
        });
      } else {
        updateState({
          error: 'Unexpected response from server. Please try again.',
          isOtpRequired: false,
        });
      }
    },
    [updateState],
  );

  const processOtpResponse = useCallback(
    (
      response: ClayAuthApiResponse,
      ctx: { userName: string; partnerCode: string },
    ) => {
      appLogger.info('Clay Verify_loginuser response', response);

      if (!isClayOtpLoginSuccess(response)) {
        updateState({
          error: response.message || 'Invalid OTP. Please check and try again.',
          otp: '',
        });
        return;
      }

      if (!response.token?.trim()) {
        updateState({
          error: 'No authentication token received. Please try again.',
          otp: '',
        });
        return;
      }

      const authUser = buildAuthUserFromClayOtp(response, ctx.userName, ctx.partnerCode);
      loginWithExternalSession({ user: authUser, token: response.token.trim() });
      toast.success('Signed in');

      const target =
        from && from !== '/login' && from !== '/'
          ? from
          : '/tickets';
      navigate(target, { replace: true });
    },
    [loginWithExternalSession, navigate, from, updateState],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearMessages();
    updateState({ isLoading: true });

    try {
      if (state.isOtpRequired) {
        if (!state.otp || state.otp.length < 4) {
          updateState({
            error: 'Please enter a valid OTP',
            isLoading: false,
          });
          return;
        }

        if (!state.partnerCode) {
          updateState({
            error: 'Partner code is missing. Please login again.',
            isLoading: false,
            isOtpRequired: false,
          });
          return;
        }

        const response = await clayVerifyOtp(state.otp, state.partnerCode);
        processOtpResponse(response, {
          userName: state.userName,
          partnerCode: state.partnerCode,
        });
      } else {
        if (!state.userName || !state.password) {
          updateState({
            error: 'Please enter both username and password',
            isLoading: false,
          });
          return;
        }

        const response = await clayUserLogin(state.userName, state.password);
        processLoginResponse(response);
      }
    } catch (error) {
      appLogger.error('Login form error', error);
      updateState({
        error: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      updateState({ isLoading: false });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getButtonText = (): string => {
    if (state.isLoading) return 'Please wait...';
    return state.isOtpRequired ? 'Verify OTP' : 'Login';
  };

  const handleResendOtp = async () => {
    clearMessages();
    updateState({ isLoading: true });

    try {
      const response = await clayUserLogin(state.userName, state.password);
      if (
        response.status === 'success' ||
        response.message === 'OTP generated Successfully'
      ) {
        updateState({
          successMessage: 'OTP resent successfully! Please check your email.',
          partnerCode: response.partnerCode || response.data?.partnerCode || state.partnerCode,
          error: null,
        });
      } else {
        updateState({
          error: 'Failed to resend OTP. Please try again.',
        });
      }
    } catch {
      updateState({
        error: 'Failed to resend OTP. Please try again.',
      });
    } finally {
      updateState({ isLoading: false });
    }
  };

  const handleBackToLogin = () => {
    setState(INITIAL_STATE);
  };

  if (user) {
    return <Navigate to={from && from !== '/login' ? from : '/tickets'} replace />;
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-3/5 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(52,211,153,0.15),_transparent_70%)]" />
        <div className="w-full flex flex-col items-center">
          <div className="text-center mt-8">
            <h2 className="text-4xl font-bold text-white mb-4">Welcome to Arvind Ticket</h2>
            <p className="text-lg text-white max-w-md mx-auto">
              Login to your account to continue
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-slate-50 dark:bg-background-dark overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Please log in to continue</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-8 pt-6">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {state.isOtpRequired ? 'Verify OTP' : 'Login to Arvind Ticket'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  {state.isOtpRequired
                    ? 'Enter the 6-digit OTP sent to your email'
                    : 'Please enter your credentials to log in.'}
                </p>
              </div>

              <form className="space-y-6" onSubmit={(e) => void handleSubmit(e)}>
                <div>
                  <label
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    htmlFor="username"
                  >
                    Username
                  </label>
                  <input
                    className="w-full py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    id="username"
                    name="userName"
                    placeholder="Enter your username"
                    type="text"
                    value={state.userName}
                    onChange={(e) => updateState({ userName: e.target.value })}
                    disabled={state.isOtpRequired || state.isLoading}
                    required
                    autoComplete="username"
                  />
                </div>

                {!state.isOtpRequired && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                        htmlFor="password"
                      >
                        Password
                      </label>
                      <a
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                        href="#"
                        tabIndex={-1}
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        className="w-full py-3 px-4 pr-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        type={showPassword ? 'text' : 'password'}
                        value={state.password}
                        onChange={(e) => updateState({ password: e.target.value })}
                        disabled={state.isLoading}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        onClick={togglePasswordVisibility}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <FaEyeSlash className="text-xl cursor-pointer" />
                        ) : (
                          <FaEye className="text-xl cursor-pointer" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {state.isOtpRequired && (
                  <div>
                    <label
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                      htmlFor="otp"
                    >
                      Enter OTP
                    </label>
                    <input
                      className="w-full py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none text-center text-2xl tracking-[0.5em] font-mono"
                      id="otp"
                      name="otp"
                      placeholder="••••••"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={state.otp}
                      onChange={(e) =>
                        updateState({ otp: e.target.value.replace(/\D/g, '') })
                      }
                      disabled={state.isLoading}
                      required
                      autoFocus
                    />

                    <div className="flex items-center justify-between mt-3">
                      <button
                        type="button"
                        onClick={handleBackToLogin}
                        className="text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
                        disabled={state.isLoading}
                      >
                        ← Back to Login
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleResendOtp()}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                        disabled={state.isLoading}
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                )}

                {state.error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
                    <span className="text-red-500 text-lg leading-none" aria-hidden>
                      !
                    </span>
                    <p className="text-red-600 dark:text-red-400 text-sm">{state.error}</p>
                  </div>
                )}

                {state.successMessage && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2">
                    <FaCircleCheck className="text-emerald-500 text-lg shrink-0" />
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm">
                      {state.successMessage}
                    </p>
                  </div>
                )}

                <button
                  className="w-full bg-[#4E5F7E] hover:bg-[#3b4a6a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group"
                  type="submit"
                  disabled={state.isLoading}
                >
                  {state.isLoading ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 1116 0A8 8 0 014 12z"
                      />
                    </svg>
                  ) : (
                    <span className="text-lg group-hover:translate-x-0.5 transition-transform">
                      {state.isOtpRequired ? '✓' : '→'}
                    </span>
                  )}
                  <span>{getButtonText()}</span>
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Need help?{' '}
                  <a
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    href="#"
                  >
                    Contact Support
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
