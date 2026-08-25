import { getDb } from "~/lib/db";
import { hashPassword, verifyPassword, generateToken, generateId } from "~/lib/auth";
import { sanitizeHours } from "~/lib/store-hours";
import { computeWindows, parseDeliveryConfig, sanitizeDeliveryConfig } from "~/lib/delivery-windows";
import { computeOnTime, evaluateDriver } from "~/lib/driverPerformance";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function error(message: string, status = 400): Response {
  return json({ success: false, error: message }, status);
}

// GET /api/health
export function handleHealth(): Response {
  return json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
}

// POST /api/auth/register
export function handleRegister(body: Record<string, unknown>): Response {
  const { email, password, name, role, tenantId } = body as {
    email?: string;
    password?: string;
    name?: string;
    role?: string;
    tenantId?: string;
  };

  if (!email || !password || !name) {
    return error("Email, password, and name are required");
  }

  const validRoles = ["customer", "merchant", "admin"];
  const userRole = role && validRoles.includes(role) ? role : "customer";

  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return error("Email already registered", 409);
  }

  const id = generateId();
  const passwordHash = hashPassword(password);

  db.prepare(
    "INSERT INTO users (id, email, password_hash, name, role, tenant_id) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, email, passwordHash, name, userRole, tenantId || null);

  const token = generateToken({ userId: id, email, role: userRole as "customer" | "merchant" | "admin", tenantId: tenantId || undefined });

  return json({
    success: true,
    data: { user: { id, email, name, role: userRole, tenantId: tenantId || null }, token },
  }, 201);
}

// POST /api/auth/login
export function handleLogin(body: Record<string, unknown>): Response {
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return error("Email and password are required");
  }

  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND is_active = 1").get(email) as Record<string, unknown> | undefined;

  if (!user) {
    return error("Invalid email or password", 401);
  }

  // verifyPassword is already imported above
  if (!verifyPassword(password, user.password_hash as string)) {
    return error("Invalid email or password", 401);
  }

  const token = generateToken({
    userId: user.id as string,
    email: user.email as string,
    role: user.role as "customer" | "merchant" | "admin",
    tenantId: (user.tenant_id as string) || undefined,
  });

  return json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenant_id,
      },
      token,
    },
  });
}

// GET /api/tenants
export function handleListTenants(): Response {
  const db = getDb();
  const tenants = db.prepare("SELECT * FROM tenants ORDER BY name").all();
  return json({ success: true, data: tenants });
}

// POST /api/tenants
export function handleCreateTenant(body: Record<string, unknown>): Response {
  const { name, slug, storeName, logoUrl, primaryColor, secondaryColor } = body as Record<string, string>;

  if (!name || !slug || !storeName) {
    return error("Name, slug, and storeName are required");
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM tenants WHERE slug = ?").get(slug);
  if (existing) {
    return error("Slug already exists", 409);
  }

  const id = generateId();
  db.prepare(
    "INSERT INTO tenants (id, name, slug, store_name, logo_url, primary_color, secondary_color) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, name, slug, storeName, logoUrl || "", primaryColor || "#059669", secondaryColor || "#065f46");

  const tenant = db.prepare("SELECT * FROM tenants WHERE id = ?").get(id);
  return json({ success: true, data: tenant }, 201);
}

// GET /api/tenants/:slug
export function handleGetTenant(slug: string): Response {
  const db = getDb();
  const tenant = db.prepare("SELECT * FROM tenants WHERE slug = ? OR id = ?").get(slug, slug);
  if (!tenant) {
    return error("Tenant not found", 404);
  }
  return json({ success: true, data: tenant });
}
// PUT /api/tenants/:id/hours — update store hours. Merchant must own the tenant
// (or be an admin). Body: { hours: { monday: { open, close, closed, allDay }, ... } }
export function handleUpdateTenantHours(
  id: string,
  body: Record<string, unknown>,
  auth: { role: string; tenantId?: string } | null,
): Response {
  if (!auth) return error("Unauthorized", 401);
  const db = getDb();
  const tenant = db
    .prepare("SELECT * FROM tenants WHERE slug = ? OR id = ?")
    .get(id, id) as Record<string, unknown> | undefined;
  if (!tenant) return error("Tenant not found", 404);
  if (auth.role === "merchant" && auth.tenantId && auth.tenantId !== tenant.id) {
    return error("Forbidden", 403);
  }
  const hours = sanitizeHours(body.hours);
  db.prepare("UPDATE tenants SET hours = ? WHERE id = ?").run(JSON.stringify(hours), tenant.id);
  const updated = db.prepare("SELECT * FROM tenants WHERE id = ?").get(tenant.id);
  return json({ success: true, data: updated });
}
// GET /api/tenants/:id/delivery-windows — public. Returns the tenant's scheduling
// config plus the concrete, currently-available windows (computed within the
// store's operating hours). Checkout calls this to render the time picker.
export function handleGetDeliveryWindows(id: string): Response {
  const db = getDb();
  const tenant = db
    .prepare("SELECT id, hours, delivery_config FROM tenants WHERE slug = ? OR id = ?")
    .get(id, id) as { id: string; hours: string; delivery_config: string } | undefined;
  if (!tenant) return error("Tenant not found", 404);
  const config = parseDeliveryConfig(tenant.delivery_config);
  const windows = computeWindows(sanitizeHours(JSON.parse(tenant.hours || "{}")), config);
  return json({ success: true, data: { enabled: config.enabled, config, windows } });
}
// PUT /api/tenants/:id/delivery-config — merchant sets its scheduling policy.
// Body: { deliveryConfig: { enabled, windowMinutes, leadMinutes, daysAhead } }
export function handleUpdateTenantDeliveryConfig(
  id: string,
  body: Record<string, unknown>,
  auth: { role: string; tenantId?: string } | null,
): Response {
  if (!auth) return error("Unauthorized", 401);
  const db = getDb();
  const tenant = db
    .prepare("SELECT id FROM tenants WHERE slug = ? OR id = ?")
    .get(id, id) as { id: string } | undefined;
  if (!tenant) return error("Tenant not found", 404);
  if (auth.role === "merchant" && auth.tenantId && auth.tenantId !== tenant.id) {
    return error("Forbidden", 403);
  }
  const config = sanitizeDeliveryConfig(body.deliveryConfig ?? body);
  db.prepare("UPDATE tenants SET delivery_config = ? WHERE id = ?").run(JSON.stringify(config), tenant.id);
  return json({ success: true, data: config });
}

// GET /api/products?tenantId=xxx
export function handleListProducts(url: URL): Response {
  const tenantId = url.searchParams.get("tenantId");
  const all = url.searchParams.get("all");
  if (!tenantId) return error("tenantId query parameter is required");

  const db = getDb();
  // Storefront only shows active products; merchant inventory passes all=1 to manage the full catalog.
  const query = all === "1"
    ? "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.tenant_id = ? ORDER BY p.name"
    : "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.tenant_id = ? AND p.is_active = 1 ORDER BY p.name";
  const products = db.prepare(query).all(tenantId);
  return json({ success: true, data: products });
}
// DELETE /api/products/:id — soft-delete (is_active=0) so the item drops off the storefront
// while preserving order history. Non-destructive.
export function handleDeleteProduct(productId: string): Response {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(productId);
  if (!existing) return error("Product not found", 404);
  db.prepare("UPDATE products SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(productId);
  return json({ success: true, data: { id: productId, is_active: 0 } });
}

// POST /api/products
export function handleCreateProduct(body: Record<string, unknown>): Response {
  const { tenantId, categoryId, name, description, price, unit, thcContent, cbdContent, strainType, imageUrl, stock } = body as Record<string, unknown>;

  if (!tenantId || !name || price === undefined) {
    return error("tenantId, name, and price are required");
  }

  const db = getDb();
  const id = generateId();
  db.prepare(
    "INSERT INTO products (id, tenant_id, category_id, name, description, price, unit, thc_content, cbd_content, strain_type, image_url, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, tenantId, categoryId || null, name, description || "", Number(price), (unit as string) || "g", thcContent || "", cbdContent || "", strainType || "", imageUrl || "", Number(stock) || 0);

  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  return json({ success: true, data: product }, 201);
}

// GET /api/products/:id
export function handleGetProduct(productId: string): Response {
  const db = getDb();
  const product = db.prepare(
    "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?"
  ).get(productId);
  if (!product) return error("Product not found", 404);
  return json({ success: true, data: product });
}

// PUT /api/products/:id
export function handleUpdateProduct(productId: string, body: Record<string, unknown>): Response {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(productId);
  if (!existing) return error("Product not found", 404);

  const fields = ["name", "description", "price", "unit", "thc_content", "cbd_content", "strain_type", "image_url", "stock", "category_id", "is_active"];
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field]);
    }
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(productId);
    db.prepare(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  }

  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(productId);
  return json({ success: true, data: product });
}

// GET /api/orders?tenantId=xxx
export function handleListOrders(url: URL): Response {
  const tenantId = url.searchParams.get("tenantId");
  const customerId = url.searchParams.get("customerId");
  const driverId = url.searchParams.get("driverId");
  const status = url.searchParams.get("status");

  const db = getDb();
  let query = "SELECT o.*, u.name as customer_name, (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count, d.reference_selfie as driver_reference_selfie FROM orders o JOIN users u ON o.customer_id = u.id LEFT JOIN users d ON d.id = o.driver_id WHERE 1=1";
  const params: unknown[] = [];

  if (tenantId) { query += " AND o.tenant_id = ?"; params.push(tenantId); }
  if (customerId) { query += " AND o.customer_id = ?"; params.push(customerId); }
  if (driverId) { query += " AND o.driver_id = ?"; params.push(driverId); }
  if (status) { query += " AND o.status = ?"; params.push(status); }

  query += " ORDER BY o.created_at DESC LIMIT 50";
  const orders = db.prepare(query).all(...params);
  return json({ success: true, data: orders });
}

// POST /api/orders
export function handleCreateOrder(body: Record<string, unknown>): Response {
  const { tenantId, customerId, items, deliveryAddress, deliveryNotes, deliveryFee, tax, tip, fulfillmentType, pickupVehicle, pickupNotes, scheduledDeliveryAt } = body as Record<string, unknown>;
  // scheduledDeliveryAt is the customer-chosen delivery/pickup window start (ISO).
  // It must be a valid, future timestamp; anything else falls back to immediate.
  let scheduledAt: string | null = null;
  if (scheduledDeliveryAt) {
    const t = new Date(String(scheduledDeliveryAt)).getTime();
    if (Number.isFinite(t) && t > Date.now()) scheduledAt = String(scheduledDeliveryAt);
  }
  const fulfillment = (fulfillmentType === "pickup" || fulfillmentType === "curbside") ? fulfillmentType : "delivery";
  // Delivery requires a delivery address; pickup/curbside customers come to the store instead.
  if (!tenantId || !customerId || !items) {
    return error("tenantId, customerId, and items are required");
  }
  if (fulfillment === "delivery" && !deliveryAddress) {
    return error("A delivery address is required for delivery orders");
  }

  const db = getDb();
  const id = generateId();

  // Guest checkout sends a synthetic id ("anon-<timestamp>") that never exists in
  // users — but orders.customer_id has a FOREIGN KEY to users(id). Persist a real
  // users row for the guest so the FK holds and integrity is preserved. Logged-in
  // customers pass a real user id and are unaffected.
  const isGuest = String(customerId).startsWith("anon-");
  if (isGuest) {
    const existing = db.prepare("SELECT id FROM users WHERE id = ?").get(customerId);
    if (!existing) {
      const guestEmail = `${String(customerId)}@guest.greenexpress.app`;
      const guestHash = hashPassword(generateId() + Date.now()); // unguessable; guest can't log in
      db.prepare(
        "INSERT INTO users (id, email, password_hash, name, role, age_verified, is_active) VALUES (?, ?, ?, ?, 'customer', 1, 1)"
      ).run(String(customerId), guestEmail, guestHash, "Guest");
    }
  }
  // Calculate total from items
  const orderItems = items as Array<{ productId: string; quantity: number; unitPrice?: number }>;
  let subtotal = 0;

  const insertItem = db.prepare(
    "INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?)"
  );

  const insertOrder = db.prepare(
    "INSERT INTO orders (id, tenant_id, customer_id, status, total, delivery_fee, tax, tip_amount, delivery_address, delivery_notes, fulfillment_type, pickup_vehicle, pickup_notes, scheduled_delivery_at) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );

  const transaction = db.transaction(() => {
    // Validate every product and compute the subtotal FIRST (no DB writes yet).
    const resolvedItems: Array<{ productId: string; name: string; quantity: number; unitPrice: number }> = [];
    for (const item of orderItems) {
      const product = db.prepare("SELECT id, name, price FROM products WHERE id = ?").get(item.productId) as { id: string; name: string; price: number } | undefined;
      if (!product) throw new Error(`Product ${item.productId} not found`);
      const unitPrice = item.unitPrice ?? product.price;
      subtotal += unitPrice * item.quantity;
      resolvedItems.push({ productId: product.id, name: product.name, quantity: item.quantity, unitPrice });
    }

    // Grand total = subtotal + delivery_fee + tax + tip. orders.total is the amount
    // the customer actually pays (also what Stripe is charged). Tip is kept 100% by
    // the courier at settlement, so it lives on its own column as well.
    const grandTotal =
      subtotal + (Number(deliveryFee) || 0) + (Number(tax) || 0) + (Number(tip) || 0);

    // Insert the order row BEFORE its items: order_items.order_id has a FOREIGN
    // KEY to orders(id), so the parent order must exist first or the item insert
    // fails with "FOREIGN KEY constraint failed".
    insertOrder.run(id, tenantId, customerId, grandTotal, Number(deliveryFee) || 0, Number(tax) || 0, Number(tip) || 0, deliveryAddress, deliveryNotes || "", fulfillment, pickupVehicle || "", pickupNotes || "", scheduledAt);

    for (const ri of resolvedItems) {
      insertItem.run(generateId(), id, ri.productId, ri.name, ri.quantity, ri.unitPrice);
    }
  });

  try {
    transaction();
  } catch (e) {
    return error((e as Error).message, 400);
  }

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  const orderItemsResult = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id);

  return json({ success: true, data: { ...order as Record<string, unknown>, items: orderItemsResult } }, 201);
}

// GET /api/orders/:id
export function handleGetOrder(orderId: string): Response {
  const db = getDb();
  const order = db.prepare("SELECT o.*, u.name as customer_name FROM orders o JOIN users u ON o.customer_id = u.id WHERE o.id = ?").get(orderId) as Record<string, unknown> | undefined;
  if (!order) return error("Order not found", 404);

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId);
  // my_rating lets the customer tracking page show the "already rated" state on reload.
  const rating = db.prepare("SELECT rating FROM order_ratings WHERE order_id = ?").get(orderId) as Record<string, unknown> | undefined;
  return json({ success: true, data: { ...order, items, my_rating: rating ? rating.rating : null } });
}

// PUT /api/orders/:id/status
export function handleUpdateOrderStatus(orderId: string, body: Record<string, unknown>): Response {
  const { status } = body as { status?: string };
  const validStatuses = ["pending", "confirmed", "preparing", "in_transit", "delivered", "cancelled"];

  if (!status || !validStatuses.includes(status)) {
    return error(`Status must be one of: ${validStatuses.join(", ")}`);
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM orders WHERE id = ?").get(orderId);
  if (!existing) return error("Order not found", 404);

  const updates = ["status = ?", "updated_at = datetime('now')"];
  const values: unknown[] = [status];

  if (status === "delivered") {
    updates.push("delivered_at = datetime('now')");
  }

  values.push(orderId);
  db.prepare(`UPDATE orders SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  return json({ success: true, data: order });
}

// PUT /api/orders/:id/deliver — REAL door-step ID verification + signature capture.
// Assigned driver, the order's merchant, or admin may complete a delivery. Requires
// non-empty ID fields and a captured signature (PNG/JPEG data URL). Persists the
// verification and marks the order delivered. Refuses to overwrite an existing delivery.
export function handleDeliverOrder(
  orderId: string,
  body: Record<string, unknown>,
  auth: { userId: string; role: string; tenantId?: string } | null,
): Response {
  if (!auth) return error("Unauthorized", 401);
  const { idDocumentType, idLastFour, idDob, idName, signature } = body as Record<string, unknown>;
  if (!idDocumentType || !idLastFour || !idDob || !idName || !signature) {
    return error("ID document details and a customer signature are required to complete delivery");
  }
  const lastFour = String(idLastFour).replace(/\D/g, "").slice(-4);
  if (lastFour.length < 4) return error("Enter the last 4 digits of the ID number");
  const sig = String(signature);
  if (!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(sig) || sig.length < 200) {
    return error("A captured signature image is required");
  }
  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as Record<string, any> | undefined;
  if (!order) return error("Order not found", 404);
  if (order.status === "delivered" || order.verified_at) return error("This delivery is already completed", 409);
  if (order.status === "cancelled") return error("Cancelled orders cannot be delivered", 409);
  // The courier assigned to the order is authorized to complete delivery (identity-based),
  // regardless of which of the allowed roles (driver/merchant/admin) their token carries.
  const isDriver = !!order.driver_id && order.driver_id === auth.userId;
  const isMerchant = auth.role === "merchant" && order.tenant_id === auth.tenantId;
  const isAdmin = auth.role === "admin";
  if (!isDriver && !isMerchant && !isAdmin) return error("Forbidden", 403);
  db.prepare(
    `UPDATE orders SET status='delivered', delivered_at=datetime('now'),
      id_document_type=?, id_last_four=?, id_dob=?, id_name=?, signature=?,
      verified_by=?, verified_at=datetime('now'), updated_at=datetime('now')
     WHERE id=?`
  ).run(String(idDocumentType), lastFour, String(idDob), String(idName), sig, auth.userId, orderId);
  // Score on-time performance for this delivered order (assigned driver only).
  if (order.driver_id) {
    const fresh = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as Record<string, any>;
    const onTime = computeOnTime(fresh);
    if (onTime !== null) db.prepare("UPDATE orders SET on_time = ? WHERE id = ?").run(onTime, orderId);
    applyDriverStatus(db, order.driver_id);
  }
  const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  return json({ success: true, data: updated });
}
// POST /api/orders/:id/rating — customer rates the delivery driver (1–5) + optional comment,
// only after the order is delivered. One rating per order (409 on duplicate); pickup/curbside
// (no driver) and pre-delivery ratings are rejected (400). Non-mutating to driver status.
export function handleRateOrder(
  orderId: string,
  body: Record<string, unknown>,
  auth: { userId: string; role: string; tenantId?: string } | null,
): Response {
  if (!auth) return error("Unauthorized", 401);
  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as Record<string, any> | undefined;
  if (!order) return error("Order not found", 404);
  if (order.status !== "delivered") return error("Orders can only be rated after delivery", 400);
  if (!order.driver_id) return error("This order has no driver to rate", 400);
  const existing = db.prepare("SELECT 1 FROM order_ratings WHERE order_id = ?").get(orderId);
  if (existing) return error("This order has already been rated", 409);
  // Only the order's customer (or admin) may rate.
  const isCustomer = order.customer_id === auth.userId;
  const isAdmin = auth.role === "admin";
  if (!isCustomer && !isAdmin) return error("Forbidden", 403);
  const rating = Math.round(Number(body.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return error("Rating must be an integer 1–5", 400);
  const comment = String(body.comment ?? "").trim().slice(0, 500);
  const id = crypto.randomUUID();
  db.prepare(
    "INSERT INTO order_ratings (id, order_id, rated_type, rated_id, rating, comment) VALUES (?, 'driver', ?, ?, ?)"
  ).run(id, orderId, order.driver_id, rating, comment);
  applyDriverStatus(db, order.driver_id);
  return json({ success: true, data: { id, order_id: orderId, rating, comment } }, 201);
}
// Aggregate a driver's performance + apply warning/deactivation (v1 thresholds in driverPerformance.ts).
function driverPerformance(db: ReturnType<typeof getDb>, userId: string) {
  const orders = db.prepare("SELECT * FROM orders WHERE driver_id = ?").all(userId) as Record<string, any>[];
  const ratings = db.prepare("SELECT rating FROM order_ratings WHERE rated_type='driver' AND rated_id = ?").all(userId) as Record<string, any>[];
  return evaluateDriver(orders as any, ratings as any);
}
function applyDriverStatus(db: ReturnType<typeof getDb>, userId: string): void {
  const user = db.prepare("SELECT email FROM users WHERE id = ?").get(userId) as Record<string, any> | undefined;
  if (!user) return;
  const perf = driverPerformance(db, userId);
  if (perf.status === "deactivated") {
    db.prepare("UPDATE drivers SET is_active = 0 WHERE email = ?").run(user.email);
  }
}
// GET /api/drivers/me/performance — the authenticated driver's aggregate score,
// on-time rate, average rating, warning/deactivation status.
export function handleGetDriverPerformance(
  auth: { userId: string; role: string; tenantId?: string } | null,
): Response {
  if (!auth || auth.role !== "driver") return error("Forbidden", 403);
  const db = getDb();
  return json({ success: true, data: driverPerformance(db, auth.userId) });
}
// GET /api/admin/drivers/performance — admin view of all drivers' scores + status.
export function handleListDriverPerformance(
  auth: { userId: string; role: string; tenantId?: string } | null,
): Response {
  if (!auth || auth.role !== "admin") return error("Forbidden", 403);
  const db = getDb();
  const users = db.prepare("SELECT * FROM users WHERE role = 'driver'").all() as Record<string, any>[];
  return json({
    success: true,
    data: users.map((u) => ({ id: u.id, name: u.name, email: u.email, ...driverPerformance(db, u.id) })),
  });
}
// PUT /api/drivers/me/selfie — set the operator's on-file reference selfie (driver onboarding)
export function handleSetDriverSelfie(
  body: Record<string, unknown>,
  auth: { userId: string; role: string; tenantId?: string } | null,
): Response {
  if (!auth) return error("Unauthorized", 401);
  const selfie = body.selfie;
  if (!selfie || typeof selfie !== "string") return error("A selfie image is required");
  if (!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(selfie) || selfie.length < 200) {
    return error("A captured selfie image is required (PNG or JPEG)");
  }
  const db = getDb();
  db.prepare("UPDATE users SET reference_selfie = ?, updated_at = datetime('now') WHERE id = ?").run(selfie, auth.userId);
  return json({ success: true, data: { reference_selfie: selfie } });
}
// POST /api/orders/:id/start — driver identity selfie check at the START of delivery.
// Required before the assigned courier can begin/proceed an order. Mandatory live selfie,
// persisted alongside the on-file reference selfie for merchant/admin review (no auto face-matching).
export function handleStartDelivery(
  orderId: string,
  body: Record<string, unknown>,
  auth: { userId: string; role: string; tenantId?: string } | null,
): Response {
  if (!auth) return error("Unauthorized", 401);
  const selfie = body.selfie;
  if (!selfie || typeof selfie !== "string") return error("A selfie is required to start this delivery");
  if (!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(selfie) || selfie.length < 200) {
    return error("A captured selfie image is required (PNG or JPEG)");
  }
  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as Record<string, any> | undefined;
  if (!order) return error("Order not found", 404);
  if (order.status === "delivered") return error("This delivery is already completed", 409);
  if (order.status === "cancelled") return error("Cancelled orders cannot be started", 409);
  if (order.start_selfie) return error("This delivery has already been started", 409);
  // Identity-based: the assigned courier, the order's merchant, or an admin may start.
  const isDriver = !!order.driver_id && order.driver_id === auth.userId;
  const isMerchant = auth.role === "merchant" && order.tenant_id === auth.tenantId;
  const isAdmin = auth.role === "admin";
  if (!isDriver && !isMerchant && !isAdmin) return error("Forbidden", 403);
  db.prepare(
    `UPDATE orders SET status='in_transit', start_selfie=?, started_at=datetime('now'), updated_at=datetime('now') WHERE id=?`
  ).run(selfie, orderId);
  const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  return json({ success: true, data: updated }, 201);
}

// haversine distance in miles
function havMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1); const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
// PUT /api/me/location — driver sets current location (browser geolocation or manual fallback)
export function handleSetDriverLocation(
  body: Record<string, unknown>,
  auth: { userId: string; role: string; tenantId?: string } | null,
): Response {
  if (!auth) return error("Unauthorized", 401);
  const lat = Number(body.lat); const lng = Number(body.lng);
  if (!isFinite(lat) || !isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return error("Valid latitude and longitude are required");
  const db = getDb();
  db.prepare("UPDATE users SET current_lat = ?, current_lng = ?, updated_at = datetime('now') WHERE id = ?").run(lat, lng, auth.userId);
  return json({ success: true, data: { current_lat: lat, current_lng: lng } });
}
// GET /api/orders/available?lat=&lng=&radius= — open orders from dispensaries near the driver
export function handleListAvailableOrders(
  auth: { userId: string; role: string; tenantId?: string } | null,
  url: URL,
): Response {
  if (!auth) return error("Unauthorized", 401);
  // Deactivated drivers are excluded from dispatch entirely.
  const me = db.prepare("SELECT email FROM users WHERE id = ?").get(auth.userId) as Record<string, any> | undefined;
  if (me) {
    const dr = db.prepare("SELECT is_active FROM drivers WHERE email = ?").get(me.email) as Record<string, any> | undefined;
    if (dr && dr.is_active === 0) return json({ success: true, data: [], deactivated: true });
  }
  const latP = url.searchParams.get("lat");
  const lngP = url.searchParams.get("lng");
  let lat = latP !== null && latP !== "" ? Number(latP) : NaN;
  let lng = lngP !== null && lngP !== "" ? Number(lngP) : NaN;
  const radius = Number(url.searchParams.get("radius")) || 25;
  const db = getDb();
  if (!isFinite(lat) || !isFinite(lng)) {
    const me = db.prepare("SELECT current_lat, current_lng FROM users WHERE id = ?").get(auth.userId) as any;
    if (me && isFinite(me.current_lat)) { lat = me.current_lat; lng = me.current_lng; }
  }
  if (!isFinite(lat) || !isFinite(lng)) return json({ success: true, data: [] });
  const open = db.prepare(
    "SELECT o.*, t.name as dispensary, t.lat as t_lat, t.lng as t_lng FROM orders o JOIN tenants t ON o.tenant_id = t.id WHERE o.driver_id IS NULL AND o.status IN ('pending','confirmed','preparing') AND (o.fulfillment_type IS NULL OR o.fulfillment_type = 'delivery') ORDER BY o.created_at DESC LIMIT 50"
  ).all();
  const data = open.map((o: any) => {
    if (o.t_lat == null || o.t_lng == null) return null;
    // Scheduled orders only enter the driver queue once their window is near
    // (within 30 min of the scheduled delivery/pickup time). A delivery booked
    // for tomorrow is stored but not dispatchable yet.
    if (o.scheduled_delivery_at) {
      const t = new Date(o.scheduled_delivery_at).getTime();
      if (Number.isFinite(t) && t - Date.now() > 30 * 60000) return null;
    }
    const dist = havMiles(lat, lng, o.t_lat, o.t_lng);
    if (dist > radius) return null;
    return { id: o.id, status: o.status, total: o.total, delivery_fee: o.delivery_fee, tip_amount: o.tip_amount, delivery_address: o.delivery_address, customer_name: o.customer_name ?? null, dispensary: o.dispensary, distance_mi: Math.round(dist * 10) / 10, tenant_id: o.tenant_id, scheduled_delivery_at: o.scheduled_delivery_at ?? null };
  }).filter(Boolean);
  return json({ success: true, data });
}
// POST /api/orders/:id/claim — driver claims an open order (assigns orders.driver_id); 409 on double-claim
export function handleClaimOrder(orderId: string, auth: { userId: string; role: string; tenantId?: string } | null): Response {
  if (!auth) return error("Unauthorized", 401);
  const db = getDb();
  // Deactivated drivers cannot claim orders (enforcement for the rating system).
  const claimer = db.prepare("SELECT email FROM users WHERE id = ?").get(auth.userId) as Record<string, any> | undefined;
  if (claimer) {
    const dr = db.prepare("SELECT is_active FROM drivers WHERE email = ?").get(claimer.email) as Record<string, any> | undefined;
    if (dr && dr.is_active === 0) return error("Your driver account is deactivated — contact support to be reinstated.", 403);
  }
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as any;
  if (!order) return error("Order not found", 404);
  if (order.driver_id) return error("This order is already claimed", 409);
  if (order.status === "delivered" || order.status === "cancelled") return error("This order is not available to claim", 409);
  const res = db.prepare("UPDATE orders SET driver_id = ?, status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END, updated_at = datetime('now') WHERE id = ? AND driver_id IS NULL").run(auth.userId, orderId);
  if (res.changes === 0) return error("This order was just claimed by another driver", 409);
  const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  return json({ success: true, data: updated });
  }

  // GET /api/categories?tenantId=xxx
export function handleListCategories(url: URL): Response {
  const tenantId = url.searchParams.get("tenantId");
  if (!tenantId) return error("tenantId query parameter is required");

  const db = getDb();
  const categories = db.prepare("SELECT * FROM categories WHERE tenant_id = ? AND is_active = 1 ORDER BY sort_order, name").all(tenantId);
  return json({ success: true, data: categories });
}

// POST /api/categories
export function handleCreateCategory(body: Record<string, unknown>): Response {
  const { tenantId, name, description } = body as Record<string, string>;
  if (!tenantId || !name) return error("tenantId and name are required");

  const db = getDb();
  const id = generateId();
  db.prepare("INSERT INTO categories (id, tenant_id, name, description) VALUES (?, ?, ?, ?)").run(id, tenantId, name, description || "");
  const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  return json({ success: true, data: category }, 201);
}

// GET /api/orders/stream?tenantId=xxx — SSE endpoint
export function handleOrderStream(url: URL): Response {
  const tenantId = url.searchParams.get("tenantId");

  const stream = new ReadableStream({
    start(controller: ReadableStreamDefaultController) {
      controller.enqueue("data: " + JSON.stringify({ type: "connected", message: "Order stream connected" }) + "\n\n");

      const interval = setInterval(() => {
        try {
          const db = getDb();
          let orders;
          if (tenantId) {
            orders = db.prepare(
              "SELECT o.*, u.name as customer_name FROM orders o JOIN users u ON o.customer_id = u.id WHERE o.tenant_id = ? AND o.status IN ('pending', 'confirmed', 'preparing', 'in_transit') ORDER BY o.created_at DESC"
            ).all(tenantId);
          } else {
            orders = db.prepare(
              "SELECT o.*, u.name as customer_name FROM orders o JOIN users u ON o.customer_id = u.id WHERE o.status IN ('pending', 'confirmed', 'preparing', 'in_transit') ORDER BY o.created_at DESC"
            ).all();
          }
          controller.enqueue("data: " + JSON.stringify({ type: "orders", data: orders }) + "\n\n");
        } catch {
          // keep alive
        }
      }, 3000);
    },
    cancel() {
      // cleanup happens automatically when connection closes
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

// ── Driver Application Handlers ──────────────────────────────

// POST /api/drivers/apply — Submit driver application
export function handleDriverApply(body: Record<string, unknown>): Response {
  const required = [
    "fullName", "email", "phone", "dateOfBirth", "address", "city", "zipCode",
    "driversLicenseNumber", "driversLicenseExpiry",
    "vehicleMake", "vehicleModel", "vehicleYear", "vehicleColor", "vehiclePlate",
    "insuranceProvider", "insurancePolicyNumber", "insuranceCoverageLimit",
    "drugPolicyConsent", "contractorAgreementConsent", "complianceAcknowledgment",
  ];

  for (const field of required) {
    if (!body[field]) return error(`Field ${field} is required`);
  }
  if (Number(body.vehicleYear) < 2011) return error("Vehicle must be 2011 or newer");
  const dob = new Date(String(body.dateOfBirth));
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
  if (!Number.isFinite(age) || age < 21) return error("You must be 21 or older to apply");

  const db = getDb();
  const existing = db.prepare("SELECT id FROM driver_applications WHERE email = ?").get(body.email);
  if (existing) return error("An application with this email already exists", 409);

  const id = generateId();
  db.prepare(`
    INSERT INTO driver_applications (
      id, full_name, email, phone, date_of_birth, address, city, state, zip_code,
      drivers_license_number, drivers_license_state, drivers_license_expiry,
      vehicle_make, vehicle_model, vehicle_year, vehicle_color, vehicle_plate,
      insurance_provider, insurance_policy_number, insurance_coverage_limit, vehicle_registration,
      has_smartphone, background_check_consent, drug_policy_consent, contractor_agreement_consent, compliance_acknowledgment, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    id, body.fullName, body.email, body.phone, body.dateOfBirth,
    body.address, body.city, body.state || "OR", body.zipCode,
    body.driversLicenseNumber, body.driversLicenseState || "OR", body.driversLicenseExpiry,
    body.vehicleMake, body.vehicleModel, Number(body.vehicleYear),
    body.vehicleColor, body.vehiclePlate,
    body.insuranceProvider, body.insurancePolicyNumber, body.insuranceCoverageLimit, body.vehicleRegistration || "",
    body.hasSmartphone ? 1 : 0, body.backgroundCheckConsent ? 1 : 0,
    body.drugPolicyConsent ? 1 : 0, body.contractorAgreementConsent ? 1 : 0, body.complianceAcknowledgment ? 1 : 0
  );

  const application = db.prepare("SELECT * FROM driver_applications WHERE id = ?").get(id);
  return json({ success: true, data: application }, 201);
}

// GET /api/drivers/status?email=xxx — Check application status
export function handleDriverStatus(url: URL): Response {
  const email = url.searchParams.get("email");
  if (!email) return error("Email query parameter is required");

  const db = getDb();
  const application = db.prepare(
    "SELECT id, full_name, email, status, notes, created_at, updated_at FROM driver_applications WHERE email = ? ORDER BY created_at DESC"
  ).get(email) as Record<string, unknown> | undefined;

  if (!application) return json({ success: true, data: { status: "none" } });
  return json({ success: true, data: application });
}

// GET /api/admin/drivers/applications?status=pending — List applications
export function handleAdminListApplications(url: URL): Response {
  const status = url.searchParams.get("status") || "pending";
  const db = getDb();
  const applications = db.prepare(
    "SELECT * FROM driver_applications WHERE status = ? ORDER BY created_at DESC"
  ).all(status);
  return json({ success: true, data: applications });
}

// GET /api/admin/drivers/applications/:id — Get application details
export function handleAdminGetApplication(applicationId: string): Response {
  const db = getDb();
  const app = db.prepare("SELECT * FROM driver_applications WHERE id = ?").get(applicationId);
  if (!app) return error("Application not found", 404);
  return json({ success: true, data: app });
}

// PUT /api/admin/drivers/applications/:id/approve — Approve application
export function handleAdminApproveApplication(applicationId: string, body: Record<string, unknown>): Response {
  const db = getDb();
  const app = db.prepare("SELECT * FROM driver_applications WHERE id = ?").get(applicationId) as Record<string, unknown> | undefined;
  if (!app) return error("Application not found", 404);
  if (app.status !== "pending") return error(`Application is already ${app.status}`, 400);

  const reviewedBy = (body.reviewedBy as string) || "admin";

  const transaction = db.transaction(() => {
    // Update application status
    db.prepare(
      "UPDATE driver_applications SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now'), notes = ? WHERE id = ?"
    ).run(reviewedBy, (body.notes as string) || "", applicationId);

    // Create driver record
    const driverId = generateId();
    db.prepare(`
      INSERT INTO drivers (id, application_id, full_name, email, phone,
        drivers_license_number, drivers_license_state, vehicle_info, insurance_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      driverId, applicationId,
      app.full_name, app.email, app.phone,
      app.drivers_license_number, app.drivers_license_state,
      JSON.stringify({
        make: app.vehicle_make,
        model: app.vehicle_model,
        year: app.vehicle_year,
        color: app.vehicle_color,
        plate: app.vehicle_plate,
      }),
      JSON.stringify({
        provider: app.insurance_provider,
        policyNumber: app.insurance_policy_number,
      })
    );
  });

  transaction();
  const updated = db.prepare("SELECT * FROM driver_applications WHERE id = ?").get(applicationId);
  return json({ success: true, data: updated });
}

// PUT /api/admin/drivers/applications/:id/reject — Reject application
export function handleAdminRejectApplication(applicationId: string, body: Record<string, unknown>): Response {
  const db = getDb();
  const app = db.prepare("SELECT * FROM driver_applications WHERE id = ?").get(applicationId) as Record<string, unknown> | undefined;
  if (!app) return error("Application not found", 404);
  if (app.status !== "pending") return error(`Application is already ${app.status}`, 400);

  const reviewedBy = (body.reviewedBy as string) || "admin";

  db.prepare(
    "UPDATE driver_applications SET status = 'rejected', reviewed_by = ?, reviewed_at = datetime('now'), notes = ? WHERE id = ?"
  ).run(reviewedBy, (body.notes as string) || "", applicationId);

  const updated = db.prepare("SELECT * FROM driver_applications WHERE id = ?").get(applicationId);
  return json({ success: true, data: updated });
}

// GET /api/admin/drivers — List approved drivers
export function handleAdminListDrivers(): Response {
  const db = getDb();
  const drivers = db.prepare(
    "SELECT d.*, da.created_at as applied_at FROM drivers d JOIN driver_applications da ON d.application_id = da.id ORDER BY d.total_deliveries DESC"
  ).all();
  return json({ success: true, data: drivers });
}

// PUT /api/admin/drivers/:id/suspend — Suspend a driver
export function handleAdminSuspendDriver(driverId: string): Response {
  const db = getDb();
  const driver = db.prepare("SELECT id, application_id FROM drivers WHERE id = ?").get(driverId);
  if (!driver) return error("Driver not found", 404);

  db.prepare("UPDATE drivers SET is_active = 0, is_available = 0 WHERE id = ?").run(driverId);
  db.prepare("UPDATE driver_applications SET status = 'suspended' WHERE id = ?").run((driver as any).application_id);

  return json({ success: true, data: { id: driverId, status: "suspended" } });
}

// PUT /api/drivers/:id/availability — Toggle driver availability
export function handleDriverAvailability(driverId: string, body: Record<string, unknown>): Response {
  const { isAvailable } = body as { isAvailable?: boolean };
  const db = getDb();
  const driver = db.prepare("SELECT id FROM drivers WHERE id = ? AND is_active = 1").get(driverId);
  if (!driver) return error("Driver not found or not active", 404);

  db.prepare("UPDATE drivers SET is_available = ? WHERE id = ?").run(isAvailable ? 1 : 0, driverId);
  return json({ success: true, data: { id: driverId, isAvailable: !!isAvailable } });
}

// POST /api/checkout — create Stripe checkout session
export async function handleCreateCheckoutSession(body: Record<string, unknown>): Promise<Response> {
  const { orderId, tenantId, customerId, total, customerEmail } = body as Record<string, string>;

  if (!orderId || !tenantId || !customerId || !total) {
    return error("orderId, tenantId, customerId, and total are required");
  }

  const { stripe, createCheckoutSession } = await import("./stripe");
  if (!stripe) return error("Payments not configured", 500);

  try {
    // Charge the authoritative stored order total (subtotal + delivery + tax + tip)
    // rather than trusting the client-supplied total, so the Stripe amount always
    // matches the order record even if tip/pricing changes between rendering and pay.
    const db = getDb();
    const order = db.prepare("SELECT total FROM orders WHERE id = ?").get(orderId) as { total: number } | undefined;
    const amountInCents = order?.total != null
      ? Math.round(Number(order.total) * 100)
      : Math.round(parseFloat(total) * 100);
    const session = await createCheckoutSession({
      orderId,
      amount: amountInCents,
      customerEmail: customerEmail || undefined,
      successUrl: `${Bun.env.SITE_URL || "https://ef5d2c4ae9113753571b85ddf95ab4dd.ctonew.app"}/orders/${orderId}/track?payment=success`,
      cancelUrl: `${Bun.env.SITE_URL || "https://ef5d2c4ae9113753571b85ddf95ab4dd.ctonew.app"}/cart?payment=cancelled`,
    });

    return json({ success: true, data: { url: session.url, sessionId: session.id } });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return error("Failed to create checkout session", 500);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// MERCHANT / MARKETING LAYER — Phase 1 (tech-layer pivot)
// Guardrails: aggregate analytics only; loyalty is retailer-facing (GreenExpress
// is NOT the seller, payment intermediary, or distributor); retailer is the
// seller of record — these tools help the retailer acquire & manage customers.
// ═════════════════════════════════════════════════════════════════════════════

function requireMerchantTenant(auth: { userId: string; role: string; tenantId?: string } | null): string | null {
  if (!auth) return null;
  if (auth.role === "merchant" && auth.tenantId) return auth.tenantId;
  if (auth.role === "admin") return null; // admin passes tenant_id explicitly
  return null;
}

// ── Promotions ──────────────────────────────────────────────────────────────
// GET /api/promotions?tenant_id=...  (public: active only; merchant/admin: ?all=1)
export function handleListPromotions(url: URL, auth?: { userId: string; role: string; tenantId?: string } | null): Response {
  const db = getDb();
  const tenantParam = url.searchParams.get("tenant_id") || "";
  const all = url.searchParams.get("all") === "1";
  let tenantId = tenantParam;
  if (!tenantId && auth && auth.role === "merchant" && auth.tenantId) tenantId = auth.tenantId;
  if (!tenantId) return error("tenant_id is required", 400);
  const params: unknown[] = [tenantId];
  let query = "SELECT * FROM promotions WHERE tenant_id = ?";
  if (!all) {
    query += " AND is_active = 1 AND (starts_at IS NULL OR starts_at <= datetime('now')) AND (ends_at IS NULL OR ends_at >= datetime('now'))";
  }
  query += " ORDER BY created_at DESC";
  const rows = db.prepare(query).all(...params);
  return json({ success: true, data: rows });
}

// POST /api/promotions  (merchant scoped; admin requires tenant_id)
export function handleCreatePromotion(body: Record<string, unknown>, auth: { userId: string; role: string; tenantId?: string } | null): Response {
  const tenantId = auth?.role === "merchant" ? auth.tenantId : (body.tenant_id as string | undefined);
  if (!tenantId) return error("tenant_id is required for this role", 400);
  const title = (body.title as string || "").trim();
  if (!title) return error("title is required", 400);
  const db = getDb();
  const id = generateId();
  const discountType = (body.discount_type as string) || "percent";
  const discountValue = Number(body.discount_value) || 0;
  db.prepare(
    "INSERT INTO promotions (id, tenant_id, title, description, code, discount_type, discount_value, starts_at, ends_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    id, tenantId, title, String(body.description || ""), String(body.code || ""),
    discountType, discountValue, body.starts_at ? String(body.starts_at) : null,
    body.ends_at ? String(body.ends_at) : null, body.is_active === false ? 0 : 1
  );
  const row = db.prepare("SELECT * FROM promotions WHERE id = ?").get(id);
  return json({ success: true, data: row }, 201);
}

// PUT /api/promotions/:id
export function handleUpdatePromotion(id: string, body: Record<string, unknown>, auth: { userId: string; role: string; tenantId?: string } | null): Response {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM promotions WHERE id = ?").get(id) as { tenant_id: string } | undefined;
  if (!existing) return error("Promotion not found", 404);
  if (auth?.role === "merchant" && existing.tenant_id !== auth.tenantId) return error("Forbidden", 403);
  const allowed = ["title", "description", "code", "discount_type", "discount_value", "starts_at", "ends_at", "is_active"]
    .filter((k) => k in body);
  if (allowed.length === 0) return error("No fields to update", 400);
  const sets = allowed.map((k) => `${k} = ?`).join(", ");
  const vals = allowed.map((k) => {
    const v = (body as Record<string, unknown>)[k];
    if (k === "is_active") return v === false || v === "false" ? 0 : 1;
    if (k === "discount_value") return Number(v) || 0;
    return v === null || v === undefined ? null : String(v);
  });
  db.prepare(`UPDATE promotions SET ${sets} WHERE id = ?`).run(...vals, id);
  const row = db.prepare("SELECT * FROM promotions WHERE id = ?").get(id);
  return json({ success: true, data: row });
}

// DELETE /api/promotions/:id
export function handleDeletePromotion(id: string, auth: { userId: string; role: string; tenantId?: string } | null): Response {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM promotions WHERE id = ?").get(id) as { tenant_id: string } | undefined;
  if (!existing) return error("Promotion not found", 404);
  if (auth?.role === "merchant" && existing.tenant_id !== auth.tenantId) return error("Forbidden", 403);
  db.prepare("DELETE FROM promotions WHERE id = ?").run(id);
  return json({ success: true });
}

// ── Leads (lead capture) ─────────────────────────────────────────────────────
// POST /api/leads  (public storefront inquiry form)
export function handleCreateLead(body: Record<string, unknown>): Response {
  const tenantId = (body.tenant_id as string || "").trim();
  if (!tenantId) return error("tenant_id is required", 400);
  if (!(body.email as string) && !(body.phone as string)) return error("email or phone is required", 400);
  const db = getDb();
  const id = generateId();
  db.prepare("INSERT INTO leads (id, tenant_id, name, email, phone, message, source, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'new')")
    .run(id, tenantId, String(body.name || ""), String(body.email || ""), String(body.phone || ""),
         String(body.message || ""), String(body.source || "storefront"));
  return json({ success: true, data: { id } }, 201);
}

// GET /api/leads  (merchant scoped; admin requires ?tenant_id)
export function handleListLeads(url: URL, auth: { userId: string; role: string; tenantId?: string } | null): Response {
  const db = getDb();
  const tenantId = auth?.role === "merchant" ? auth.tenantId : (url.searchParams.get("tenant_id") || "");
  if (!tenantId) return error("tenant_id is required for this role", 400);
  const rows = db.prepare("SELECT * FROM leads WHERE tenant_id = ? ORDER BY created_at DESC").all(tenantId);
  return json({ success: true, data: rows });
}

// PUT /api/leads/:id  (status update)
export function handleUpdateLeadStatus(id: string, body: Record<string, unknown>, auth: { userId: string; role: string; tenantId?: string } | null): Response {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as { tenant_id: string } | undefined;
  if (!existing) return error("Lead not found", 404);
  if (auth?.role === "merchant" && existing.tenant_id !== auth.tenantId) return error("Forbidden", 403);
  const status = ["new", "contacted", "converted"].includes(String(body.status)) ? String(body.status) : "new";
  db.prepare("UPDATE leads SET status = ? WHERE id = ?").run(status, id);
  return json({ success: true, data: { id, status } });
}

// ── CRM: customer records (retailer owns the customer) ───────────────────────
// GET /api/customers  (merchant scoped) — aggregate per-customer records derived
// from the retailer's orders, plus merchant tags/notes.
export function handleListCustomers(auth: { userId: string; role: string; tenantId?: string } | null): Response {
  const db = getDb();
  const tenantId = auth?.role === "merchant" ? auth.tenantId : null;
  if (!tenantId) return error("tenant_id is required for this role", 400);
  const records = db.prepare(`
    SELECT u.id, u.email, u.name, u.phone,
           COUNT(o.id) AS order_count,
           COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0) AS total_spend,
           MAX(o.created_at) AS last_order_at
    FROM users u
    JOIN orders o ON o.customer_id = u.id
    WHERE o.tenant_id = ?
    GROUP BY u.id
    ORDER BY total_spend DESC
  `).all(tenantId) as Array<Record<string, unknown>>;
  const tags = db.prepare("SELECT customer_email, tag FROM customer_tags WHERE tenant_id = ?").all(tenantId) as Array<{ customer_email: string; tag: string }>;
  const notes = db.prepare("SELECT * FROM customer_notes WHERE tenant_id = ? ORDER BY created_at DESC").all(tenantId) as Array<{ customer_email: string; note: string; created_at: string }>;
  const tagMap: Record<string, string[]> = {};
  for (const t of tags) (tagMap[t.customer_email] = tagMap[t.customer_email] || []).push(t.tag);
  const noteMap: Record<string, typeof notes> = {};
  for (const n of notes) (noteMap[n.customer_email] = noteMap[n.customer_email] || []).push(n);
  const data = records.map((r) => {
    const email = String(r.email || "");
    return { ...r, tags: tagMap[email] || [], notes: noteMap[email] || [] };
  });
  return json({ success: true, data });
}

// POST /api/customers/tags  { customer_email, tag }  (merchant scoped)
export function handleAddCustomerTag(body: Record<string, unknown>, auth: { userId: string; role: string; tenantId?: string } | null): Response {
  const tenantId = auth?.role === "merchant" ? auth.tenantId : null;
  if (!tenantId) return error("tenant_id is required for this role", 400);
  const email = String(body.customer_email || "").trim().toLowerCase();
  const tag = String(body.tag || "").trim();
  if (!email || !tag) return error("customer_email and tag are required", 400);
  const db = getDb();
  const id = generateId();
  db.prepare("INSERT OR IGNORE INTO customer_tags (id, tenant_id, customer_email, tag) VALUES (?, ?, ?, ?)").run(id, tenantId, email, tag);
  return json({ success: true });
}

// POST /api/customers/notes  { customer_email, note }  (merchant scoped)
export function handleAddCustomerNote(body: Record<string, unknown>, auth: { userId: string; role: string; tenantId?: string } | null): Response {
  const tenantId = auth?.role === "merchant" ? auth.tenantId : null;
  if (!tenantId) return error("tenant_id is required for this role", 400);
  const email = String(body.customer_email || "").trim().toLowerCase();
  const note = String(body.note || "").trim();
  if (!email || !note) return error("customer_email and note are required", 400);
  const db = getDb();
  const id = generateId();
  db.prepare("INSERT INTO customer_notes (id, tenant_id, customer_email, note) VALUES (?, ?, ?, ?)").run(id, tenantId, email, note);
  return json({ success: true });
}

// ── Loyalty (retailer-facing) ─────────────────────────────────────────────────
// GET /api/loyalty/program  (merchant) — returns program config or a default
export function handleGetLoyaltyProgram(auth: { userId: string; role: string; tenantId?: string } | null): Response {
  const db = getDb();
  const tenantId = auth?.role === "merchant" ? auth.tenantId : null;
  if (!tenantId) return error("tenant_id is required for this role", 400);
  let prog = db.prepare("SELECT * FROM loyalty_programs WHERE tenant_id = ?").get(tenantId) as Record<string, unknown> | undefined;
  if (!prog) {
    const id = generateId();
    db.prepare("INSERT INTO loyalty_programs (id, tenant_id, name, points_per_dollar, is_active) VALUES (?, ?, 'Rewards', 1, 1)").run(id, tenantId);
    prog = db.prepare("SELECT * FROM loyalty_programs WHERE tenant_id = ?").get(tenantId) as Record<string, unknown>;
  }
  return json({ success: true, data: prog });
}

// PUT /api/loyalty/program
export function handleUpdateLoyaltyProgram(body: Record<string, unknown>, auth: { userId: string; role: string; tenantId?: string } | null): Response {
  const db = getDb();
  const tenantId = auth?.role === "merchant" ? auth.tenantId : null;
  if (!tenantId) return error("tenant_id is required for this role", 400);
  const existing = db.prepare("SELECT id FROM loyalty_programs WHERE tenant_id = ?").get(tenantId) as { id: string } | undefined;
  const id = existing?.id || generateId();
  if (!existing) {
    db.prepare("INSERT INTO loyalty_programs (id, tenant_id, name, points_per_dollar, is_active) VALUES (?, ?, ?, ?, ?)").run(
      id, tenantId, String(body.name || "Rewards"), Number(body.points_per_dollar) || 1, body.is_active === false ? 0 : 1);
  } else {
    const name = body.name !== undefined ? String(body.name) : undefined;
    const ppd = body.points_per_dollar !== undefined ? (Number(body.points_per_dollar) || 1) : undefined;
    const active = body.is_active !== undefined ? (body.is_active === false ? 0 : 1) : undefined;
    const sets: string[] = [];
    const vals: Array<string | number> = [];
    if (name !== undefined) { sets.push("name = ?"); vals.push(name); }
    if (ppd !== undefined) { sets.push("points_per_dollar = ?"); vals.push(ppd); }
    if (active !== undefined) { sets.push("is_active = ?"); vals.push(active); }
    if (sets.length) db.prepare(`UPDATE loyalty_programs SET ${sets.join(", ")} WHERE id = ?`).run(...vals, id);
  }
  const prog = db.prepare("SELECT * FROM loyalty_programs WHERE id = ?").get(id);
  return json({ success: true, data: prog });
}

// GET /api/loyalty/members  (merchant) — points ledger
export function handleListLoyaltyMembers(auth: { userId: string; role: string; tenantId?: string } | null): Response {
  const db = getDb();
  const tenantId = auth?.role === "merchant" ? auth.tenantId : null;
  if (!tenantId) return error("tenant_id is required for this role", 400);
  const rows = db.prepare("SELECT * FROM loyalty_members WHERE tenant_id = ? ORDER BY points DESC").all(tenantId);
  return json({ success: true, data: rows });
}

// ── Aggregate analytics (merchant) ────────────────────────────────────────────
// GET /api/analytics?tenant_id= (admin) — merchant gets own tenant. AGGREGATE ONLY:
// never exposes individual consumer purchase rows as a product.
export function handleMerchantAnalytics(url: URL, auth: { userId: string; role: string; tenantId?: string } | null): Response {
  const db = getDb();
  const tenantId = auth?.role === "merchant" ? auth.tenantId : (url.searchParams.get("tenant_id") || "");
  if (!tenantId) return error("tenant_id is required for this role", 400);
  const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days")) || 30));
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const complete = ["confirmed", "preparing", "in_transit", "delivered"];

  // Summary
  const summaryRow = db.prepare(`
    SELECT COUNT(*) AS orders,
           COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) AS revenue
    FROM orders WHERE tenant_id = ? AND created_at >= ?
  `).get(tenantId, since) as { orders: number; revenue: number };
  const totalOrders = summaryRow.orders || 0;
  const revenue = summaryRow.revenue || 0;
  const aov = totalOrders ? Math.round((revenue / totalOrders) * 100) / 100 : 0;

  // Customer acquisition / retention (aggregate)
  const cust = db.prepare(`
    SELECT customer_id, COUNT(*) AS n, MIN(created_at) AS first_at
    FROM orders WHERE tenant_id = ? AND status != 'cancelled'
    GROUP BY customer_id
  `).all(tenantId) as Array<{ customer_id: string; n: number; first_at: string }>;
  const periodCustomers = cust.filter((c) => c.first_at >= since);
  const newCustomers = periodCustomers.find((c) => c.n === 1) ? periodCustomers.filter((c) => c.n === 1).length : 0;
  const totalDistinct = cust.length;
  const repeatCustomers = cust.filter((c) => c.n > 1).length;
  const retention = totalDistinct ? Math.round((repeatCustomers / totalDistinct) * 1000) / 10 : 0;

  // Popular categories (via order_items -> products -> categories)
  const categories = db.prepare(`
    SELECT COALESCE(c.name, oi.product_name) AS category, SUM(oi.quantity) AS units, SUM(oi.quantity * oi.unit_price) AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE o.tenant_id = ? AND o.created_at >= ? AND o.status != 'cancelled'
    GROUP BY COALESCE(c.name, oi.product_name)
    ORDER BY revenue DESC LIMIT 8
  `).all(tenantId, since);

  // Top products
  const topProducts = db.prepare(`
    SELECT oi.product_name AS name, SUM(oi.quantity) AS qty, SUM(oi.quantity * oi.unit_price) AS revenue
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.tenant_id = ? AND o.created_at >= ? AND o.status != 'cancelled'
    GROUP BY oi.product_name ORDER BY revenue DESC LIMIT 8
  `).all(tenantId, since);

  // Geographic demand (aggregate by delivery area) — delivery_address is stored free text
  const geo = db.prepare(`
    SELECT delivery_address AS area, COUNT(*) AS orders, SUM(total) AS revenue
    FROM orders WHERE tenant_id = ? AND created_at >= ? AND status != 'cancelled'
      AND (delivery_address IS NOT NULL AND delivery_address != '')
    GROUP BY delivery_address ORDER BY orders DESC LIMIT 8
  `).all(tenantId, since);

  // Traffic/inquiries proxy: leads captured (aggregate) + orders as conversion surface
  const leadCount = (db.prepare("SELECT COUNT(*) AS n FROM leads WHERE tenant_id = ? AND created_at >= ?").get(tenantId, since) as { n: number }).n;
  const conversion = leadCount ? Math.round((totalOrders / leadCount) * 1000) / 10 : 0;

  return json({ success: true, data: {
    periodDays: days,
    summary: { revenue: Math.round(revenue * 100) / 100, orders: totalOrders, aov, leadCount },
    customers: { totalDistinct, newCustomers, repeatCustomers, retentionPct: retention },
    categories,
    topProducts,
    geographic: geo,
    acquisition: { conversionPct: conversion },
  } });
}
