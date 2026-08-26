import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { getChatToken, chatLogin, DEMO_ACCOUNTS } from "~/lib/chat-client";

export const Route = createFileRoute("/dashboard/merchant/loyalty")({
  component: LoyaltyPage,
});

function decodeTenant(token: string | null): { role?: string; tenantId?: string } {
  if (!token) return {};
  try {
    const part = token.split(".")[1];
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return { role: json.role, tenantId: json.tenantId };
  } catch { return {}; }
}
type Program = { id: string; name: string; points_per_dollar: number; is_active: number };
type Member = { id: string; customer_email: string; points: number; updated_at: string };

function LoyaltyPage() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("Rewards");
  const [ppd, setPpd] = useState("1");
  const [active, setActive] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const auth = () => ({ Authorization: "Bearer " + (getChatToken() || "") });
  const detach = useCallback(() => {
    const { role, tenantId } = decodeTenant(getChatToken());
    setTenantId(role === "merchant" && tenantId ? tenantId : null);
  }, []);
  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      const [p, m] = await Promise.all([
        fetch("/api/loyalty/program", { headers: auth() }).then((r) => r.json()),
        fetch("/api/loyalty/members", { headers: auth() }).then((r) => r.json()),
      ]);
      if (p.data) {
        setProgram(p.data);
        setName(p.data.name || "Rewards");
        setPpd(String(p.data.points_per_dollar ?? 1));
        setActive(!!p.data.is_active);
      }
      setMembers((m.data as Member[]) || []);
    } catch { /* ignore */ }
  }, [tenantId]);
  useEffect(() => { detach(); }, [detach]);
  useEffect(() => { if (tenantId) load(); }, [tenantId, load]);
  const signIn = async (role: string) => { await chatLogin(role); setMsg(null); detach(); };

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/loyalty/program", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...auth() },
      body: JSON.stringify({ name, points_per_dollar: Number(ppd) || 1, is_active: active }),
    });
    const j = await res.json();
    setSaving(false);
    if (j.success) { setMsg("Loyalty program saved."); setProgram(j.data); }
  };

  if (!tenantId) {
    return (
      <div className="max-w-md mx-auto mt-10 text-center">
        <h1 className="text-xl font-semibold mb-4">Loyalty & Rewards</h1>
        <p className="text-sm text-gray-500 mb-4">Sign in as a merchant to manage your rewards program.</p>
        {DEMO_ACCOUNTS.filter((a) => a.mode === "demo").map((a) => (
          <Button key={a.role} variant="primary" className="m-1" onClick={() => signIn(a.role)}>Sign in as {a.label}</Button>
        ))}
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading">Loyalty & Rewards</h1>
        <Badge variant={active ? "success" : "neutral"}>{active ? "Enabled" : "Disabled"}</Badge>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Configure your rewards program. Points are earned on eligible purchases made through the retailer — you set the
        terms and fulfill rewards. GreenExpress provides the technology to track and manage it; it is not the seller or
        payment intermediary.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="font-semibold">Program Settings</h2></CardHeader>
          <CardBody>
            <div className="space-y-3">
              <label className="block text-xs text-gray-500">Program name
                <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="block text-xs text-gray-500">Points per dollar
                <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" type="number" value={ppd} onChange={(e) => setPpd(e.target.value)} />
              </label>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                <span className="text-sm text-gray-600">Program active on storefront</span>
              </div>
              <Button variant="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Program"}</Button>
              {msg && <p className="text-green-600 text-sm">{msg}</p>}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><h2 className="font-semibold">Member Points</h2></CardHeader>
          <CardBody>
            {members.length === 0 ? (
              <p className="text-sm text-gray-500">No members yet. Points accrue on eligible purchases through your store.</p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-sm">{m.customer_email}</span>
                    <Badge variant="primary">{m.points} pts</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
