// Scheduled delivery / pickup window utilities for GreenExpress.
//
// Scheduling config is stored per tenant as a JSON object in the new
// tenants.delivery_config column:
//   { "enabled": true, "windowMinutes": 60, "leadMinutes": 60, "daysAhead": 3 }
// - enabled:      whether checkout offers a schedule option at all.
// - windowMinutes: length of each schedulable slot (30/60/90/120).
// - leadMinutes:   minimum advance time required before a slot (soonest you can book).
// - daysAhead:     how many days out slots are offered (1–7).
//
// Available windows are computed WITHIN the dispensary's operating hours (the
// store-hours capability in src/lib/store-hours.ts, tenants.hours). A slot is
// offered only when the store is open at the slot start.
import {
  isOpenAt,
  type StoreHours,
} from "~/lib/store-hours";

export interface DeliveryConfig {
  enabled: boolean;
  windowMinutes: number;
  leadMinutes: number;
  daysAhead: number;
}

export interface DeliveryWindow {
  start: string; // ISO-format start of the window, e.g. "2026-08-25T16:00:00"
  end: string; // ISO-format end of the window
  label: string; // human label, e.g. "Tue 4:00 PM – 5:00 PM"
}

export const DELIVERY_CONFIG_DEFAULTS: DeliveryConfig = {
  enabled: false,
  windowMinutes: 60,
  leadMinutes: 60,
  daysAhead: 3,
};

function toInt(v: unknown, fallback: number, min?: number, max?: number): number {
  const n = Math.round(Number(v));
  const val = Number.isFinite(n) ? n : fallback;
  if (min !== undefined && val < min) return fallback;
  if (max !== undefined && val > max) return fallback;
  return val;
}

export function sanitizeDeliveryConfig(input: unknown): DeliveryConfig {
  const cfg = (input && typeof input === "object" && !Array.isArray(input) ? input : {}) as Record<string, unknown>;
  return {
    enabled: cfg.enabled === true,
    windowMinutes: toInt(cfg.windowMinutes, DELIVERY_CONFIG_DEFAULTS.windowMinutes, 15, 240),
    leadMinutes: toInt(cfg.leadMinutes, DELIVERY_CONFIG_DEFAULTS.leadMinutes, 0, 2880),
    daysAhead: toInt(cfg.daysAhead, DELIVERY_CONFIG_DEFAULTS.daysAhead, 1, 14),
  };
}

export function parseDeliveryConfig(raw: string | null | undefined): DeliveryConfig {
  if (!raw) return { ...DELIVERY_CONFIG_DEFAULTS };
  try {
    return sanitizeDeliveryConfig(JSON.parse(raw));
  } catch {
    return { ...DELIVERY_CONFIG_DEFAULTS };
  }
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatTime(h: number, m: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${period}`;
}

function toLocalISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function computeWindows(hours: StoreHours, config: DeliveryConfig, now: Date = new Date()): DeliveryWindow[] {
  if (!config.enabled) return [];
  const stepMs = config.windowMinutes * 60 * 1000;
  // Soonest a slot may start = now + lead time.
  const leadStart = new Date(now.getTime() + config.leadMinutes * 60 * 1000);
  // Align slots to clean local-hour boundaries from local midnight.
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayStartMs = dayStart.getTime();
  let startMs = dayStartMs + Math.ceil((leadStart.getTime() - dayStartMs) / stepMs) * stepMs;
  const lastMs = new Date(now.getFullYear(), now.getMonth(), now.getDate() + config.daysAhead).getTime();
  const windows: DeliveryWindow[] = [];
  while (startMs <= lastMs) {
    const start = new Date(startMs);
    const end = new Date(startMs + stepMs);
    // Only offer a slot if the store is open at its start.
    if (isOpenAt(hours, start)) {
      windows.push({
        start: toLocalISO(start),
        end: toLocalISO(end),
        label: `${DAY_LABELS[start.getDay()]} ${formatTime(start.getHours(), start.getMinutes())} – ${formatTime(end.getHours(), end.getMinutes())}`,
      });
    }
    startMs += stepMs;
  }
  return windows;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Human label for a stored scheduled window start, e.g. "Tue, Aug 25 at 2:00 PM".
// Returns null when empty/invalid (i.e. the order is immediate / as soon as possible).
export function formatScheduledLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  const period = d.getHours() >= 12 ? "PM" : "AM";
  const h12 = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
  return `${DAY_LABELS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()} at ${h12}:${pad(d.getMinutes())} ${period}`;
}
