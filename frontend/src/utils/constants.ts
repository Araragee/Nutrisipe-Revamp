export const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL + "/api" : undefined) || "http://localhost:3001/api";

// Root of the server (no /api suffix) — used for static asset paths.
const SERVER_ORIGIN = API_URL.replace(/\/api\/?$/, '')

/** Resolve a relative server-side asset path to an absolute URL. */
export function assetUrl(path: string): string {
  if (!path || path.startsWith('http')) return path
  return `${SERVER_ORIGIN}/${path.replace(/^\//, '')}`
}

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  SUGGESTIONS_LIMIT: 15,
  ACTIVITY_LIMIT: 20,
};

export const DEBOUNCE_MS = 300;

export const SCROLL_THRESHOLD = 0.8;
