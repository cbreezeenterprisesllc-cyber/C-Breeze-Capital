// Driver performance scoring, warnings, and deactivation.
//
// v1 algorithm (owner-refined 2026-08-25). Thresholds are code-constant so they
// are easy to tune; documented in DRIVER-SCORING.md. All decisions are gated by
// a minimum delivered count so one bad rating cannot nuke a new driver.
//
// Score definition (computed over the last N delivered orders, or all if fewer):
//   ratingScore   = average customer star rating (1–5) on delivered, driver-rated orders
//   onTimeRate    = fraction of delivered orders that were on time (0–1)
//   composite     = 0.5 * ((ratingScore - 1) / 4) + 0.5 * onTimeRate   -> 0..1
//
// Status transitions:
//   below MIN_DELIVERIES            -> "scoring"      (no warning, no action)
//   composite below WARN_SCORE      -> "warning"      (in-app warning, still active)
//   composite below DEACTIVATE_SCORE-> "deactivated"  (is_active=0, cannot claim/be dispatched)
//
// Default thresholds (see DRIVER-SCORING.md for rationale):
//   MIN_DELIVERIES   = 10
//   WARN_SCORE       = 0.40   (≈ avg 2.6★ with 50% on-time, or 1★ at 80% on-time)
//   DEACTIVATE_SCORE = 0.25   (≈ avg 1★ at 50% on-time, or 3★ at 0% on-time)

export const DRIVER_SCORING = {
  minDeliveries: 10,
  warnScore: 0.4,
  deactivateScore: 0.25,
  lookbackDeliveries: 50,
  // ASAP on-time target: delivered within this many minutes of order creation.
  asapDeliveryMinutes: 60,
  // Scheduled orders are "on time" if delivered before the window END (plus grace).
  scheduledGraceMinutes: 15,
} as const;

export type DriverScoreStatus = "scoring" | "active" | "warning" | "deactivated";

export interface OrderForScoring {
  id: string;
  status: string;
  delivered_at: string | null;
  created_at: string | null;
  scheduled_delivery_at: string | null;
  on_time: number | null; // 1 on time, 0 late, null not yet scored
  driver_id: string | null;
}

export interface DriverPerformance {
  deliveredCount: number;
  scoredCount: number;
  avgRating: number | null; // null until a rating exists
  ratingCount: number;
  onTimeCount: number;
  onTimeRate: number | null; // null until a delivered order is scored
  composite: number | null;
  status: DriverScoreStatus;
  reason: string;
}

const MIN_MS = 60_000;

function isoMs(v: string | null | undefined): number | null {
  if (!v) return null;
  const t = Date.parse(v.replace(" ", "T") + (v.includes(":") ? "" : ""));
  return Number.isNaN(t) ? null : t;
}

// Determine on-time for a single delivered order. Returns 1 (on time) or 0 (late).
export function computeOnTime(order: Partial<OrderForScoring>): number | null {
  if (!order.driver_id) return null; // pickup/curbside or unassigned — no driver performance signal
  if (order.status !== "delivered") return null;
  const delivered = isoMs(order.delivered_at);
  if (delivered === null) return null;
  const scheduled = isoMs(order.scheduled_delivery_at);
  if (scheduled !== null) {
    // Scheduled: on time if delivered before window end + grace.
    const start = isoMs(order.scheduled_delivery_at);
    const windowEnd = start !== null ? start + DRIVER_SCORING.scheduledGraceMinutes * MIN_MS : delivered;
    return delivered <= windowEnd ? 1 : 0;
  }
  // ASAP: on time if delivered within target of order creation.
  const created = isoMs(order.created_at);
  if (created === null) return 1; // no creation time -> assume on time (lenient)
  return delivered - created <= DRIVER_SCORING.asapDeliveryMinutes * MIN_MS ? 1 : 0;
}

export function avgRating(ratings: { rating: number }[]): number | null {
  if (ratings.length === 0) return null;
  return ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
}

// Compute a driver's aggregate performance and status from their delivered orders.
export function evaluateDriver(
  orders: OrderForScoring[],
  ratings: { rating: number }[],
): DriverPerformance {
  const delivered = orders.filter((o) => o.status === "delivered" && o.driver_id);
  const deliveredCount = delivered.length;
  const ar = avgRating(ratings);
  // On-time rate over delivered orders (only ones actually scored).
  const scored = delivered.filter((o) => o.on_time === 0 || o.on_time === 1);
  const onTimeCount = scored.filter((o) => o.on_time === 1).length;
  const onTimeRate = scored.length > 0 ? onTimeCount / scored.length : null;

  if (deliveredCount < DRIVER_SCORING.minDeliveries) {
    return {
      deliveredCount, scoredCount: scored.length, avgRating: ar, ratingCount: ratings.length,
      onTimeCount, onTimeRate, composite: null,
      status: "scoring",
      reason: `Scoring starts after ${DRIVER_SCORING.minDeliveries} deliveries (currently ${deliveredCount}).`,
    };
  }
  const ratingScore = ar !== null ? (ar - 1) / 4 : 0.5; // no ratings yet -> neutral 0.5
  const ot = onTimeRate !== null ? onTimeRate : 0.5;
  const composite = Math.round((0.5 * ratingScore + 0.5 * ot) * 1000) / 1000;

  if (composite < DRIVER_SCORING.deactivateScore) {
    return {
      deliveredCount, scoredCount: scored.length, avgRating: ar, ratingCount: ratings.length,
      onTimeCount, onTimeRate, composite, status: "deactivated",
      reason: `Composite ${composite} below deactivation threshold ${DRIVER_SCORING.deactivateScore}.`,
    };
  }
  if (composite < DRIVER_SCORING.warnScore) {
    return {
      deliveredCount, scoredCount: scored.length, avgRating: ar, ratingCount: ratings.length,
      onTimeCount, onTimeRate, composite, status: "warning",
      reason: `Composite ${composite} below warning threshold ${DRIVER_SCORING.warnScore}.`,
    };
  }
  return {
    deliveredCount, scoredCount: scored.length, avgRating: ar, ratingCount: ratings.length,
    onTimeCount, onTimeRate, composite, status: "active",
    reason: "Performance within thresholds.",
  };
}