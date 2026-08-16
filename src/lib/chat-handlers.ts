// Unified messaging (chat) API — one conversation system with role-based
// participants (customer | merchant | driver | support), linked to orders.
import { getDb } from "~/lib/db";
import { generateId, requireAuth, type JwtPayload } from "~/lib/auth";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function error(message: string, status = 400): Response {
  return json({ success: false, error: message }, status);
}

const MAX_BODY_LENGTH = 2000;

export interface ParticipantRow {
  conversation_id: string;
  participant_type: string;
  participant_id: string;
  display_name: string;
  last_read_at: string | null;
}

function now(): string {
  return new Date().toISOString();
}

// ── Participant resolution ─────────────────────────────────────────────

/** The participant (type, id) a JWT user maps to inside a conversation. */
export function resolveParticipantForConversation(
  payload: JwtPayload,
  conv: { order_id: string | null; store_id: string | null }
): { participant_type: string; participant_id: string } | null {
  if (payload.role === "admin") return { participant_type: "support", participant_id: payload.userId };
  if (payload.role === "merchant") return { participant_type: "merchant", participant_id: payload.userId };
  // Customer-role users may be a driver on some orders (drivers live in users).
  if (payload.role === "customer" && conv.order_id) {
    const db = getDb();
    const order = db.prepare("SELECT driver_id, customer_id FROM orders WHERE id = ?").get(conv.order_id) as
      | { driver_id: string | null; customer_id: string }
      | undefined;
    if (order?.driver_id === payload.userId) return { participant_type: "driver", participant_id: payload.userId };
  }
  return { participant_type: "customer", participant_id: payload.userId };
}

/** Display name for a participant from the users table. */
function displayNameFor(userId: string): string {
  const db = getDb();
  const user = db.prepare("SELECT name FROM users WHERE id = ?").get(userId) as { name: string } | undefined;
  return user?.name || "User";
}

// ── Conversation lifecycle ─────────────────────────────────────────────

/**
 * Get (or lazily create) the conversation for an order, with participants:
 * customer (order.customer_id), merchant (first merchant user for the
 * tenant), driver (order.driver_id when assigned), and an admin support seat
 * that admins can join. Idempotent — safe to call on every page view.
 */
export function ensureOrderConversation(orderId: string): { id: string; created: boolean } {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM conversations WHERE order_id = ?").get(orderId) as
    | { id: string }
    | undefined;
  if (existing) return { id: existing.id, created: false };

  const order = db.prepare("SELECT tenant_id, customer_id, driver_id FROM orders WHERE id = ?").get(orderId) as
    | { tenant_id: string; customer_id: string; driver_id: string | null }
    | undefined;
  if (!order) throw new Error("Order not found");

  const convId = generateId();
  const addParticipant = db.prepare(
    `INSERT OR IGNORE INTO conversation_participants
       (conversation_id, participant_type, participant_id, display_name)
     VALUES (?, ?, ?, ?)`
  );
  const tenant = db.prepare("SELECT store_name, name FROM tenants WHERE id = ?").get(order.tenant_id) as
    | { store_name: string; name: string }
    | undefined;
  const merchant = db
    .prepare("SELECT id, name FROM users WHERE tenant_id = ? AND role = 'merchant' ORDER BY created_at LIMIT 1")
    .get(order.tenant_id) as { id: string; name: string } | undefined;

  db.transaction(() => {
    db.prepare(
      "INSERT INTO conversations (id, order_id, store_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    ).run(convId, orderId, order.tenant_id, now(), now());
    addParticipant.run(convId, "customer", order.customer_id, displayNameFor(order.customer_id));
    if (merchant) addParticipant.run(convId, "merchant", merchant.id, merchant.name);
    if (order.driver_id) addParticipant.run(convId, "driver", order.driver_id, displayNameFor(order.driver_id));
    if (tenant) addParticipant.run(convId, "support", "platform", tenant.name + " Support");
  })();

  return { id: convId, created: true };
}

/**
 * Get (or create) a store-scoped conversation (customer ↔ dispensary, no order).
 */
export function ensureStoreConversation(storeId: string, customerId: string): { id: string; created: boolean } {
  const db = getDb();
  const existing = db
    .prepare(
      `SELECT c.id FROM conversations c
       JOIN conversation_participants cp ON cp.conversation_id = c.id
       WHERE c.store_id = ? AND c.order_id IS NULL AND cp.participant_type = 'customer' AND cp.participant_id = ?
       ORDER BY c.created_at DESC LIMIT 1`
    )
    .get(storeId, customerId) as { id: string } | undefined;
  if (existing) return { id: existing.id, created: false };

  const convId = generateId();
  const tenant = db.prepare("SELECT store_name, name FROM tenants WHERE id = ?").get(storeId) as
    | { store_name: string; name: string }
    | undefined;
  const merchant = db
    .prepare("SELECT id, name FROM users WHERE tenant_id = ? AND role = 'merchant' ORDER BY created_at LIMIT 1")
    .get(storeId) as { id: string; name: string } | undefined;

  db.transaction(() => {
    db.prepare(
      "INSERT INTO conversations (id, order_id, store_id, created_at, updated_at) VALUES (?, NULL, ?, ?, ?)"
    ).run(convId, storeId, now(), now());
    db.prepare(
      `INSERT OR IGNORE INTO conversation_participants
         (conversation_id, participant_type, participant_id, display_name)
       VALUES (?, 'customer', ?, ?)`
    ).run(convId, customerId, displayNameFor(customerId));
    if (merchant)
      db.prepare(
        `INSERT OR IGNORE INTO conversation_participants
           (conversation_id, participant_type, participant_id, display_name)
         VALUES (?, 'merchant', ?, ?)`
      ).run(convId, merchant.id, merchant.name);
    if (tenant)
      db.prepare(
        `INSERT OR IGNORE INTO conversation_participants
           (conversation_id, participant_type, participant_id, display_name)
         VALUES (?, 'support', 'platform', ?)`
      ).run(convId, tenant.name + " Support");
  })();

  return { id: convId, created: true };
}

/** Whether a user is a participant of a conversation (any participant seat). */
export function isParticipant(conversationId: string, userId: string): boolean {
  const db = getDb();
  return !!db
    .prepare("SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND participant_id = ? LIMIT 1")
    .get(conversationId, userId);
}

/** Let an admin join a conversation as the support participant. */
export function joinAsSupport(conversationId: string, admin: JwtPayload): void {
  const db = getDb();
  const conv = db.prepare("SELECT order_id, store_id FROM conversations WHERE id = ?").get(conversationId) as
    | { order_id: string | null; store_id: string | null }
    | undefined;
  if (!conv) return;
  // Prefer the existing platform/support seat; otherwise create one for this admin.
  const seat = db
    .prepare("SELECT participant_id FROM conversation_participants WHERE conversation_id = ? AND participant_type = 'support' LIMIT 1")
    .get(conversationId) as { participant_id: string } | undefined;
  if (seat?.participant_id === "platform") {
    db.prepare(
      "INSERT OR REPLACE INTO conversation_participants (conversation_id, participant_type, participant_id, display_name, joined_at) VALUES (?, 'support', ?, ?, ?)"
    ).run(conversationId, admin.userId, "Support · " + admin.email, now());
  } else if (!isParticipant(conversationId, admin.userId)) {
    db.prepare(
      `INSERT OR IGNORE INTO conversation_participants
         (conversation_id, participant_type, participant_id, display_name)
       VALUES (?, 'support', ?, ?)`
    ).run(conversationId, admin.userId, "Support · " + admin.email);
  }
}

function conversationWithUnread(conversationId: string, userId: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT c.id, c.order_id, c.store_id, c.last_message_at, c.created_at,
              (SELECT t.store_name FROM tenants t WHERE t.id = c.store_id) AS store_name,
              (SELECT COUNT(*) FROM messages m
                WHERE m.conversation_id = c.id AND m.sender_id != ?
                  AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)) AS unread_count
       FROM conversations c
       JOIN conversation_participants p ON p.conversation_id = c.id
       WHERE c.id = ? AND p.participant_id = ?
       LIMIT 1`
    )
    .get(userId, conversationId, userId) as Record<string, unknown> | undefined;
}

// ── Handlers ───────────────────────────────────────────────────────────

// POST /api/conversations — create (or fetch) a conversation linked to an order or store.
export function handleCreateConversation(body: Record<string, unknown>, payload: JwtPayload): Response {
  const orderId = body.orderId as string | undefined;
  const storeId = body.storeId as string | undefined;
  if (!orderId && !storeId) return error("orderId or storeId is required");

  try {
    if (orderId) {
      const order = getDb().prepare("SELECT id FROM orders WHERE id = ?").get(orderId);
      if (!order) return error("Order not found", 404);
      // Only the order's customer, assigned driver, or tenant merchant may open it.
      const db = getDb();
      const full = db
        .prepare("SELECT customer_id, driver_id, tenant_id FROM orders WHERE id = ?")
        .get(orderId) as { customer_id: string; driver_id: string | null; tenant_id: string };
      const allowed =
        payload.role === "admin" ||
        full.customer_id === payload.userId ||
        full.driver_id === payload.userId ||
        (payload.role === "merchant" && payload.tenantId === full.tenant_id);
      if (!allowed) return error("You are not part of this order", 403);

      const { id } = ensureOrderConversation(orderId);
      return json({ success: true, data: { ...conversationWithUnread(id, payload.userId), participants: getParticipants(id) } });
    }
    if (storeId) {
      const tenant = getDb().prepare("SELECT id FROM tenants WHERE id = ?").get(storeId);
      if (!tenant) return error("Store not found", 404);
      const { id } = ensureStoreConversation(storeId, payload.userId);
      return json({ success: true, data: { ...conversationWithUnread(id, payload.userId), participants: getParticipants(id) } });
    }
    return error("Invalid request");
  } catch (e) {
    return error((e as Error).message, 400);
  }
}

// GET /api/conversations — list conversations I participate in, with unread counts.
export function handleListConversations(payload: JwtPayload): Response {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT c.id, c.order_id, c.store_id, c.last_message_at, c.created_at,
              (SELECT t.store_name FROM tenants t WHERE t.id = c.store_id) AS store_name,
              (SELECT COUNT(*) FROM messages m
                WHERE m.conversation_id = c.id AND m.sender_id != ?
                  AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)) AS unread_count,
              (SELECT m2.body FROM messages m2 WHERE m2.conversation_id = c.id
                ORDER BY m2.created_at DESC LIMIT 1) AS last_message,
              (SELECT m2.created_at FROM messages m2 WHERE m2.conversation_id = c.id
                ORDER BY m2.created_at DESC LIMIT 1) AS last_message_at
       FROM conversations c
       JOIN conversation_participants p ON p.conversation_id = c.id
       WHERE p.participant_id = ?
       ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
       LIMIT 100`
    )
    .all(payload.userId, payload.userId);

  const conversations = rows.map((row) => ({
    ...(row as Record<string, unknown>),
    participants: getParticipants((row as { id: string }).id),
  }));
  return json({ success: true, data: conversations });
}

function getParticipants(conversationId: string) {
  const db = getDb();
  return db
    .prepare(
      "SELECT participant_type, participant_id, display_name, joined_at, last_read_at FROM conversation_participants WHERE conversation_id = ? ORDER BY joined_at"
    )
    .all(conversationId);
}

// GET /api/conversations/:id/messages
export function handleGetMessages(conversationId: string, payload: JwtPayload): Response {
  const db = getDb();
  const conv = db.prepare("SELECT * FROM conversations WHERE id = ?").get(conversationId) as
    | { id: string; order_id: string | null }
    | undefined;
  if (!conv) return error("Conversation not found", 404);

  if (!isParticipant(conversationId, payload.userId) && payload.role !== "admin") {
    return error("You are not a participant of this conversation", 403);
  }

  // Admins can join any conversation as support on first read.
  if (payload.role === "admin") joinAsSupport(conversationId, payload);

  const messages = db
    .prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 500")
    .all(conversationId);
  return json({ success: true, data: { conversation: conv, participants: getParticipants(conversationId), messages } });
}

// POST /api/conversations/:id/messages
export function handleSendMessage(conversationId: string, body: Record<string, unknown>, payload: JwtPayload): Response {
  const db = getDb();
  const conv = db.prepare("SELECT * FROM conversations WHERE id = ?").get(conversationId) as
    | { id: string; order_id: string | null; store_id: string | null }
    | undefined;
  if (!conv) return error("Conversation not found", 404);

  const role = resolveParticipantForConversation(payload, conv);
  if (!role || !isParticipant(conversationId, payload.userId)) {
    return error("You are not a participant of this conversation", 403);
  }
  // The resolved role must match a seat we hold.
  const seat = db
    .prepare(
      "SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND participant_type = ? AND participant_id = ?"
    )
    .get(conversationId, role.participant_type, role.participant_id);
  if (!seat) return error("You are not a participant of this conversation", 403);

  const text = String(body.body ?? "").trim();
  if (!text) return error("Message body is required");
  if (text.length > MAX_BODY_LENGTH) return error(`Message is too long (max ${MAX_BODY_LENGTH} characters)`);

  const id = generateId();
  const ts = now();
  db.transaction(() => {
    db.prepare(
      "INSERT INTO messages (id, conversation_id, sender_type, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, conversationId, role.participant_type, role.participant_id, text, ts);
    db.prepare("UPDATE conversations SET last_message_at = ?, updated_at = ? WHERE id = ?").run(ts, ts, conversationId);
  })();

  const message = db.prepare("SELECT * FROM messages WHERE id = ?").get(id);
  return json({ success: true, data: message }, 201);
}

// POST /api/conversations/:id/read — mark all messages from others as read for me.
export function handleMarkRead(conversationId: string, payload: JwtPayload): Response {
  const db = getDb();
  const conv = db.prepare("SELECT * FROM conversations WHERE id = ?").get(conversationId) as
    | { id: string }
    | undefined;
  if (!conv) return error("Conversation not found", 404);

  const role = resolveParticipantForConversation(payload, conv);
  if (!role || !isParticipant(conversationId, payload.userId)) {
    return error("You are not a participant of this conversation", 403);
  }
  const seat = db
    .prepare("SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND participant_type = ? AND participant_id = ?")
    .get(conversationId, role.participant_type, role.participant_id);
  if (!seat) return error("You are not a participant of this conversation", 403);

  const ts = now();
  db.transaction(() => {
    db.prepare(
      "UPDATE conversation_participants SET last_read_at = ? WHERE conversation_id = ? AND participant_type = ? AND participant_id = ?"
    ).run(ts, conversationId, role.participant_type, role.participant_id);
    db.prepare(
      "UPDATE messages SET read_at = ? WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL AND created_at <= ?"
    ).run(ts, conversationId, payload.userId, ts);
  })();

  return json({ success: true, data: { conversationId, readAt: ts } });
}

// GET /api/conversations/stream?token= — SSE: live new-message events.
export function handleConversationStream(url: URL): Response {
  const token = url.searchParams.get("token") || "";
  const payload = requireAuth(new Request(url, { headers: { Authorization: `Bearer ${token}` } }));
  if (!payload) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }
  const userId = payload.userId;

  const stream = new ReadableStream({
    start(controller: ReadableStreamDefaultController) {
      controller.enqueue("data: " + JSON.stringify({ type: "connected", message: "Conversation stream connected" }) + "\n\n");
      let lastSeen = new Date().toISOString();

      const interval = setInterval(() => {
        try {
          const db = getDb();
          const rows = db
            .prepare(
              `SELECT m.id, m.conversation_id, m.sender_type, m.sender_id, m.body, m.created_at
               FROM messages m
               JOIN conversation_participants p ON p.conversation_id = m.conversation_id
               WHERE p.participant_id = ? AND m.created_at > ? AND m.sender_id != ?
               ORDER BY m.created_at ASC LIMIT 50`
            )
            .all(userId, lastSeen, userId);
          if (rows.length > 0) {
            lastSeen = rows[rows.length - 1].created_at as string;
            controller.enqueue("data: " + JSON.stringify({ type: "messages", data: rows }) + "\n\n");
          }
        } catch {
          // keep alive
        }
      }, 2000);
    },
    cancel() {
      // cleanup on disconnect
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
