import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardBody } from "~/components/Card";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { getChatToken, chatLogin, DEMO_ACCOUNTS } from "~/lib/chat-client";

export const Route = createFileRoute("/dashboard/merchant/leads")({
  component: LeadsPage,
});

function decodeTenant(token: string | null): { role?: string; tenantId?: string } {
  if (!token) return {};
  try {
    const part = token.split(".")[1];
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return { role: json.role, tenantId: json.tenantId };
  } catch { return {}; }
}
type Lead = {
  id: string; name: string; email: string; phone: string; message: string;
  source: string; status: string; created_at: string;
};

function LeadsPage() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [rows, setRows] = useState<Lead[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const auth = () => ({ Authorization: "Bearer " + (getChatToken() || "") });
  const detach = useCallback(() => {
    const { role, tenantId } = decodeTenant(getChatToken());
    setTenantId(role === "merchant" && tenantId ? tenantId : null);
  }, []);
  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await fetch("/api/leads", { headers: auth() });
      const j = await res.json();
      setRows((j.data as Lead[]) || []);
    } catch { /* ignore */ }
  }, [tenantId]);
  useEffect(() => { detach(); }, [detach]);
  useEffect(() => { if (tenantId) load(); }, [tenantId, load]);
  const signIn = async (role: string) => { await chatLogin(role); setMsg(null); detach(); };

  const setStatus = async (id: string, status: string) => {
    await fetch(`/api/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...auth() },
      body: JSON.stringify({ status }),
    });
    await load();
  };

  if (!tenantId) {
    return (
      <div className="max-w-md mx-auto mt-10 text-center">
        <h1 className="text-xl font-semibold mb-4">Leads</h1>
        <p className="text-sm text-gray-500 mb-4">Sign in as a merchant to see inquiries captured from your storefront.</p>
        {DEMO_ACCOUNTS.filter((a) => a.mode === "demo").map((a) => (
          <Button key={a.role} variant="primary" className="m-1" onClick={() => signIn(a.role)}>Sign in as {a.label}</Button>
        ))}
      </div>
    );
  }
  const badgeColor = (s: string) => (s === "converted" ? "success" : s === "contacted" ? "primary" : "neutral");
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading">Leads</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Customer inquiries captured from your storefront. Follow up to turn them into orders — the sale is yours.
      </p>
      {msg && <p className="text-green-600 text-sm mb-3">{msg}</p>}
      <div className="space-y-3">
        {rows.length === 0 && (
          <Card><CardBody><p className="text-sm text-gray-500">No leads captured yet. Inquiries from your storefront will appear here.</p></CardBody></Card>
        )}
        {rows.map((l) => (
          <Card key={l.id}>
            <CardBody>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <p className="font-semibold">{l.name || "Anonymous"} <Badge variant={badgeColor(l.status) as any}>{l.status}</Badge></p>
                  <p className="text-xs text-gray-500">{l.email}{l.phone ? ` · ${l.phone}` : ""}</p>
                  {l.message && <p className="text-sm text-gray-600 mt-1">{l.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">via {l.source} · {new Date(l.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  {l.status !== "contacted" && <Button variant="outline" size="sm" onClick={() => setStatus(l.id, "contacted")}>Mark contacted</Button>}
                  {l.status !== "converted" && <Button variant="primary" size="sm" onClick={() => setStatus(l.id, "converted")}>Mark converted</Button>}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
