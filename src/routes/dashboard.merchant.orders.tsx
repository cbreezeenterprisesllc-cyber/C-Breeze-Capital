import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardFooter } from "~/components/Card";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { Modal } from "~/components/Modal";
import { Icon } from "~/components/Icon";
import { getChatToken, chatLogin, DEMO_ACCOUNTS } from "~/lib/chat-client";

export const Route = createFileRoute("/dashboard/merchant/orders")({
  component: OrdersPage,
});

function decodeTenantId(token: string | null): { role?: string; tenantId?: string } {
  if (!token) return {};
  try {
    const part = token.split(".")[1];
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return { role: json.role, tenantId: json.tenantId };
  } catch { return {}; }
}

type Order = {
  id: string;
  customer_name?: string;
  total: number;
  delivery_fee?: number;
  delivery_address?: string;
  status: string;
  created_at?: string;
  item_count?: number;
  driver_id?: string | null;
  id_document_type?: string;
  id_last_four?: string;
  id_name?: string;
  id_dob?: string;
  verified_by?: string;
  verified_at?: string;
  signature?: string;
};

const FLOW = ["pending", "confirmed", "preparing", "in_transit", "delivered"];
const NEXT: Record<string, string> = { pending: "confirmed", confirmed: "preparing", preparing: "in_transit" };
const statusColors: Record<string, "neutral" | "primary" | "warning" | "info" | "success" | "error"> = {
  pending: "neutral", confirmed: "primary", preparing: "warning", assigned: "info",
  in_transit: "info", delivered: "success", cancelled: "error",
};

function OrdersPage() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const detachTenant = useCallback(() => {
    const t = getChatToken();
    const { role, tenantId } = decodeTenantId(t);
    if (t && role === "merchant" && tenantId) setTenantId(tenantId);
    else setTenantId(null);
  }, []);

  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await fetch(`/api/orders?tenantId=${tenantId}`).then((r) => r.json());
      setOrders((res.data as Order[]) || []);
      // keep detail modal in sync
      setSelected((prev) => prev ? orders.find((o) => o.id === prev.id) || prev : prev);
    } catch { /* ignore */ }
  }, [tenantId]);

  useEffect(() => { detachTenant(); }, [detachTenant]);
  useEffect(() => { if (tenantId) load(); }, [tenantId, load]);

  const signIn = async (role: string) => { await chatLogin(role); setMsg(null); detachTenant(); };

  const advance = async (o: Order, next: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${o.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const payload = await res.json();
      if (!res.ok) { setMsg(payload.error || "Update failed."); }
      else setMsg(`Order ${o.id.slice(0, 8)} moved to "${next}".`);
      load();
    } catch { setMsg("Network error."); }
    setBusy(false);
  };

  const cancel = async (o: Order) => {
    if (!window.confirm("Cancel this order?")) return;
    setBusy(true);
    await fetch(`/api/orders/${o.id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "cancelled" }) });
    setMsg("Order cancelled.");
    load();
    setBusy(false);
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const synced = selected ? orders.find((o) => o.id === selected.id) || null : null;
  const cur = synced || selected;
  const fmtTime = (t?: string) => (t ? new Date(t).toLocaleString() : "—");

  if (!tenantId) {
    return (
      <Card>
        <div className="p-10 text-center space-y-3">
          <Icon name="clipboard" size={28} />
          <p className="font-semibold">Sign in to view orders</p>
          <p className="text-sm text-[var(--color-neutral-500)]">Use a merchant account to manage live customer orders.</p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {DEMO_ACCOUNTS.filter((a) => a.role === "merchant").map((a) => (
              <Button key={a.email} onClick={() => signIn(a.role)}>{a.label.split("·")[1].trim()}</Button>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-[var(--font-heading)] gradient-text-green flex items-center gap-2"><Icon name="clipboard" size={28} /> Orders</h1>
        <select className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          {[...FLOW, "cancelled"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>
      {msg && <div className="mb-4 rounded-lg bg-[var(--color-success-50)] border border-[var(--color-success-200)] px-4 py-2 text-sm text-[var(--color-success-700)]">{msg}</div>}
      <Card padding="none">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]">
              <th className="p-4 font-medium">#</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Items</th>
              <th className="p-4 font-medium">Total</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Advance</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const next = NEXT[o.status];
              return (
                <tr key={o.id} className="border-t border-[var(--color-neutral-200)] hover:bg-[var(--color-neutral-50)] cursor-pointer" onClick={() => setSelected(o)}>
                  <td className="p-4 font-medium">{o.id.slice(0, 8)}</td>
                  <td className="p-4">{o.customer_name || "—"}</td>
                  <td className="p-4">{o.item_count ?? "—"}</td>
                  <td className="p-4 font-medium">${Number(o.total || 0).toFixed(2)}</td>
                  <td className="p-4"><Badge variant={statusColors[o.status] || "neutral"} size="sm">{o.status}</Badge></td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    {next ? (
                      <Button size="sm" variant="secondary" disabled={busy} onClick={() => advance(o, next)}>
                        {o.status === "preparing" ? "Hand to driver" : `Mark ${next}`}
                      </Button>
                    ) : o.status === "in_transit" ? (
                      <span className="text-xs text-[var(--color-neutral-500)]">Awaiting driver (ID + signature)</span>
                    ) : (
                      <span className="text-xs text-[var(--color-neutral-500)]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      {filtered.length === 0 && <p className="text-center py-12 text-[var(--color-neutral-400)]">No orders match this status.</p>}

      <Modal open={!!cur} onClose={() => setSelected(null)} title={cur ? `Order ${cur.id.slice(0, 8)}` : ""} size="lg">
        {cur && (
          <div>
            <div className="flex justify-between mb-4">
              <Badge variant={statusColors[cur.status] || "neutral"} size="md">{cur.status}</Badge>
              <span className="text-xs text-[var(--color-neutral-400)]">Placed {fmtTime(cur.created_at)}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><p className="text-[var(--color-neutral-500)]">Customer</p><p className="font-medium">{cur.customer_name || "—"}</p></div>
              <div><p className="text-[var(--color-neutral-500)]">Items</p><p className="font-medium">{cur.item_count ?? "—"}</p></div>
              <div className="col-span-2"><p className="text-[var(--color-neutral-500)]">Delivery address</p><p className="font-medium">{cur.delivery_address || "—"}</p></div>
            </div>
            <div className="border-t border-[var(--color-neutral-200)] pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-[var(--color-neutral-500)]">Delivery fee</span><span>${Number(cur.delivery_fee || 0).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-base"><span>Total</span><span>${Number(cur.total || 0).toFixed(2)}</span></div>
            </div>


            {cur.started_at && (
              <div className="mt-5 rounded-lg border border-[var(--color-primary-200)] bg-[var(--color-primary-50)]/40 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary-700)] mb-2"><Icon name="camera" size={16} /> Driver identity check-in (start of delivery)</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><span className="text-[var(--color-neutral-500)]">Started at</span><p className="font-medium">{fmtTime(cur.started_at)}</p></div>
                  <div><span className="text-[var(--color-neutral-500)]">Driver ID</span><p className="font-medium">{cur.driver_id ? cur.driver_id.slice(0, 8) : "—"}</p></div>
                </div>
                <div className="mt-3 flex gap-6">
                  {cur.driver_reference_selfie && (
                    <div><span className="text-xs text-[var(--color-neutral-500)]">Reference selfie (on file)</span><img src={cur.driver_reference_selfie} alt="reference" className="mt-1 h-20 w-16 rounded border border-[var(--color-neutral-200)] bg-white object-cover" /></div>
                  )}
                  {cur.start_selfie && (
                    <div><span className="text-xs text-[var(--color-neutral-500)]">Start-of-delivery selfie</span><img src={cur.start_selfie} alt="start selfie" className="mt-1 h-20 w-16 rounded border border-[var(--color-neutral-200)] bg-white object-cover" /></div>
                  )}
                </div>
              </div>
            )}

            {cur.status === "delivered" && (
              <div className="mt-5 rounded-lg border border-[var(--color-success-200)] bg-[var(--color-success-50)]/40 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-success-700)] mb-2">
                  <Icon name="check" size={16} /> Delivery verified — ID + signature on file
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><span className="text-[var(--color-neutral-500)]">ID type</span><p className="font-medium">{cur.id_document_type || "—"}</p></div>
                  <div><span className="text-[var(--color-neutral-500)]">ID last four</span><p className="font-medium">•••• {cur.id_last_four || "—"}</p></div>
                  <div><span className="text-[var(--color-neutral-500)]">Verified name</span><p className="font-medium">{cur.id_name || "—"}</p></div>
                  <div><span className="text-[var(--color-neutral-500)]">DOB</span><p className="font-medium">{cur.id_dob || "—"}</p></div>
                  <div><span className="text-[var(--color-neutral-500)]">Verified by</span><p className="font-medium">{cur.verified_by ? cur.verified_by.slice(0, 8) : "—"}</p></div>
                  <div><span className="text-[var(--color-neutral-500)]">Verified at</span><p className="font-medium">{fmtTime(cur.verified_at)}</p></div>
                </div>
                {cur.signature && (
                  <div className="mt-3">
                    <span className="text-xs text-[var(--color-neutral-500)]">Customer signature</span>
                    <img src={cur.signature} alt="Customer signature" className="mt-1 h-16 rounded border border-[var(--color-neutral-200)] bg-white" />
                  </div>
                )}
              </div>
            )}

            <CardFooter>
              <div className="flex gap-3">
                {NEXT[cur.status] && (
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => { advance(cur, NEXT[cur.status]); setSelected(null); }}>
                    {cur.status === "preparing" ? "Hand to driver" : `Mark ${NEXT[cur.status]}`}
                  </Button>
                )}
                {cur.status === "in_transit" && (
                  <span className="text-xs text-[var(--color-neutral-500)] self-center">Delivered on-site by driver (ID scan + signature).</span>
                )}
                {[FLOW[0], FLOW[1], FLOW[2], FLOW[3]].includes(cur.status) && (
                  <Button size="sm" variant="danger" disabled={busy} onClick={() => { cancel(cur); setSelected(null); }}>Cancel order</Button>
                )}
              </div>
            </CardFooter>
          </div>
        )}
      </Modal>
    </div>
  );
}
