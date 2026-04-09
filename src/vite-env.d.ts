/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** When true, use in-memory/mock auth and tickets (no backend). Default: treat as true if unset. */
  readonly VITE_USE_MOCK: string;
  /** When true with a real API, persist JWT from login response in sessionStorage (dev only). Prefer HttpOnly cookies in production. */
  readonly VITE_DEV_BEARER_FROM_BODY: string;
  /** Clay OTP auth API base (no trailing slash). */
  readonly VITE_CLAY_AUTH_BASE: string;
  /** Comma-separated Clay usernames that should get admin role in the app UI after OTP login. */
  readonly VITE_CLAY_ADMIN_USERNAMES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
