/**
 * Centralized logging for errors and failed API calls.
 * Swap `forwardToRemote` with your analytics/error service when needed.
 */
function forwardToRemote(level: 'error' | 'warn', message: string, context?: unknown): void {
  void level;
  void message;
  void context;
  // Example: Sentry.captureException(...)
}

export const appLogger = {
  error(message: string, context?: unknown): void {
    console.error(`[App] ${message}`, context ?? '');
    forwardToRemote('error', message, context);
  },

  warn(message: string, context?: unknown): void {
    console.warn(`[App] ${message}`, context ?? '');
    forwardToRemote('warn', message, context);
  },

  apiFailure(
    method: string,
    url: string,
    status: number | undefined,
    detail: unknown,
  ): void {
    const payload = { status, detail };
    console.error(`[API] ${method} ${url} failed`, payload);
    forwardToRemote('error', `API ${method} ${url}`, payload);
  },

  info(message: string, context?: unknown): void {
    console.info(`[App] ${message}`, context ?? '');
  },
};
