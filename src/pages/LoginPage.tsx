import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import { HiArrowRight } from 'react-icons/hi2';
import { useAuth } from '../hooks/useAuth';

interface LoginState {
  userName: string;
  password: string;
  isLoading: boolean;
}

const INITIAL_STATE: LoginState = {
  userName: '',
  password: '',
  isLoading: false,
};

export function LoginPage() {
  const { loginWithExternalSession } = useAuth();
  const navigate = useNavigate();

  const [state, setState] = useState<LoginState>(INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);

  const updateState = (updates: Partial<LoginState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!state.userName || !state.password) {
      toast.error('Please enter both username and password');
      return;
    }

    updateState({ isLoading: true });

    try {
      const response = await fetch('https://tmsapi.clay.in/api/Login/Login_User', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
        },
        body: JSON.stringify({
          userName: state.userName,
          password: state.password,
        }),
      });

      const data = await response.json();

      if (!data.isSuccess) {
        toast.error(data.message || 'Login failed');
        return;
      }

      // Map API response to full AuthUser type
      const authUser = {
        id: data.data.userID,
        userName: data.data.userName,
        role: data.data.role,
        email: data.data.userName, // fallback, API doesn't return email
        name: data.data.userName,  // fallback, API doesn't return full name
      };

      loginWithExternalSession({ user: authUser, token: data.token });

      toast.success('Login successful!');
      navigate('/tickets/new', { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      updateState({ isLoading: false });
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="flex min-h-screen">
      {/* Left side illustration */}
      <div className="hidden lg:flex lg:w-3/5 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(52,211,153,0.15),_transparent_70%)]" />
        <div className="w-full flex flex-col items-center">
          <div className="text-center mt-8">
            <h2 className="text-4xl font-bold text-white mb-4">Welcome to Clay Ticket</h2>
            <p className="text-lg text-white max-w-md mx-auto">
              Login to your account to continue
            </p>
          </div>
        </div>
      </div>

      {/* Login form */}
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
                  Login to Clay Ticket
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Please enter your credentials to log in.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    htmlFor="username"
                  >
                    Username
                  </label>
                  <input
                    className="w-full py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                    id="username"
                    name="userName"
                    placeholder="Enter your username"
                    type="text"
                    value={state.userName}
                    onChange={(e) => updateState({ userName: e.target.value })}
                    disabled={state.isLoading}
                    required
                    autoComplete="username"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                      htmlFor="password"
                    >
                      Password
                    </label>
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
                      {showPassword ? <FaEyeSlash className="text-xl cursor-pointer" /> : <FaEye className="text-xl cursor-pointer" />}
                    </button>
                  </div>
                </div>

                <button
                  className="w-full bg-[#4E5F7E] hover:bg-[#3b4a6a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group"
                  type="submit"
                  disabled={state.isLoading}
                >
                  {state.isLoading ? (
                    <FaSpinner className="h-5 w-5 animate-spin shrink-0" aria-hidden />
                  ) : (
                    <HiArrowRight
                      className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  )}
                  <span>{state.isLoading ? 'Please wait...' : 'Login'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;