import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardBody } from "~/components/Card";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { getChatToken, chatLogin, DEMO_ACCOUNTS } from "~/lib/chat-client";

export const Route = createFileRoute("/dashboard/merchant/customers")({
  component: CustomersPage,
});

function decodeTenant(token: string | null): { role?: string; tenantId?: string } {
  if (!token) return {};
  try {
    const part = token.split(".")[1];
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return { role: json.role, tenantId: json.tenantId };
  } catch { return {}; }
}
type Note = { note: string; created_at: string };
type Customer = {
  id: string; email: string; name: string; phone: string;
  order_count: number; total_spend: number; last_order_at: string | null;
  tags: string[]; notes: Note[];
};

function CustomersPage() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [rows, setRows] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const auth = () => ({ Authorization: "Bearer " + (getChatToken() || "") });
  const detach = useCallback(() => {
    const { role, tenantId } = decodeTenant(getChatToken());
    setTenantId(role === "merchant" && tenantId ? tenantId : null);
  }, []);
  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await fetch("/api/customers", { headers: auth() });
      const j = await res.json();
      setRows((j.data as Customer[]) || []);
    } catch { /* ignore */ }
  }, [tenantId]);
  useEffect(() => { detach(); }, [detach]);
  useEffect(() => { if (tenantId) load(); }, [tenantId, load]);
  const signIn = async (role: string) => { await chatLogin(role); setMsg(null); detach(); };

  const addTag = async (email: string) => {
    const tag = prompt("Tag (e.g. VIP, Local, Prefers flower):");
    if (!tag) return;
    await fetch("/api/customers/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth() },
      body: JSON.stringify({ customer_email: email, tag }),
    });
    await load();
  };
  const addNote = async (email: string, name: string) => {
    const note = prompt(`Note for ${name || email}:`);
    if (!note) return;
    await fetch("/api/customers/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth() },
      body: JSON.stringify({ customer_email: email, note }),
    });
    await load();
  };

  if (!tenantId) {
    return (
      <div className="max-w-md mx-auto mt-10 text-center">
        <h1 className="text-xl font-semibold mb-4">Customers</h1>
        <p className="text-sm text-gray-500 mb-4">Sign in as a merchant to manage your customer records (CRM).</p>
        {DEMO_ACCOUNTS.filter((a) => a.mode === "demo").map((a) => (
          <Button key={a.role} variant="primary" className="m-1" onClick={() => signIn(a.role)}>Sign in as {a.label}</Button>
        ))}
      </div>
    );
  }

  const filtered = rows.filter((r) =>
    !search || `${r.name} ${r.email}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading">Customers</h1>
        <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64"
          placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <p className="text-sm text-gray-500 mb-6">
        These are your customers' records from your orders. Only retailers see this — data stays with the dispensary.
      </p>
      {msg && <p className="text-green-600 text-sm mb-3">{msg}</p>}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card><CardBody><p className="text-sm text-gray-500">No customer records yet. Customers appear once they order through your storefront.</p></CardBody></Card>
        )}
        {filtered.map((c) => (
          <Card key={c.id}>
            <CardBody>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <p className="font-semibold">{c.name || "—"} <span className="text-xs text-gray-400 font-normal">{c.email}</span></p>
                  <p className="text-xs text-gray-500">Phone: {c.phone || "—"}</p>
                  <p className="text-xs text-gray-400">
                    {c.order_count} order(s) · ${Number(c.total_spend || 0).toFixed(2)} spent
                    {c.last_order_at ? ` · last ${new Date(c.last_order_at).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(c.tags || []).map((t) => <Badge key={t} variant="primary">{t}</Badge>)}
                  <Button variant="ghost" size="sm" onClick={() => addTag(c.email)}>+ Tag</Button>
                  <Button variant="ghost" size="sm" onClick={() => addNote(c.email, c.name)}>+ Note</Button>
                </div>
              </div>
              {(c.notes && c.notes.length > 0) && (
                <div className="mt-3 border-t border-gray-100 pt-2 space-y-1">
                  {c.notes.map((n, i) => (
                    <p key={i} className="text-xs text-gray-500">• {n.note} <span className="text-gray-300">({new Date(n.created_at).toLocaleDateString()})</span></p>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
