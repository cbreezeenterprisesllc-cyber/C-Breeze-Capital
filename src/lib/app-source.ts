// Consumer-funnel tagging.
//
// Every consumer page view and every consumer order carries an `app_source` so
// the GreenExpress App funnel and the merchant SaaS funnel stay separate in
// reporting: 'app' = the consumer marketplace surface, 'storefront' = a legacy
// single-dispensary storefront link, 'saas' = the merchant product.
//
// Events land in the `app_events` table (POST /api/app/events). Tracking is
// best-effort: it must never break a page or a checkout.
import { useEffect } from "react";

export const APP_SOURCE = "app" as const;
export type AppSource = "app" | "storefront" | "saas";

export function trackAppEvent(name: string, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({
      name,
      appSource: APP_SOURCE,
      path: window.location.pathname,
      props,
    });
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/app/events", blob)) return;
    }
    void fetch("/api/app/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => { /* best effort */ });
  } catch {
    /* analytics must never break the page */
  }
}

/** Record a consumer page view once per mount. */
export function useAppPageView(name: string, props: Record<string, unknown> = {}) {
  useEffect(() => {
    trackAppEvent(name, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
}
