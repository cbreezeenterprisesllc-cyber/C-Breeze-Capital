// Dispatch pipeline — shared by the merchant dashboard, the driver view and the
// customer tracking page.
//
// OPTION B (the only model GreenExpress runs): the licensed RETAILER fulfils the
// delivery with its OWN staff. GreenExpress supplies the storefront + dispatch
// software. Nothing in this module implies GreenExpress custody of product, and
// every customer-facing label says "delivery staff", never "GreenExpress driver".
//
// Pipeline: pending → assigned → ready → picked_up → in_transit → delivered
//           (+ cancelled at any non-final step)
// Pickup / curbside orders skip the courier legs: pending → ready → delivered.

export type DispatchStatus =
  | "pending"
  | "assigned"
  | "ready"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled";

/** Ordered happy-path states (cancelled is off-path). */
export const PIPELINE: DispatchStatus[] = [
  "pending",
  "assigned",
  "ready",
  "picked_up",
  "in_transit",
  "delivered",
];

/** Pipeline for a pickup/curbside order — no delivery leg at all. */
export const PICKUP_PIPELINE: DispatchStatus[] = ["pending", "ready", "delivered"];

export const STATUS_LABELS: Record<string, string> = {
  pending: "Order received",
  assigned: "Delivery staff assigned",
  ready: "Packed & ready",
  picked_up: "Picked up",
  in_transit: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Short labels for the compact progress rail. */
export const STATUS_SHORT: Record<string, string> = {
  pending: "Received",
  assigned: "Staff assigned",
  ready: "Ready",
  picked_up: "Picked up",
  in_transit: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Customer-facing explanation of each state (Option-B accurate wording). */
export const STATUS_DESCRIPTIONS: Record<string, string> = {
  pending: "The dispensary has your order and is confirming it.",
  assigned: "A dispensary delivery staff member has been assigned to your order.",
  ready: "Your order is packed and waiting to leave the dispensary.",
  picked_up: "Dispensary delivery staff have your order in hand.",
  in_transit: "Your order is on the way to you.",
  delivered: "Delivered by the dispensary's delivery staff.",
  cancelled: "This order was cancelled. No charges were made.",
};

/** Legacy status values that still exist in older rows — mapped to the pipeline. */
const LEGACY_ALIASES: Record<string, DispatchStatus> = {
  confirmed: "assigned",
  preparing: "ready",
};

/** Normalise any stored status value to a pipeline state. */
export function normalizeStatus(status?: string | null): DispatchStatus {
  if (!status) return "pending";
  if (LEGACY_ALIASES[status]) return LEGACY_ALIASES[status];
  if (status === "cancelled") return "cancelled";
  return (PIPELINE as string[]).includes(status) ? (status as DispatchStatus) : "pending";
}

/** States the pipeline may move to from `from` (final states have none). */
export function allowedNext(from: DispatchStatus, fulfillmentType?: string | null): DispatchStatus[] {
  if (from === "delivered" || from === "cancelled") return [];
  const pickup = isPickupFulfillment(fulfillmentType);
  switch (from) {
    case "pending":
      return pickup ? ["ready", "cancelled"] : ["assigned", "cancelled"];
    case "assigned":
      return pickup ? ["ready", "cancelled"] : ["ready", "cancelled"];
    case "ready":
      return pickup ? ["delivered", "cancelled"] : ["picked_up", "cancelled"];
    case "picked_up":
      return ["in_transit", "delivered", "cancelled"];
    case "in_transit":
      return ["delivered", "cancelled"];
    default:
      return [];
  }
}

export function canTransition(
  from: DispatchStatus,
  to: DispatchStatus,
  fulfillmentType?: string | null,
): boolean {
  return allowedNext(from, fulfillmentType).includes(to);
}

export function isPickupFulfillment(fulfillmentType?: string | null): boolean {
  return fulfillmentType === "pickup" || fulfillmentType === "curbside";
}

/** The progress rail a customer sees for this order. */
export function pipelineFor(fulfillmentType?: string | null): DispatchStatus[] {
  return isPickupFulfillment(fulfillmentType) ? PICKUP_PIPELINE : PIPELINE;
}

/** Column on `orders` that stores the timestamp for a given pipeline state. */
export const STAGE_TIMESTAMP_COLUMN: Record<DispatchStatus, string> = {
  pending: "created_at",
  assigned: "claimed_at",
  ready: "ready_at",
  picked_up: "picked_up_at",
  in_transit: "started_at",
  delivered: "delivered_at",
  cancelled: "cancelled_at",
};

export type DispatchOrderLike = {
  status?: string | null;
  fulfillment_type?: string | null;
  created_at?: string | null;
  scheduled_delivery_at?: string | null;
  estimated_delivery_at?: string | null;
  claimed_at?: string | null;
  ready_at?: string | null;
  picked_up_at?: string | null;
  started_at?: string | null;
  delivered_at?: string | null;
};

/**
 * Estimated arrival window for an order.
 * - a scheduled window always wins (the customer chose it);
 * - otherwise the ETA is derived from when the order was placed (45 min for
 *   delivery, 20 min for pickup) — the retailer's own staff are doing the run,
 *   so this is a service estimate, not a GreenExpress promise.
 * Returns ISO strings so the client can render in the customer's timezone.
 */
export function estimateWindow(order: DispatchOrderLike): {
  start: string | null;
  end: string | null;
  scheduled: boolean;
} {
  if (order.scheduled_delivery_at) {
    const start = new Date(order.scheduled_delivery_at);
    if (!Number.isNaN(start.getTime())) {
      const minutes = isPickupFulfillment(order.fulfillment_type) ? 15 : 30;
      return {
        start: start.toISOString(),
        end: new Date(start.getTime() + minutes * 60000).toISOString(),
        scheduled: true,
      };
    }
  }
  if (order.estimated_delivery_at) {
    const start = new Date(order.estimated_delivery_at);
    if (!Number.isNaN(start.getTime())) {
      return {
        start: start.toISOString(),
        end: new Date(start.getTime() + 30 * 60000).toISOString(),
        scheduled: false,
      };
    }
  }
  if (order.delivered_at) {
    const t = new Date(order.delivered_at);
    if (!Number.isNaN(t.getTime())) return { start: t.toISOString(), end: t.toISOString(), scheduled: false };
  }
  if (!order.created_at) return { start: null, end: null, scheduled: false };
  // SQLite datetime('now') is UTC without a timezone suffix — make that explicit.
  const placed = new Date(String(order.created_at).replace(" ", "T") + (String(order.created_at).includes("Z") ? "" : "Z"));
  if (Number.isNaN(placed.getTime())) return { start: null, end: null, scheduled: false };
  const minutes = isPickupFulfillment(order.fulfillment_type) ? 20 : 45;
  const start = new Date(placed.getTime() + minutes * 60000);
  return { start: start.toISOString(), end: new Date(start.getTime() + 30 * 60000).toISOString(), scheduled: false };
}

/** "Today 2:15 PM – 2:45 PM" style label for an estimated window. */
export function formatWindowLabel(startIso: string | null, endIso: string | null): string {
  if (!startIso) return "";
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return "";
  const end = endIso ? new Date(endIso) : null;
  const day = start.toDateString() === new Date().toDateString()
    ? "Today"
    : start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (!end || Number.isNaN(end.getTime())) return `${day} ${time(start)}`;
  return `${day} ${time(start)} – ${time(end)}`;
}

/** SQLite stores UTC "YYYY-MM-DD HH:MM:SS"; parse it as UTC for display. */
export function parseDbTime(value?: string | null): Date | null {
  if (!value) return null;
  const raw = String(value);
  const iso = raw.includes("T") ? raw : raw.replace(" ", "T");
  const d = new Date(iso.endsWith("Z") || /[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatTime(value?: string | null): string {
  const d = parseDbTime(value);
  return d ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "";
}
