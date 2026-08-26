import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { Modal } from "~/components/Modal";
import { getChatToken, chatLogin, DEMO_ACCOUNTS } from "~/lib/chat-client";

export const Route = createFileRoute("/dashboard/merchant/promotions")({
  component: PromotionsPage,
});

function decodeTenant(token: string | null): { role?: string; tenantId?: string } {
  if (!token) return {};
  try {
    const part = token.split(".")[1];
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return { role: json.role, tenantId: json.tenantId };
  } catch { return {}; }
}
type Promotion = {
  id: string; title: string; description?: string; code?: string;
  discount_type: string; discount_value: number; starts_at?: string | null;
  ends_at?: string | null; is_active: number; created_at?: string;
};
const EMPTY = { title: "", description: "", code: "", discount_type: "percent", discount_value: "", starts_at: "", ends_at: "" };

function PromotionsPage() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [items, setItems] = useState<Promotion[]>([]);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const auth = () => ({ Authorization: "Bearer " + (getChatToken() || "") });
  const detach = useCallback(() => {
    const { role, tenantId } = decodeTenant(getChatToken());
    setTenantId(role === "merchant" && tenantId ? tenantId : null);
  }, []);
  const load = useCallback(async () => {
    if (!tenantId) return;
    const t = getChatToken();
    // merchant-scoped: pass the token, request all (includes inactive)
    try {
      const res = await fetch("/api/promotions?all=1", { headers: auth() });
      const j = await res.json();
      setItems((j.data as Promotion[]) || []);
    } catch { /* ignore */ }
  }, [tenantId]);
  useEffect(() => { detach(); }, [detach]);
  useEffect(() => { if (tenantId) load(); }, [tenantId, load]);
  const signIn = async (role: string) => { await chatLogin(role); setMsg(null); detach(); };

  const open = (p?: Promotion) => {
    setErr(null);
    if (p) {
      setEditing(p);
      setForm({
        title: p.title, description: p.description || "", code: p.code || "",
        discount_type: p.discount_type, discount_value: String(p.discount_value),
        starts_at: p.starts_at || "", ends_at: p.ends_at || "",
      });
    } else { setEditing(null); setForm(EMPTY); }
    setShow(true);
  };
  const save = async () => {
    setErr(null);
    if (!form.title.trim()) { setErr("Title is required."); return; }
    setSaving(true);
    const body = {
      title: form.title.trim(), description: form.description, code: form.code,
      discount_type: form.discount_type, discount_value: Number(form.discount_value) || 0,
      starts_at: form.starts_at || null, ends_at: form.ends_at || null, is_active: 1,
    };
    try {
      const res = await fetch(editing ? `/api/promotions/${editing.id}` : "/api/promotions", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...auth() },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!j.success) { setErr(j.error || "Failed to save"); }
      else { setShow(false); await load(); }
    } catch { setErr("Network error"); }
    setSaving(false);
  };
  const toggle = async (p: Promotion) => {
    await fetch(`/api/promotions/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...auth() },
      body: JSON.stringify({ is_active: p.is_active ? false : true }),
    });
    await load();
  };
  const remove = async (p: Promotion) => {
    await fetch(`/api/promotions/${p.id}`, { method: "DELETE", headers: auth() });
    await load();
  };

  if (!tenantId) {
    return (
      <div className="max-w-md mx-auto mt-10 text-center">
        <h1 className="text-xl font-semibold mb-4">Promotions</h1>
        <p className="text-sm text-gray-500 mb-4">Sign in as a merchant to manage promotions.</p>
        {DEMO_ACCOUNTS.filter((a) => a.mode === "demo").map((a) => (
          <Button key={a.role} variant="primary" className="m-1" onClick={() => signIn(a.role)}>
            Sign in as {a.label}
          </Button>
        ))}
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading">Promotions</h1>
        <Button variant="primary" onClick={() => open()}>+ New Promotion</Button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Deals you create appear on your storefront and in marketing. Retailer sets the terms — GreenExpress is your
        technology and customer-acquisition layer.
      </p>
      {msg && <p className="text-green-600 text-sm mb-3">{msg}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.length === 0 && (
          <Card><CardBody><p className="text-sm text-gray-500">No promotions yet. Create your first deal to promote on the storefront.</p></CardBody></Card>
        )}
        {items.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{p.title}</h3>
                <Badge variant={p.is_active ? "success" : "neutral"}>{p.is_active ? "Active" : "Off"}</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 mb-2">{p.description || "No description"}</p>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="primary">
                  {p.discount_type === "percent" ? `${p.discount_value}% off` : `$${p.discount_value} off`}
                </Badge>
                {p.code && <Badge variant="neutral">Code: {p.code}</Badge>}
              </div>
              <p className="text-xs text-gray-400 mb-3">
                {p.starts_at ? `Starts ${new Date(p.starts_at).toLocaleDateString()}` : "Starts now"}
                {p.ends_at ? ` · Ends ${new Date(p.ends_at).toLocaleDateString()}` : ""}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => open(p)}>Edit</Button>
                <Button variant="outline" size="sm" onClick={() => toggle(p)}>{p.is_active ? "Deactivate" : "Activate"}</Button>
                <Button variant="danger" size="sm" onClick={() => remove(p)}>Delete</Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal open={show} onClose={() => setShow(false)} title={editing ? "Edit Promotion" : "New Promotion"}>
        <div className="space-y-3">
          <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Title (e.g. 20% off Flower)" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm" value={form.code ? "code" : ""} disabled>
              <option value="">No code</option>
            </select>
            <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Code (optional)" value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm" value={form.discount_type}
              onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
              <option value="percent">Percent off</option>
              <option value="dollars">Dollar off</option>
            </select>
            <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm" type="number" placeholder="Value" value={form.discount_value}
              onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-gray-500">Start
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" type="datetime-local" value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </label>
            <label className="text-xs text-gray-500">End
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" type="datetime-local" value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </label>
          </div>
          {err && <p className="text-red-500 text-sm">{err}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShow(false)}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
