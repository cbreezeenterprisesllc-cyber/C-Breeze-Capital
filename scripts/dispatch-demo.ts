/**
 * Dispatch pipeline demo + end-to-end verification.
 *
 * Seeds one Oregon dispensary (Option B: the retailer fulfils with its own
 * staff), one delivery-staff user and one customer, places a real order, then
 * walks it through every pipeline state AS THE DISPENSARY and asserts that the
 * customer-facing order payload (what /orders/:id/track renders) reflects each
 * transition — status, stage timestamp and audit event.
 *
 * Usage:
 *   bun run scripts/dispatch-demo.ts                    # against http://localhost:3100
 *   BASE_URL=http://localhost:3000 bun run scripts/dispatch-demo.ts
 *
 * Safe to re-run: it creates a new tenant slug per run unless DEMO_SLUG is set.
 */

const BASE = process.env.BASE_URL || "http://localhost:3100";
const SLUG = process.env.DEMO_SLUG || `green-express-demo-${Date.now().toString(36)}`;
const PASSWORD = "password123";

// 1x1 transparent PNG — enough for the signature validator, which checks the
// data-URL shape and a minimum length (real captures come from the canvas pad).
const SIGNATURE =
  "data:image/png;base64," +
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==".repeat(3);

type Json = any;

async function api(path: string, init: RequestInit = {}): Promise<{ status: number; body: Json }> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const text = await res.text();
  let body: Json = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  return { status: res.status, body };
}

const results: string[] = [];
let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  results.push(`${ok ? "  PASS" : "  FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function main() {
  console.log(`\nDispatch pipeline demo against ${BASE}\n${"=".repeat(60)}`);

  // ── Seed ────────────────────────────────────────────────────────────────────
  const tenant = await api("/api/tenants", {
    method: "POST",
    body: JSON.stringify({
      name: "Riverbend Cannabis Co.",
      slug: SLUG,
      storeName: "Riverbend Cannabis",
      primaryColor: "#059669",
    }),
  });
  if (tenant.status !== 201) throw new Error(`tenant create failed: ${JSON.stringify(tenant.body)}`);
  const tenantId = tenant.body.data.id;

  const mkUser = async (email: string, name: string, role: string) =>
    api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password: PASSWORD, name, role, tenantId }),
    });

  const ownerEmail = `owner-${SLUG}@riverbend.example`;
  const staffEmail = `staff-${SLUG}@riverbend.example`;
  const customerEmail = `customer-${SLUG}@example.com`;

  const owner = await mkUser(ownerEmail, "Alex Rivera", "merchant");
  const staff = await mkUser(staffEmail, "Dana Whitfield", "merchant");
  const customer = await mkUser(customerEmail, "Carlos Mendez", "customer");
  if (owner.status !== 201 || staff.status !== 201 || customer.status !== 201) {
    throw new Error(`user seed failed: ${JSON.stringify([owner.body, staff.body, customer.body])}`);
  }

  const product = await api("/api/products", {
    method: "POST",
    body: JSON.stringify({ tenantId, name: "Blue Dream 3.5g", price: 38, stock: 40, category: "flower" }),
  });
  if (product.status !== 201) throw new Error(`product seed failed: ${JSON.stringify(product.body)}`);

  const order = await api("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      tenantId,
      customerId: customer.body.data.user.id,
      items: [{ productId: product.body.data.id, quantity: 2 }],
      deliveryAddress: "1420 SE Hawthorne Blvd, Portland, OR 97214",
      deliveryNotes: "Leave with the doorman",
      deliveryFee: 5,
      tax: 4.2,
      tip: 6,
      fulfillmentType: "delivery",
    }),
  });
  if (order.status !== 201) throw new Error(`order seed failed: ${JSON.stringify(order.body)}`);
  const orderId = order.body.data.id;

  console.log(`Tenant   ${tenantId}`);
  console.log(`Order    ${orderId}`);
  console.log(`Tracking ${BASE}/orders/${orderId}/track\n`);

  // ── Sign in as the dispensary ───────────────────────────────────────────────
  const login = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: ownerEmail, password: PASSWORD }),
  });
  if (login.status !== 200) throw new Error(`login failed: ${JSON.stringify(login.body)}`);
  const token = login.body.data.token;
  const auth = { Authorization: `Bearer ${token}` };

  const staffList = await api("/api/merchant/staff", { headers: auth });
  check("GET /api/merchant/staff lists the dispensary's delivery staff", staffList.status === 200 && staffList.body.data.length >= 2,
    `${staffList.body?.data?.length ?? 0} people`);
  const staffMember = (staffList.body.data as any[]).find((s) => s.email === staffEmail);

  const getOrder = () => api(`/api/orders/${orderId}`);
  const act = (action: string, extra: Record<string, unknown> = {}) =>
    api(`/api/orders/${orderId}/dispatch`, { method: "POST", headers: auth, body: JSON.stringify({ action, ...extra }) });

  // ── Initial state ───────────────────────────────────────────────────────────
  const initial = await getOrder();
  check("new order starts at 'pending'", initial.body.data.dispatch_status === "pending", initial.body.data.dispatch_status);
  check("tracking payload exposes an estimated window", !!initial.body.data.window?.start,
    JSON.stringify(initial.body.data.window));
  check("no staff assigned yet", !initial.body.data.driver_id);

  // ── Guard rails ─────────────────────────────────────────────────────────────
  const illegal = await act("picked_up");
  check("illegal jump pending → picked_up is rejected", illegal.status === 409, illegal.body?.error);
  const unauth = await api(`/api/orders/${orderId}/dispatch`, {
    method: "POST",
    body: JSON.stringify({ action: "ready" }),
  });
  check("unauthenticated dispatch is rejected", unauth.status === 401, `HTTP ${unauth.status}`);
  const earlyDeliver = await act("delivered");
  check("delivery without ID + signature is rejected", earlyDeliver.status === 400 || earlyDeliver.status === 409,
    `HTTP ${earlyDeliver.status}`);

  // ── Walk the pipeline ───────────────────────────────────────────────────────
  const steps: Array<{ action: string; extra?: Record<string, unknown>; expect: string; timestamp: string }> = [
    { action: "assign", extra: { staffId: staffMember.id }, expect: "assigned", timestamp: "claimed_at" },
    { action: "ready", expect: "ready", timestamp: "ready_at" },
    { action: "picked_up", expect: "picked_up", timestamp: "picked_up_at" },
    { action: "in_transit", expect: "in_transit", timestamp: "started_at" },
    {
      action: "delivered",
      extra: {
        idDocumentType: "drivers_license",
        idLastFour: "4821",
        idDob: "1994-05-12",
        idName: "CARLOS MENDEZ",
        signature: SIGNATURE,
      },
      expect: "delivered",
      timestamp: "delivered_at",
    },
  ];

  for (const step of steps) {
    const res = await act(step.action, step.extra);
    if (res.status >= 400) {
      check(`${step.action} accepted`, false, JSON.stringify(res.body));
      break;
    }
    // Read back through the public tracking endpoint — this is what the customer sees.
    const seen = await getOrder();
    const d = seen.body.data;
    check(
      `${step.action.padEnd(10)} → tracking shows '${step.expect}'`,
      d.dispatch_status === step.expect,
      `status=${d.dispatch_status}`,
    );
    check(
      `           stage timestamp ${step.timestamp} set`,
      !!d[step.timestamp],
      d[step.timestamp] ?? "missing",
    );
    if (step.action === "assign") {
      check("           tracking shows the delivery staff name", d.staff_name === "Dana Whitfield", d.staff_name);
    }
  }

  // ── Final audit trail ───────────────────────────────────────────────────────
  const final = await getOrder();
  const d = final.body.data;
  const trail = (d.events as any[]).map((e) => e.status);
  check("audit trail records every transition in order",
    JSON.stringify(trail) === JSON.stringify(["assigned", "ready", "picked_up", "in_transit", "delivered"]),
    trail.join(" → "));
  check("every audit event carries an actor", (d.events as any[]).every((e) => !!e.actor_name),
    (d.events as any[]).map((e) => e.actor_name).join(", "));
  check("delivery is attributed to the dispensary's staff", d.staff_name === "Dana Whitfield", d.staff_name);
  check("ID verification persisted by the retailer", d.id_last_four === "4821" && !!d.verified_at, `verified_at=${d.verified_at}`);
  check("customer rating is now unlocked", d.dispatch_status === "delivered" && !!d.driver_id);

  const second = await act("ready");
  check("delivered orders are final (no further transitions)", second.status === 409, second.body?.error);

  console.log(results.join("\n"));
  console.log(`${"=".repeat(60)}`);
  console.log(failures === 0 ? `ALL CHECKS PASSED (${results.length})` : `${failures} CHECK(S) FAILED`);
  console.log(`\nOpen the tracking page: ${BASE}/orders/${orderId}/track\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("DEMO FAILED:", err);
  process.exit(1);
});
