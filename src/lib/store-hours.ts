// Store-hours utilities for GreenExpress.
//
// Hours are stored per tenant as a JSON object in the tenants.hours column:
//   {
//     "monday":    { "open": "09:00", "close": "21:00", "closed": false, "allDay": false },
//     "tuesday":   { ... },
//     ...
//     "sunday":    { ... }
//   }
// - Day keys are lowercase English day names: sunday..saturday.
// - Times are 24-hour "HH:MM" strings.
// - A missing day key OR { "closed": true } means that day is closed.
// - { "allDay": true } means open 24 hours (open/close ignored).
// - Overnight shifts are supported: when close <= open the shop is understood to
//   close the following morning (e.g. open 22:00, close 02:00).
// - hours === "{}" (or empty/malformed) means "hours not configured" — callers
//   treat that as "unknown" and stay permissive (never block ordering on unknown).

export const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export interface DayHours {
  open: string; // "HH:MM" 24h
  close: string; // "HH:MM" 24h
  closed: boolean;
  allDay: boolean;
}
export type StoreHours = Partial<Record<DayKey, DayHours>>;

const DEFAULTS = { open: "09:00", close: "21:00" };

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Accepts "9:00", "09:00", "9:5" → returns zero-padded "HH:MM", or null if invalid.
function normalizeTime(value: string): string | null {
  const m = /^\s*(\d{1,2}):(\d{1,2})\s*$/.exec(value);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${pad(h)}:${pad(min)}`;
}

function coerce(value: unknown, fallback: string): string {
  if (typeof value === "string") {
    const t = normalizeTime(value);
    if (t) return t;
  }
  return fallback;
}

// Normalize an arbitrary payload (e.g. from the settings API) into a clean, safe
// StoreHours object. Unknown keys are dropped; invalid times fall back to defaults.
export function sanitizeHours(input: unknown): StoreHours {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const src = input as Record<string, unknown>;
  const out: StoreHours = {};
  for (const day of DAY_KEYS) {
    const d = src[day];
    if (!d || typeof d !== "object" || Array.isArray(d)) continue;
    const dd = d as Record<string, unknown>;
    const closed = dd.closed === true;
    const allDay = dd.allDay === true;
    out[day] = {
      open: coerce(dd.open, DEFAULTS.open),
      close: coerce(dd.close, DEFAULTS.close),
      closed,
      allDay,
    };
  }
  return out;
}

// Parse the JSON string stored in the DB into a StoreHours object.
export function parseHours(raw: string | null | undefined): StoreHours {
  if (!raw) return {};
  try {
    return sanitizeHours(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function hasConfiguredHours(hours: StoreHours): boolean {
  return DAY_KEYS.some((d) => hours[d] !== undefined);
}

function toMinutes(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

// Is the store open at `date` (defaults to now, local time)?
export function isOpenAt(hours: StoreHours, date: Date = new Date()): boolean {
  const day = DAY_KEYS[date.getDay()]; // getDay(): 0 = Sunday
  const d = hours[day];
  if (!d) return false; // unconfigured day => closed
  if (d.closed) return false;
  if (d.allDay) return true;
  const now = date.getHours() * 60 + date.getMinutes();
  const open = toMinutes(d.open);
  const close = toMinutes(d.close);
  if (close > open) return now >= open && now < close;
  // overnight: open from `open` until `close` the following morning
  return now >= open || now < close;
}

export function formatTime(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${period}`;
}

// Human label for a single day's hours, e.g. "9:00 AM – 9:00 PM", "Open 24 hours",
// or "Closed".
export function formatDay(hours: StoreHours, day: DayKey): string {
  const d = hours[day];
  if (!d || d.closed) return "Closed";
  if (d.allDay) return "Open 24 hours";
  return `${formatTime(d.open)} – ${formatTime(d.close)}`;
}

export function dayLabel(day: DayKey): string {
  return day[0].toUpperCase() + day.slice(1);
}

// Weekly schedule for display: [{ dayKey, label }] over all 7 days.
export function formatSchedule(hours: StoreHours): Array<{ dayKey: DayKey; label: string }> {
  return DAY_KEYS.map((day) => ({ dayKey: day, label: formatDay(hours, day) }));
}

// "Opens today at 10:00 AM" / "Opens tomorrow at 10:00 AM" / "Opens Monday at 10:00 AM".
// Returns null if hours are unconfigured or there is no future open slot in 7 days.
// Callers use this only when the store is currently closed.
export function nextOpenInfo(hours: StoreHours, date: Date = new Date()): { label: string } | null {
  if (!hasConfiguredHours(hours)) return null;
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowMin = date.getHours() * 60 + date.getMinutes();
  for (let offset = 0; offset < 7; offset++) {
    const probe = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    const day = DAY_KEYS[probe.getDay()];
    const d = hours[day];
    if (!d || d.closed) continue;
    if (d.allDay) {
      return offset === 0
        ? { label: "Open 24 hours today" }
        : { label: `Open 24 hours — starting ${dayLabel(day)}` };
    }
    const open = toMinutes(d.open);
    if (offset === 0) {
      if (nowMin < open) return { label: `Opens today at ${formatTime(d.open)}` };
      continue; // past today's open time and currently closed → check later days
    }
    return { label: `Opens ${dayLabel(day)} at ${formatTime(d.open)}` };
  }
  return null;
}
