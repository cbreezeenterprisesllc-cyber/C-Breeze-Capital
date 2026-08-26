import { apiFetch } from "~/lib/api-config";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { getChatToken } from "~/lib/chat-client";

export const Route = createFileRoute("/admin/applications")({
  component: AdminMerchantApplications,
});

const appStatus: Record<string, { variant: "warning" | "success" | "error" | "neutral"; label: string }> = {
  new: { variant: "warning", label: "New" },
  reviewed: { variant: "neutral", label: "Reviewed" },
  onboarded: { variant: "success", label: "Onboarded" },
  not_interested: { variant: "error", label: "Not interested" },
};
const emailStatus: Record<string, { variant: "warning" | "success"; label: string }> = {
  pending: { variant: "warning", label: "Pending" },
  sent: { variant: "success", label: "Sent" },
};

function AdminMerchantApplications() {
  const [apps, setApps] = useState<any[]>([]);
  const [outbox, setOutbox] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = getChatToken();

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [a, o] = await Promise.all([
        apiFetch("/api/admin/applications", { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch("/api/admin/outbox", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const ad = await a.json();
      const od = await o.json();
      if (ad.success) setApps(ad.data || []); else setError(ad.error || "Couldn't load applications.");
      if (od.success) setOutbox(od.data || []);
    } catch { setError("Network error."); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const res = await apiFetch(`/api/admin/applications/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, reviewed_by: "admin" }),
    });
    const d = await res.json();
    if (d.success) load();
  };

  const markSent = async (id: string) => {
    const res = await apiFetch(`/api/admin/outbox/${id}/sent`, {
      method: "PUT", headers: { Authorization: `Bearer ${token}` },
    });
    const d = await res.json();
    if (d.success) load();
  };

  return (
    <div>
      <h1 className="font-[var(--font-heading)] text-2xl text-[var(--color-primary-900)] mb-1">Merchant Applications</h1>
      <p className="text-sm text-[var(--color-neutral-500)] mb-6">Call-free intake submissions from dispensaries. Review, update status, and send queued confirmation emails.</p>

      {!token && (
        <div style={{ padding: 14, borderRadius: 12, background: "var(--color-error-50, #fef2f2)", border: "1px solid var(--color-error)", color: "var(--color-error-700, #b91c1c)", marginBottom: 16, fontSize: 14 }}>
          Sign in as an admin to view applications and the email queue.
        </div>
      )}

      {error && <p style={{ color: "var(--color-error)", marginBottom: 16 }}>{error}</p>}

      <Card padding="lg" className="mb-6">
        <CardHeader><h2 className="font-[var(--font-heading)] text-lg text-[var(--color-primary-900)]">Email queue</h2></CardHeader>
        <CardBody>
          {loading ? <p className="text-sm text-[var(--color-neutral-500)]">Loading…</p> : outbox.length === 0 ? (
            <p className="text-sm text-[var(--color-neutral-500)]">No queued emails.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {outbox.map((m) => (
                <div key={m.id} style={{ border: "1px solid var(--color-neutral-200)", borderRadius: 12, padding: 12, background: "var(--surface-primary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{m.subject}</p>
                      <p style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>
                        to <b>{m.to_email}</b> · {m.purpose === "team_notice" ? "team notice" : "applicant confirmation"} · {m.status === "sent" ? m.sent_at : "pending"}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Badge variant={emailStatus[m.status]?.variant ?? "neutral"} size="sm">{emailStatus[m.status]?.label ?? m.status}</Badge>
                      {m.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => markSent(m.id)}>Mark sent</Button>
                      )}
                    </div>
                  </div>
                  <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "var(--color-neutral-600)", marginTop: 8, fontFamily: "inherit" }}>{m.body}</pre>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card padding="lg">
        <CardHeader><h2 className="font-[var(--font-heading)] text-lg text-[var(--color-primary-900)]">Applications</h2></CardHeader>
        <CardBody>
          {loading ? <p className="text-sm text-[var(--color-neutral-500)]">Loading…</p> : apps.length === 0 ? (
            <p className="text-sm text-[var(--color-neutral-500)]">No applications yet. Share the interest form to start receiving leads.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {apps.map((a) => (
                <div key={a.id} style={{ border: "1px solid var(--color-neutral-200)", borderRadius: 12, padding: 14, background: "var(--surface-primary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 15 }}>{a.dispensary_name}</p>
                      <p style={{ fontSize: 13, color: "var(--color-neutral-500)" }}>
                        {[a.city, a.state].filter(Boolean).join(", ") || "—"} · {a.website || "no website"}
                      </p>
                      <p style={{ fontSize: 13, color: "var(--color-neutral-500)" }}>
                        {a.contact_name || "—"} &lt;{a.contact_email}&gt; · opted in: {a.opted_in ? "yes" : "no"}
                      </p>
                      {a.message && <p style={{ fontSize: 13, color: "var(--color-neutral-600)", marginTop: 6 }}>“{a.message}”</p>}
                      <p style={{ fontSize: 12, color: "var(--color-neutral-400)", marginTop: 4 }}>{a.created_at}</p>
                    </div>
                    <Badge variant={appStatus[a.status]?.variant ?? "neutral"} size="sm">{appStatus[a.status]?.label ?? a.status}</Badge>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    {(["reviewed", "onboarded", "not_interested"] as const).map((s) => (
                      <Button key={s} size="sm" variant={s === "onboarded" ? "neon" : "outline"} onClick={() => setStatus(a.id, s)} disabled={a.status === s}>
                        Mark {s === "not_interested" ? "not interested" : s}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
