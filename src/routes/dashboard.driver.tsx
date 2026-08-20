import { useState, useEffect, useRef, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "~/components/Badge";
import { Button } from "~/components/Button";
import { Card } from "~/components/Card";
import { Modal } from "~/components/Modal";
import { Icon } from "~/components/Icon";
import { ChatInbox } from "~/components/ChatInbox";
import { getChatToken, getChatUser, chatLogin, DEMO_ACCOUNTS } from "~/lib/chat-client";

export const Route = createFileRoute("/dashboard/driver")({
  component: DriverPanel,
});

type Order = {
  id: string;
  tenant_id: string;
  status: string;
  total: number;
  delivery_fee: number | null;
  tax: number | null;
  delivery_address: string;
  delivery_notes: string;
  driver_id: string | null;
  customer_name?: string;
  id_document_type: string | null;
  id_last_four: string | null;
  id_name: string | null;
  verified_at: string | null;
};

const ACTIVE = ["confirmed", "preparing", "in_transit"];

function SignaturePad({ onChange }: { onChange: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const point = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };
  const down = (e: React.PointerEvent) => {
    drawing.current = true;
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.beginPath();
    last.current = point(e);
    ctx.moveTo(last.current.x, last.current.y);
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const p = point(e);
    ctx.strokeStyle = "#0b3d2e";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };
  const up = () => { drawing.current = false; emit(); };
  const emit = () => {
    const c = canvasRef.current!;
    if (!c) return;
    onChange(c.toDataURL("image/png"));
  };
  const clear = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    onChange("");
  };
  useEffect(() => {
    const c = canvasRef.current!;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
  }, []);

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        className="w-full h-40 rounded-lg border-2 border-dashed border-[var(--color-neutral-300)] bg-white cursor-crosshair touch-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-neutral-500)]">Have the customer sign above (finger or mouse)</span>
        <Button variant="ghost" size="sm" onClick={clear}>Clear</Button>
      </div>
    </div>
  );
}

function DeliverModal({ order, token, onDone, onClose }: { order: Order; token: string; onDone: () => void; onClose: () => void }) {
  const [docType, setDocType] = useState("drivers_license");
  const [lastFour, setLastFour] = useState("");
  const [dob, setDob] = useState("");
  const [name, setName] = useState("");
  const [sig, setSig] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (lastFour.replace(/\D/g, "").length < 4) return setError("Enter the last 4 digits of the license / ID number.");
    if (!dob) return setError("Enter the customer's date of birth shown on the ID.");
    if (!name.trim()) return setError("Enter the legal name on the ID.");
    if (!sig) return setError("A signature is required to complete the delivery.");
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/deliver`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ idDocumentType: docType, idLastFour: lastFour, idDob: dob, idName: name.toUpperCase(), signature: sig }),
      });
      const payload = await res.json();
      if (!res.ok) return setError(payload.error || "Failed to complete delivery. Please try again.");
      onDone();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={<span className="flex items-center gap-2"><Icon name="clipboard" size={18} /> Complete Delivery — {order.id.slice(0, 8)}</span>} size="md">
      <div className="space-y-4">
        <div className="rounded-lg border border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] p-3 text-sm">
          <p className="font-semibold text-[var(--color-neutral-800)]">{order.customer_name || "Customer"}</p>
          <p className="text-[var(--color-neutral-500)]">{order.delivery_address}</p>
          <p className="font-medium text-[var(--color-primary-700)]">${order.total.toFixed(2)}</p>
        </div>
        <p className="text-xs text-[var(--color-neutral-500)]">Scan the customer's government-issued ID and confirm age (must be 21+ in this market). Record the details below.</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-[var(--color-neutral-600)]">ID type
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm">
              <option value="drivers_license">Driver's License</option>
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
        {error && <div className="rounded-lg bg-[var(--color-danger-50)] px-3 py-2 text-sm text-[var(--color-danger-700)]">{error}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Submitting…" : "Mark Delivered"}</Button>
        </div>
      </div>
    </Modal>
  );
}

function DeliveriesTab() {
  const [user, setUser] = useState(getChatUser());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const load = useCallback(async () => {
    const token = getChatToken();
    if (!token) { setLoading(false); return; }
    const me = user?.id;
    try {
      const res = await fetch(`/api/orders`, { headers: { Authorization: `Bearer ${token}` } });
      const payload = await res.json();
      const list: Order[] = Array.isArray(payload.data) ? payload.data : [];
      setOrders(list.filter((o) => (o.driver_id || "") === (me || "")));
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const active = orders.filter((o) => ACTIVE.includes(o.status));
  const done = orders.filter((o) => o.status === "delivered");

  const signIn = async (role: string) => { await chatLogin(role); setUser(getChatUser()); setLoading(true); load(); };

  if (!user) {
    return (
      <Card>
        <div className="p-6 text-center space-y-3">
          <Icon name="truck" size={28} />
          <p className="font-semibold">Sign in to see your deliveries</p>
          <p className="text-sm text-[var(--color-neutral-500)]">Use a driver account to view assigned orders and complete deliveries.</p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {DEMO_ACCOUNTS.filter((a) => a.role === "driver").map((a) => (
              <Button key={a.email} onClick={() => signIn(a.role)}>{a.label.split("·")[1].trim()}</Button>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold">Deliveries</h2>
          <p className="text-sm text-[var(--color-neutral-500)]">Assigned to {user.name}</p>
        </div>
        <Link to="/dashboard/driver"><Button variant="ghost" size="sm" onClick={async () => { await chatLogin("driver"); setOrders([]); load(); }}>Refresh</Button></Link>
      </div>

      {active.length === 0 && !loading && (
        <Card><div className="p-6 text-center text-sm text-[var(--color-neutral-500)]">No active deliveries right now.</div></Card>
      )}
      {active.map((o) => (
        <Card key={o.id}>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{o.customer_name || "Customer"} — {o.id.slice(0, 8)}</p>
                <p className="text-sm text-[var(--color-neutral-500)] truncate">{o.delivery_address}</p>
              </div>
              <Badge variant={o.status === "in_transit" ? "success" : "primary"}>{o.status.replace("_", " ")}</Badge>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--color-neutral-100)] pt-3">
              <span className="text-sm font-medium">${o.total.toFixed(2)}</span>
              <Button onClick={() => setActiveOrder(o)}><Icon name="clipboard" size={16} /> Verify ID &amp; Complete Delivery</Button>
            </div>
          </div>
        </Card>
      ))}

      {done.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-[var(--color-neutral-600)]">Completed ({done.length})</h3>
          <div className="space-y-2">
            {done.map((o) => (
              <Card key={o.id}>
                <div className="p-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{o.customer_name || "Customer"} — {o.id.slice(0, 8)}</p>
                    <p className="text-xs text-[var(--color-neutral-500)]">{o.verified_at} · ID {o.id_document_type} ···{o.id_last_four} · {o.id_name}</p>
                  </div>
                  <Badge variant="success">Delivered</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeOrder && (
        <DeliverModal order={activeOrder} token={getChatToken() || ""} onClose={() => setActiveOrder(null)} onDone={() => load()} />
      )}
    </div>
  );
}

type AvailOrder = {
  id: string;
  status: string;
  total: number;
  delivery_fee: number | null;
  delivery_address: string;
  customer_name?: string;
  dispensary: string;
  distance_mi: number;
  tenant_id: string;
};

function AvailableOrdersTab() {
  const token = getChatToken();
  const [orders, setOrders] = useState<AvailOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [mLat, setMLat] = useState("");
  const [mLng, setMLng] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/orders/available`, { headers: { Authorization: `Bearer ${token}` } });
      const p = await res.json();
      setOrders(Array.isArray(p.data) ? p.data : []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const saveLocation = async (lat: number, lng: number) => {
    setErr(null); setMsg(null);
    if (!token) { setErr("Not signed in."); return; }
    const res = await fetch(`/api/me/location`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lat, lng }),
    });
    const p = await res.json();
    if (!res.ok) { setErr(p.error || "Failed to save location."); return; }
    setGeo({ lat, lng }); setMsg("Location saved — showing nearby orders.");
    await load();
  };

  const useGeolocation = () => {
    setErr(null);
    if (!navigator.geolocation) { setErr("Geolocation isn't available in this browser — enter your location manually below."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { const { latitude, longitude } = pos.coords; setMLat(latitude.toFixed(6)); setMLng(longitude.toFixed(6)); saveLocation(latitude, longitude); },
      () => setErr("Couldn't get your location — allow location access or enter it manually below."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const manualSave = () => {
    const lat = Number(mLat); const lng = Number(mLng);
    if (!isFinite(lat) || !isFinite(lng)) return setErr("Enter valid latitude and longitude.");
    saveLocation(lat, lng);
  };

  const claim = async (id: string) => {
    setErr(null); setMsg(null);
    if (!token) { setErr("Not signed in."); return; }
    const res = await fetch(`/api/orders/${id}/claim`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const p = await res.json();
    if (!res.ok) { setErr(p.error || "Couldn't claim that order."); return; }
    setMsg("Claimed — it's now in your Deliveries.");
    await load();
  };

  if (!token) {
    return (
      <Card><div className="p-6 text-center text-sm text-[var(--color-neutral-500)]">Sign in with a driver account in the Deliveries tab to see nearby orders.</div></Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold">Available Nearby</h2>
        <p className="text-sm text-[var(--color-neutral-500)]">Unclaimed orders from dispensaries near your current location.</p>
      </div>

      <Card>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Your location</span>
            <Button size="sm" variant="secondary" onClick={useGeolocation}>Use my location</Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-[var(--color-neutral-600)]">Latitude
              <input value={mLat} onChange={(e) => setMLat(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm" placeholder="e.g. 45.5231" />
            </label>
            <label className="text-xs font-medium text-[var(--color-neutral-600)]">Longitude
              <input value={mLng} onChange={(e) => setMLng(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm" placeholder="e.g. -122.6765" />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-neutral-500)]">{geo ? `Saved: ${geo.lat.toFixed(3)}, ${geo.lng.toFixed(3)}` : "No location set yet — set one to find nearby orders."}</span>
            <Button size="sm" onClick={manualSave}>Save location</Button>
          </div>
          {msg && <div className="rounded-lg bg-[var(--color-success-50)] px-3 py-2 text-sm text-[var(--color-success-700)]">{msg}</div>}
          {err && <div className="rounded-lg bg-[var(--color-danger-50)] px-3 py-2 text-sm text-[var(--color-danger-700)]">{err}</div>}
        </div>
      </Card>

      {loading && <Card><div className="p-6 text-center text-sm text-[var(--color-neutral-500)]">Loading nearby orders…</div></Card>}
      {!loading && orders.length === 0 && (
        <Card><div className="p-6 text-center text-sm text-[var(--color-neutral-500)]">No unclaimed orders nearby right now. Try updating your location — a dispensary may be a little farther away.</div></Card>
      )}
      {orders.map((o) => (
        <Card key={o.id}>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{o.dispensary} — {o.id.slice(0, 8)}</p>
                <p className="text-sm text-[var(--color-neutral-500)] truncate">{o.delivery_address}</p>
                {o.customer_name && <p className="text-xs text-[var(--color-neutral-500)]">{o.customer_name}</p>}
              </div>
              <Badge variant="primary">{o.distance_mi.toFixed(1)} mi away</Badge>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--color-neutral-100)] pt-3">
              <span className="text-sm font-medium">${o.total.toFixed(2)} <span className="text-xs text-[var(--color-neutral-400)]">+ ${(o.delivery_fee || 0).toFixed(2)} delivery</span></span>
              <Button size="sm" onClick={() => claim(o.id)}>Claim</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function DriverPanel() {
  const [tab, setTab] = useState<"deliveries" | "available" | "chat">("deliveries");
  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-[var(--color-neutral-100)] p-1 w-fit">
        <button onClick={() => setTab("deliveries")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === "deliveries" ? "bg-white shadow text-[var(--color-primary-700)]" : "text-[var(--color-neutral-500)]"}`}>Deliveries</button>
        <button onClick={() => setTab("available")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === "available" ? "bg-white shadow text-[var(--color-primary-700)]" : "text-[var(--color-neutral-500)]"}`}>Available Nearby</button>
        <button onClick={() => setTab("chat")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === "chat" ? "bg-white shadow text-[var(--color-primary-700)]" : "text-[var(--color-neutral-500)]"}`}>Messages</button>
      </div>
      <Card>
        <div className="p-4 sm:p-6">
          {tab === "deliveries" && <DeliveriesTab />}
          {tab === "available" && <AvailableOrdersTab />}
          {tab === "chat" && (
            <ChatInbox viewerRole="driver" viewerId={getChatUser()?.id || ""} title="Driver messages" subtitle="Chat threads for the orders assigned to you — message customers and the store from one panel." />
          )}
        </div>
      </Card>
    </div>
  );
}
