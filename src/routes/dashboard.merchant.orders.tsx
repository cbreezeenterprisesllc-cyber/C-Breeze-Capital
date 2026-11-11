import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardFooter } from "~/components/Card";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { Modal } from "~/components/Modal";
import { Icon } from "~/components/Icon";
import { SignaturePad } from "~/components/SignaturePad";
import { getChatToken, chatLogin, DEMO_ACCOUNTS } from "~/lib/chat-client";
import { formatScheduledLabel } from "~/lib/delivery-windows";
import {
  allowedNext,
  formatTime,
  formatWindowLabel,
  isPickupFulfillment,
  normalizeStatus,
  pipelineFor,
  STATUS_DESCRIPTIONS,
  STATUS_LABELS,
  STATUS_SHORT,
  type DispatchStatus,
} from "~/lib/dispatch";

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

type Staff = { id: string; name: string; email: string; role: string; rating?: number; total_deliveries?: number };

type OrderEvent = {
  status: string;
  previous_status?: string;
  actor_name?: string;
  actor_role?: string;
  note?: string;
  created_at: string;
};

type Order = {
  id: string;
  customer_name?: string;
  total: number;
  delivery_fee?: number;
  tax?: number;
  tip_amount?: number;
  delivery_address?: string;
  status: string;
  dispatch_status?: DispatchStatus;
  status_label?: string;
  next_states?: DispatchStatus[];
  is_pickup?: boolean;
  created_at?: string;
  item_count?: number;
  driver_id?: string | null;
  staff_name?: string;
  id_document_type?: string;
  id_last_four?: string;
  id_name?: string;
  id_dob?: string;
  verified_by?: string;
  verified_at?: string;
  signature?: string;
  fulfillment_type?: string;
  pickup_vehicle?: string;
  pickup_notes?: string;
  scheduled_delivery_at?: string | null;
  events?: OrderEvent[];
  items?: Array<{ product_name: string; quantity: number; unit_price: number }>;
  window?: { start: string | null; end: string | null; scheduled: boolean };
  claimed_at?: string | null;
  ready_at?: string | null;
  picked_up_at?: string | null;
  started_at?: string | null;
  delivered_at?: string | null;
};

const statusColors: Record<string, "neutral" | "primary" | "warning" | "info" | "success" | "error"> = {
  pending: "neutral",
  assigned: "info",
  ready: "warning",
  picked_up: "primary",
  in_transit: "info",
  delivered: "success",
  cancelled: "error",
};

const ACTION_LABELS: Record<string, string> = {
  assigned: "Assign delivery staff",
  ready: "Mark packed & ready",
  picked_up: "Mark picked up",
  in_transit: "Mark on the way",
  delivered: "Complete delivery",
  cancelled: "Cancel order",
};

const isPickupOrder = (o: Order) => o.is_pickup ?? isPickupFulfillment(o.fulfillment_type);

function OrdersPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Order | null>(null);
  const [assignTo, setAssignTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [deliverFor, setDeliverFor] = useState<Order | null>(null);

  const detachTenant = useCallback(() => {
    const t = getChatToken();
    setToken(t);
    const { role, tenantId } = decodeTenantId(t);
    if (t && role === "merchant" && tenantId) setTenantId(tenantId);
    else setTenantId(null);
  }, []);

  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await fetch(`/api/orders?tenantId=${tenantId}`).then((r) => r.json());
      setOrders((res.data as Order[]) || []);
    } catch { /* ignore */ }
  }, [tenantId]);

  const loadStaff = useCallback(async () => {
    const t = getChatToken();
    if (!t) return;
    try {
      const res = await fetch("/api/merchant/staff", { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json());
      if (res.success) setStaff((res.data as Staff[]) || []);
    } catch { /* ignore */ }
  }, []);

  const openDetail = useCallback(async (id: string) => {
    setSelectedId(id);
    setErr(null);
    try {
      const res = await fetch(`/api/orders/${id}`).then((r) => r.json());
      if (res.success) setDetail(res.data as Order);
    } catch { setErr("Could not load this order."); }
  }, []);

  useEffect(() => { detachTenant(); }, [detachTenant]);
  useEffect(() => { if (tenantId) { load(); loadStaff(); } }, [tenantId, load, loadStaff]);

  const signIn = async (role: string) => { await chatLogin(role); setMsg(null); detachTenant(); };

  /** One call for every retailer-side fulfilment action. */
  const act = async (orderId: string, action: string, extra: Record<string, unknown> = {}) => {
    const t = getChatToken();
    if (!t) { setErr("Sign in as the dispensary to update orders."); return false; }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ action, ...extra }),
      });
      const payload = await res.json();
      if (!res.ok) { setErr(payload.error || "Update failed."); return false; }
      setDetail(payload.data as Order);
      setMsg(`Order ${orderId.slice(0, 8)} → ${STATUS_LABELS[(payload.data as Order).dispatch_status || "pending"]}`);
      load();
      return true;
    } catch {
      setErr("Network error.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const filtered = filter === "all"
    ? orders
    : orders.filter((o) => normalizeStatus(o.status) === filter);
  const cur = detail;
  const curStatus: DispatchStatus = cur ? normalizeStatus(cur.dispatch_status ?? cur.status) : "pending";
  const nextStates = cur ? (cur.next_states ?? allowedNext(curStatus, cur.fulfillment_type)) : [];
  const rail = pipelineFor(cur?.fulfillment_type);
  const railIndex = rail.indexOf(curStatus);
  const fmtTime = (t?: string | null) => (t ? new Date(`${String(t).replace(" ", "T")}Z`).toLocaleString() : "—");

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
        <h1 className="text-3xl font-[var(--font-heading)] gradient-text-green flex items-center gap-2">
          <Icon name="clipboard" size={28} /> Orders
        </h1>
        <select className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          {[...pipelineFor("delivery"), "cancelled"].map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>
      {msg && <div className="mb-4 rounded-lg bg-[var(--color-success-50)] border border-[var(--color-success-200)] px-4 py-2 text-sm text-[var(--color-success-700)]">{msg}</div>}
      {err && <div className="mb-4 rounded-lg bg-[var(--color-danger-50)] border border-[var(--color-danger-200)] px-4 py-2 text-sm text-[var(--color-danger-700)]">{err}</div>}
      <Card padding="none">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]">
              <th className="p-4 font-medium">#</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Items</th>
              <th className="p-4 font-medium">Total</th>
              <th className="p-4 font-medium">Stage</th>
              <th className="p-4 font-medium">Delivery staff</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const s = normalizeStatus(o.status);
              const pickup = isPickupOrder(o);
              return (
                <tr key={o.id} className="border-t border-[var(--color-neutral-200)] hover:bg-[var(--color-neutral-50)] cursor-pointer" onClick={() => openDetail(o.id)}>
                  <td className="p-4 font-medium">{o.id.slice(0, 8)}</td>
                  <td className="p-4">{o.customer_name || "—"}</td>
                  <td className="p-4"><Badge variant={pickup ? "warning" : "neutral"} size="sm">{pickup ? (o.fulfillment_type === "curbside" ? "Curbside" : "Pickup") : "Delivery"}</Badge></td>
                  <td className="p-4">{o.item_count ?? "—"}</td>
                  <td className="p-4 font-medium">${Number(o.total || 0).toFixed(2)}</td>
                  <td className="p-4"><Badge variant={statusColors[s] || "neutral"} size="sm">{STATUS_LABELS[s] || s}</Badge></td>
                  <td className="p-4 text-[var(--color-neutral-600)]">{o.staff_name || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      {filtered.length === 0 && <p className="text-center py-12 text-[var(--color-neutral-400)]">No orders match this status.</p>}

      <Modal open={!!cur} onClose={() => { setSelectedId(null); setDetail(null); }} title={cur ? `Order ${cur.id.slice(0, 8)}` : ""} size="lg">
        {cur && (
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <Badge variant={statusColors[curStatus] || "neutral"} size="md">{STATUS_LABELS[curStatus]}</Badge>
                <p className="text-xs text-[var(--color-neutral-500)] mt-1">{STATUS_DESCRIPTIONS[curStatus]}</p>
              </div>
              <span className="text-xs text-[var(--color-neutral-400)]">Placed {fmtTime(cur.created_at)}</span>
            </div>

            {/* Fulfilment rail — the real pipeline, not a mockup */}
            <div className="flex items-center gap-1 mb-5">
              {rail.map((step, i) => {
                const done = railIndex >= 0 && i < railIndex;
                const active = i === railIndex;
                return (
                  <div key={step} className="flex-1">
                    <div className={`h-1.5 rounded-full ${done ? "bg-[var(--color-success)]" : active ? "bg-[var(--color-primary-500)]" : "bg-[var(--color-neutral-200)]"}`} />
                    <p className={`mt-1 text-[10px] leading-tight ${active ? "font-semibold text-[var(--color-primary-700)]" : done ? "text-[var(--color-success)]" : "text-[var(--color-neutral-400)]"}`}>{STATUS_SHORT[step]}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><p className="text-[var(--color-neutral-500)]">Customer</p><p className="font-medium">{cur.customer_name || "—"}</p></div>
              <div><p className="text-[var(--color-neutral-500)]">Items</p><p className="font-medium">{cur.items?.length ?? cur.item_count ?? "—"}</p></div>
              <div className="col-span-2"><p className="text-[var(--color-neutral-500)]">Delivery staff</p><p className="font-medium">{cur.staff_name || "Not assigned yet"}</p></div>
              {formatScheduledLabel(cur.scheduled_delivery_at) && (
                <div className="col-span-2"><p className="text-[var(--color-neutral-500)]">{isPickupOrder(cur) ? "Scheduled pickup" : "Scheduled delivery"}</p><p className="font-medium text-[var(--color-primary-700)]">{formatScheduledLabel(cur.scheduled_delivery_at)}</p></div>
              )}
              {!formatScheduledLabel(cur.scheduled_delivery_at) && cur.window?.start && curStatus !== "delivered" && (
                <div className="col-span-2"><p className="text-[var(--color-neutral-500)]">Estimated window (customer sees this)</p><p className="font-medium text-[var(--color-primary-700)]">{formatWindowLabel(cur.window.start, cur.window.end)}</p></div>
              )}
              <div className="col-span-2"><p className="text-[var(--color-neutral-500)]">{isPickupOrder(cur) ? "Location / instructions" : "Delivery address"}</p><p className="font-medium">{cur.delivery_address || "—"}{isPickupOrder(cur) && (cur.pickup_vehicle ? ` • ${cur.pickup_vehicle}` : "")}</p></div>
            </div>

            {/* Retailer actions — every one writes a timestamp + audit event */}
            {curStatus !== "delivered" && curStatus !== "cancelled" && (
              <div className="rounded-lg border border-[var(--color-primary-200)] bg-[var(--color-primary-50)]/40 p-4 mb-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary-700)] mb-3">
                  <Icon name="truck" size={16} /> Fulfilment — your own delivery staff
                </p>
                {curStatus === "pending" && !isPickupOrder(cur) && (
                  <div className="flex flex-wrap items-end gap-2 mb-3">
                    <label className="text-xs text-[var(--color-neutral-600)] flex-1 min-w-[200px]">
                      Assign a staff member
                      <select
                        value={assignTo}
                        onChange={(e) => setAssignTo(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Select staff…</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} · {s.email}</option>
                        ))}
                      </select>
                    </label>
                    <Button size="sm" disabled={busy || !assignTo} onClick={() => act(cur.id, "assign", { staffId: assignTo })}>
                      Assign
                    </Button>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => act(cur.id, "claim", { note: "Claimed by dispensary staff" })}>
                      Assign to me
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {nextStates.filter((s) => s !== "cancelled" && s !== "assigned").map((next) => (
                    next === "delivered" ? (
                      <Button key={next} size="sm" variant="neon" disabled={busy} onClick={() => setDeliverFor(cur)}>
                        Complete delivery (ID + signature)
                      </Button>
                    ) : (
                      <Button key={next} size="sm" variant="secondary" disabled={busy} onClick={() => act(cur.id, next)}>
                        {ACTION_LABELS[next] || next}
                      </Button>
                    )
                  ))}
                  {curStatus === "assigned" && !isPickupOrder(cur) && (
                    <span className="text-xs text-[var(--color-neutral-500)] self-center">
                      {cur.staff_name || "Staff"} runs this delivery in their own vehicle.
                    </span>
                  )}
                </div>
                {staff.length === 0 && curStatus === "pending" && !isPickupOrder(cur) && (
                  <p className="text-xs text-[var(--color-neutral-500)] mt-2">No other staff accounts on this dispensary yet — use “Assign to me”.</p>
                )}
              </div>
            )}

            {/* Timeline — the audit trail the customer sees */}
            {cur.events && cur.events.length > 0 && (
              <div className="rounded-lg border border-[var(--color-neutral-200)] p-4 mb-4">
                <p className="text-sm font-semibold text-[var(--color-neutral-700)] mb-2 flex items-center gap-2"><Icon name="clock" size={15} /> Status history</p>
                <ol className="space-y-2">
                  {cur.events.map((ev, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="w-28 shrink-0 text-[var(--color-neutral-500)]">{fmtTime(ev.created_at)}</span>
                      <span className="font-medium text-[var(--color-neutral-800)]">{STATUS_LABELS[normalizeStatus(ev.status)] || ev.status}</span>
                      <span className="text-[var(--color-neutral-500)]">{ev.actor_name || "System"}{ev.note ? ` — ${ev.note}` : ""}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="border-t border-[var(--color-neutral-200)] pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-[var(--color-neutral-500)]">Delivery fee</span><span>${Number(cur.delivery_fee || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-neutral-500)]">Tax</span><span>${Number(cur.tax || 0).toFixed(2)}</span></div>
              {Number(cur.tip_amount || 0) > 0 && (
                <div className="flex justify-between"><span className="text-[var(--color-neutral-500)]">{isPickupOrder(cur) ? "Tip (100% to store)" : "Tip (100% to delivery staff)"}</span><span className="text-[var(--color-primary-700)] font-medium">${Number(cur.tip_amount || 0).toFixed(2)}</span></div>
              )}
              <div className="flex justify-between font-bold text-base"><span>Total</span><span>${Number(cur.total || 0).toFixed(2)}</span></div>
            </div>

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
                  <div><span className="text-[var(--color-neutral-500)]">Delivered at</span><p className="font-medium">{fmtTime(cur.delivered_at || cur.verified_at)}</p></div>
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
                {nextStates.includes("cancelled") && (
                  <Button size="sm" variant="danger" disabled={busy} onClick={() => { if (window.confirm("Cancel this order?")) act(cur.id, "cancel"); }}>
                    Cancel order
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => { setSelectedId(null); setDetail(null); }}>Close</Button>
              </div>
            </CardFooter>
          </div>
        )}
      </Modal>

      {deliverFor && (
        <DeliverModal
          order={deliverFor}
          onClose={() => setDeliverFor(null)}
          onSubmit={async (payload) => {
            const ok = await act(deliverFor.id, "delivered", payload);
            if (ok) setDeliverFor(null);
            return ok;
          }}
          busy={busy}
          error={err}
        />
      )}
    </div>
  );
}

/** Door-step compliance: the licensed retailer's staff records ID + signature. */
function DeliverModal({
  order,
  onClose,
  onSubmit,
  busy,
  error,
}: {
  order: Order;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<boolean>;
  busy: boolean;
  error: string | null;
}) {
  const [docType, setDocType] = useState("drivers_license");
  const [lastFour, setLastFour] = useState("");
  const [dob, setDob] = useState("");
  const [name, setName] = useState("");
  const [sig, setSig] = useState("");
  const [local, setLocal] = useState<string | null>(null);

  const submit = async () => {
    setLocal(null);
    if (lastFour.replace(/\D/g, "").length < 4) return setLocal("Enter the last 4 digits of the license / ID number.");
    if (!dob) return setLocal("Enter the customer's date of birth shown on the ID.");
    if (!name.trim()) return setLocal("Enter the legal name on the ID.");
    if (!sig) return setLocal("A signature is required to complete the delivery.");
    await onSubmit({ idDocumentType: docType, idLastFour: lastFour, idDob: dob, idName: name.toUpperCase(), signature: sig });
  };

  return (
    <Modal open onClose={onClose} title={<span className="flex items-center gap-2"><Icon name="clipboard" size={18} /> Complete delivery — {order.id.slice(0, 8)}</span>} size="md">
      <div className="space-y-4">
        <div className="rounded-lg border border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] p-3 text-sm">
          <p className="font-semibold text-[var(--color-neutral-800)]">{order.customer_name || "Customer"}</p>
          <p className="text-[var(--color-neutral-500)]">{order.delivery_address}</p>
          <p className="font-medium text-[var(--color-primary-700)]">${Number(order.total || 0).toFixed(2)}</p>
        </div>
        <p className="text-xs text-[var(--color-neutral-500)]">Scan the customer&apos;s government-issued ID and confirm age (21+). The dispensary keeps this record as the licensed seller.</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-[var(--color-neutral-600)]">ID type
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm">
              <option value="drivers_license">Driver&apos;s License</option>
              <option value="state_id">State ID</option>
              <option value="passport">Passport</option>
              <option value="military_id">Military ID</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="text-xs font-medium text-[var(--color-neutral-600)]">ID number (last 4)
            <input inputMode="numeric" maxLength={4} value={lastFour} onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm" placeholder="••••" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-[var(--color-neutral-600)]">Date of birth
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium text-[var(--color-neutral-600)]">Legal name on ID
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm" placeholder="First & last name" />
          </label>
        </div>
        <div>
          <span className="text-xs font-medium text-[var(--color-neutral-600)]">Customer signature</span>
          <div className="mt-1"><SignaturePad onChange={setSig} /></div>
        </div>
        {(local || error) && <div className="rounded-lg bg-[var(--color-danger-50)] px-3 py-2 text-sm text-[var(--color-danger-700)]">{local || error}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Submitting…" : "Mark delivered"}</Button>
        </div>
      </div>
    </Modal>
  );
}
