// API URL configuration for GreenExpress
// Handles both web (relative URLs) and Capacitor native (absolute URLs)

const LIVE_BACKEND = "https://ef5d2c4ae9113753571b85ddf95ab4dd.ctonew.app";

declare global {
  interface Window {
    Capacitor?: { isNativePlatform: () => boolean };
    __CAPACITOR__?: boolean;
  }
}

/**
 * Returns true if the app is running inside a Capacitor native webview.
 * Checks both the Capacitor bridge and the __CAPACITOR__ flag set in our
 * index.html (for the iOS webview before the bridge fully initializes).
 */
export function isCapacitor(): boolean {
  try {
    if ((window as any).__CAPACITOR__) return true;
    return !!(window as any).Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
}

/**
 * Returns the base URL for API calls.
 * In Capacitor native mode, returns the live backend URL.
 * In web mode, returns empty string (relative URLs).
 */
export function getApiBase(): string {
  return isCapacitor() ? LIVE_BACKEND : "";
}

/**
 * Wraps fetch() to use the correct API base URL.
 * Automatically prefixes /api/ paths with the live backend URL
 * when running inside Capacitor.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let url = input;
  if (typeof input === "string" && input.startsWith("/api/")) {
    const base = getApiBase();
    if (base) {
      url = base + input;
    }
  }
  return fetch(url, init);
}