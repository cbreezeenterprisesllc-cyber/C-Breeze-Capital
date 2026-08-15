// Frontend chat client — unified messaging session + API wrappers.
// Stores a real JWT (from /api/auth/login) in localStorage and calls the
// conversation API. SSE subscription passes the token as a query param
// because EventSource cannot set Authorization headers.
import { apiFetch } from "~/lib/api-config";

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface ChatConversation {
  id: string;
  order_id: string | null;
  store_id: string | null;
  store_name?: string;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count?: number;
  participants: Array<{ participant_type: string; participant_id: string; display_name: string }>;
}

const TOKEN_KEY = "ge_chat_token";
const USER_KEY = "ge_chat_user";

export function getChatToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getChatUser(): ChatUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as ChatUser) : null;
  } catch {
    return null;
  }
}

export function setChatSession(token: string, user: ChatUser): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch { /* private mode */ }
}

export function clearChatSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch { /* ignore */ }
}

// Seeded demo accounts — used by the demo sign-in selector so all four
// chat surfaces are testable end-to-end without building a registration UI.
export const DEMO_ACCOUNTS: Array<{ role: string; label: string; email: string; password: string }> = [
  { role: "customer", label: "Customer · Carlos (SoCal Green)", email: "carlos@socalgreen.com", password: "password123" },
  { role: "merchant", label: "Merchant · Alex (GreenLeaf)", email: "alex@greenleaf.com", password: "password123" },
  { role: "driver", label: "Driver · Tina (Vegas Oasis)", email: "tina@vegasoasis.com", password: "password123" },
  { role: "support", label: "Support · Platform Admin", email: "admin@greenexpress.io", password: "admin123" },
];

export async function chatLogin(role: string): Promise<ChatUser | null> {
  const account = DEMO_ACCOUNTS.find((a) => a.role === role);
  if (!account) return null;
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: account.email, password: account.password }),
  });
  const payload = await res.json();
  if (!payload.success || !payload.data?.token) return null;
  const user = payload.data.user as ChatUser;
  setChatSession(payload.data.token, user);
  return user;
}

function authHeaders(): Record<string, string> {
  const token = getChatToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createConversation(input: { orderId?: string; storeId?: string }): Promise<ChatConversation | null> {
  const res = await apiFetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  const payload = await res.json();
  return payload.success ? (payload.data as ChatConversation) : null;
}

export async function listConversations(): Promise<ChatConversation[]> {
  const res = await apiFetch("/api/conversations", { headers: authHeaders() });
  const payload = await res.json();
  return payload.success ? (payload.data as ChatConversation[]) : [];
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const res = await apiFetch(`/api/conversations/${conversationId}/messages`, { headers: authHeaders() });
  const payload = await res.json();
  return payload.success ? (payload.data?.messages as ChatMessage[] ?? []) : [];
}

export async function sendMessage(conversationId: string, body: string): Promise<ChatMessage | null> {
  const res = await apiFetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ body }),
  });
  const payload = await res.json();
  return payload.success ? (payload.data as ChatMessage) : null;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await apiFetch(`/api/conversations/${conversationId}/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({}),
  });
}

/** Live subscription: SSE pushes messages (from others) for my conversations. */
export function subscribeConversations(onMessages: (msgs: ChatMessage[]) => void): () => void {
  const token = getChatToken();
  if (!token) return () => {};
  const es = new EventSource(`/api/conversations/stream?token=${encodeURIComponent(token)}`);
  es.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === "messages" && Array.isArray(payload.data)) {
        onMessages(payload.data as ChatMessage[]);
      }
    } catch { /* ignore malformed */ }
  };
  return () => es.close();
}
