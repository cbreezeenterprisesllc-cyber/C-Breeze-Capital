import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "~/components/Card";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { Icon } from "~/components/Icon";
import { getChatToken, chatLogin, DEMO_ACCOUNTS } from "~/lib/chat-client";
import { apiFetch } from "~/lib/api-config";
import { DAY_KEYS, parseHours, type StoreHours, type DayKey } from "~/lib/store-hours";

export const Route = createFileRoute("/dashboard/merchant/settings")({
  component: MerchantSettingsPage,
});

interface DayEdit {
  closed: boolean;
  allDay: boolean;
  open: string;
  close: string;
}

function decodeTenantId(token: string | null): { role?: string; tenantId?: string } {
  if (!token) return {};
  try {
    const part = token.split(".")[1];
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return { role: json.role, tenantId: json.tenantId };
  } catch {
    return {};
  }
}

const EMPTY: DayEdit = { closed: true, allDay: false, open: "09:00", close: "21:00" };

function toEdits(hours: StoreHours): Record<DayKey, DayEdit> {
  const out = {} as Record<DayKey, DayEdit>;
  for (const day of DAY_KEYS) {
    const d = hours[day];
    out[day] = d
      ? { closed: !!d.closed, allDay: !!d.allDay, open: d.open, close: d.close }
      : { ...EMPTY };
  }
  return out;
}

function toHours(edits: Record<DayKey, DayEdit>): StoreHours {
  const out: StoreHours = {};
  for (const day of DAY_KEYS) {
    const e = edits[day];
    if (e.closed) continue; // closed/unset
    out[day] = { open: e.open, close: e.close, closed: false, allDay: e.allDay };
  }
  return out;
}

function MerchantSettingsPage() {
  const token = getChatToken();
  const { role, tenantId } = decodeTenantId(token);
  const isMerchant = !!token && role === "merchant" && !!tenantId;

  const [, setHours] = useState<StoreHours>({});
  const [edits, setEdits] = useState<Record<DayKey, DayEdit> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState("");

  const load = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const res = await apiFetch(`/api/tenants/${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (!payload.success) { setError(payload.error || "Could not load store"); setLoading(false); return; }
      setTenantName(payload.data.store_name || payload.data.name || "");
      const hrs = parseHours(payload.data.hours as string | undefined);
      setHours(hrs);
      setEdits(toEdits(hrs));
      setLoading(false);
    } catch {
      setError("Could not load store hours");
      setLoading(false);
    }
  }, [tenantId, token]);

  useEffect(() => { load(); }, [load]);

  const handleLogin = async () => {
    const u = await chatLogin("merchant");
    if (u) {
      window.location.reload();
    } else {
      setError("Demo sign-in failed — is the server up?");
    }
  };

  const setDay = (day: DayKey, patch: Partial<DayEdit>) => {
    if (!edits) return;
    setEdits((prev) => prev ? { ...prev, [day]: { ...prev[day], ...patch } } : prev);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!edits || !tenantId) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload = { hours: toHours(edits) };
      const res = await apiFetch(`/api/tenants/${tenantId}/hours`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setHours(parseHours(json.data?.hours as string | undefined));
      } else {
        setError(json.error || "Save failed");
      }
    } catch {
      setError("Network error while saving");
    } finally {
      setSaving(false);
    }
  };

  const setAllClosed = (closed: boolean) => {
    if (!edits) return;
    setEdits((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      for (const day of DAY_KEYS) next[day] = { ...next[day], closed };
      return next;
    });
    setSaved(false);
  };

  if (loading) {
    return <div className="animate-fade-in text-center py-16 text-[var(--color-neutral-400)]">Loading store hours…</div>;
  }

  if (!isMerchant) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 mb-6">
          <Icon name="settings" size={28} />
          <h1 className="text-3xl font-[var(--font-heading)] gradient-text-green">Store Settings</h1>
        </div>
        <Card padding="lg" className="max-w-lg">
          <CardHeader>
            <h2 className="font-[var(--font-heading)] text-lg flex items-center gap-2">
              <Icon name="clock" size={18} /> Sign in to manage your hours
            </h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-[var(--color-neutral-600)] mb-4">
              Hours are managed by the dispensary's merchant account. Sign in with the merchant demo
              role to edit this screen (the same account powers your Inbox).
            </p>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.filter((a) => a.role === "merchant").map((a) => (
                <Button key={a.role} variant="neon" onClick={handleLogin}>{a.label}</Button>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Icon name="settings" size={28} />
          <h1 className="text-3xl font-[var(--font-heading)] gradient-text-green">Store Settings</h1>
        </div>
        {tenantName && <Badge variant="primary" size="sm">{tenantName}</Badge>}
      </div>
      <p className="text-[var(--color-neutral-500)] mb-6 -mt-2">
        Set your regular operating hours. This shows on your storefront and tells customers when
        ordering is available.
      </p>

      {error && <div className="mb-4 text-sm text-[var(--color-error)]">{error}</div>}
      {saved && <div className="mb-4 text-sm text-[var(--color-success)]">Hours saved — your storefront is updated.</div>}

      <Card padding="lg">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-[var(--font-heading)] text-lg flex items-center gap-2">
              <Icon name="clock" size={18} /> Weekly hours
            </h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setAllClosed(false)}>Open every day</Button>
              <Button size="sm" variant="outline" onClick={() => setAllClosed(true)}>Closed every day</Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {edits && DAY_KEYS.map((day) => {
              const e = edits[day];
              return (
                <div key={day} className="grid grid-cols-1 sm:grid-cols-[120px_1fr_auto] items-center gap-3 p-3 rounded-xl border border-[var(--color-neutral-200)] bg-[var(--surface)]">
                  <span className="font-semibold capitalize text-[var(--color-neutral-800)]">{day}</span>
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="flex items-center gap-2 text-sm text-[var(--color-neutral-600)]">
                      <input
                        type="checkbox"
                        checked={e.closed}
                        onChange={(ev) => setDay(day, { closed: ev.target.checked, allDay: false })}
                        className="accent-[var(--color-primary-600)]"
                      />
                      Closed
                    </label>
                    {!e.closed && (
                      <>
                        <label className="flex items-center gap-2 text-sm text-[var(--color-neutral-600)]">
                          <input
                            type="checkbox"
                            checked={e.allDay}
                            onChange={(ev) => setDay(day, { allDay: ev.target.checked })}
                            className="accent-[var(--color-primary-600)]"
                          />
                          Open 24 hours
                        </label>
                        {!e.allDay && (
                          <>
                            <input
                              type="time"
                              value={e.open}
                              onChange={(ev) => setDay(day, { open: ev.target.value })}
                              className="px-2 py-1.5 rounded-lg border border-[var(--color-neutral-200)] text-sm"
                            />
                            <span className="text-[var(--color-neutral-400)] text-sm">–</span>
                            <input
                              type="time"
                              value={e.close}
                              onChange={(ev) => setDay(day, { close: ev.target.value })}
                              className="px-2 py-1.5 rounded-lg border border-[var(--color-neutral-200)] text-sm"
                            />
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <span className="text-sm text-[var(--color-neutral-400)] hidden sm:block">
                    {e.closed ? "Closed" : e.allDay ? "24 hours" : `${e.open} – ${e.close}`}
                  </span>
                </div>
              );
            })}
          </div>
        </CardBody>
        <CardFooter>
          <div className="flex items-center justify-end gap-3">
            <span className="text-xs text-[var(--color-neutral-400)]">
              Overnight? Set close earlier than open (e.g. 22:00 – 02:00).
            </span>
            <Button variant="neon" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save hours"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
