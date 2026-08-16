import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { Icon } from "~/components/Icon";
import {
  getChatUser, getChatToken, chatLogin, clearChatSession,
  createConversation, getMessages, sendMessage, markConversationRead,
  subscribeConversations, DEMO_ACCOUNTS,
  type ChatUser, type ChatMessage, type ChatConversation,
} from "~/lib/chat-client";

interface ChatWidgetProps {
  /** Open an existing conversation directly (inbox/thread views) */
  conversationId?: string;
  /** Auto-open/create the conversation linked to this order */
  orderId?: string;
  /** Auto-open/create the store-scoped conversation for this tenant */
  storeId?: string;
  title?: string;
  subtitle?: string;
  /** compact = floating launcher with unread badge (storefront/driver); false = inline panel */
  compact?: boolean;
  className?: string;
}

function timeLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function SenderName({ name, type }: { name?: string; type: string }) {
  const label = name || type.charAt(0).toUpperCase() + type.slice(1);
  return <span className="text-[11px] font-medium text-[var(--color-neutral-400)]">{label}</span>;
}

export function ChatWidget({
  conversationId, orderId, storeId, title = "Messages", subtitle, compact = false, className = "",
}: ChatWidgetProps) {
  const [user, setUser] = useState<ChatUser | null>(null);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(!compact);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, []);

  // Restore session
  useEffect(() => {
    setUser(getChatUser());
    setLoading(false);
  }, []);

  const initConversation = useCallback(async (currentUser: ChatUser) => {
    setLoading(true);
    setError("");
    try {
      let conv: ChatConversation | null = null;
      if (conversationId) {
        // Open an existing thread directly (inbox views). If we're an admin we
        // join as support automatically on the server side.
        const msgs = await getMessages(conversationId);
        conv = { id: conversationId, order_id: null, store_id: null, participants: [] };
        setMessages(msgs);
      } else {
        conv = await createConversation(
          orderId ? { orderId } : storeId ? { storeId } : {}
        );
        if (!conv) throw new Error("Could not open conversation");
        setMessages(await getMessages(conv.id));
      }
      if (!conv) throw new Error("Could not open conversation");
      setConversation(conv);
      setUnread(Number((conv as ChatConversation).unread_count) || 0);
      await markConversationRead(conv.id);
      scrollToBottom();
    } catch (e) {
      setError((e as Error).message || "Chat unavailable");
    } finally {
      setLoading(false);
    }
  }, [conversationId, orderId, storeId, scrollToBottom]);

  // When authed (or after demo login), open/create the conversation.
  useEffect(() => {
    if (user) {
      initConversation(user);
    } else {
      setConversation(null);
      setMessages([]);
      setUnread(0);
    }
  }, [user, initConversation]);

  // Live SSE updates for my conversations.
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeConversations((incoming) => {
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id));
        const fresh = incoming.filter((m) => !known.has(m.id));
        if (fresh.length === 0) return prev;
        // Only auto-open for the conversation we're viewing; otherwise count unread.
        const relevant = fresh.filter((m) => m.conversation_id === conversation?.id);
        setUnread((u) => u + (fresh.length - relevant.length));
        return [...prev, ...fresh];
      });
      scrollToBottom();
    });
    return unsubscribe;
  }, [user, conversation?.id, scrollToBottom]);

  // Mark read whenever the panel is open and a new message arrives in this thread.
  useEffect(() => {
    if (open && conversation && messages.length > 0) {
      markConversationRead(conversation.id).catch(() => {});
      setUnread(0);
    }
  }, [open, conversation, messages]);

  const handleLogin = async (role: string) => {
    const u = await chatLogin(role);
    if (u) {
      setUser(u);
    } else {
      setError("Demo sign-in failed — is the server up?");
    }
  };

  const handleLogout = () => {
    clearChatSession();
    setUser(null);
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !conversation || sending) return;
    setSending(true);
    try {
      const sent = await sendMessage(conversation.id, body);
      if (sent) {
        setMessages((prev) => [...prev, sent]);
        setDraft("");
        scrollToBottom();
      }
    } catch (e) {
      setError((e as Error).message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const myId = user?.id || "";

  const panel = (
    <div className={`flex flex-col bg-white border border-[var(--color-neutral-200)] rounded-2xl shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-primary-900)] text-white">
        <div className="flex items-center gap-2 min-w-0">
          <Icon name="chat" size={18} />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{title}</p>
            {subtitle && <p className="text-[11px] text-white/70 truncate">{subtitle}</p>}
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="neutral" size="sm">{user.name}</Badge>
            <button
              onClick={handleLogout}
              className="text-[11px] text-white/70 hover:text-white underline"
              aria-label="Sign out of chat"
            >Sign out</button>
          </div>
        )}
      </div>

      {/* Body */}
      {!user ? (
        <div className="p-4">
          <p className="text-sm text-[var(--color-neutral-600)] mb-3">
            Sign in to message the dispensary and your delivery driver. Pick a demo role to try it:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <Button
                key={a.role}
                size="sm"
                variant={a.role === "customer" ? "neon" : "outline"}
                onClick={() => handleLogin(a.role)}
              >
                {a.label}
              </Button>
            ))}
          </div>
          <p className="text-[11px] text-[var(--color-neutral-400)] mt-3">
            Age-verified accounts only. Chat is for order questions — no medical advice.
          </p>
        </div>
      ) : (
        <>
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[220px] max-h-[340px] bg-[var(--surface-secondary)]"
          >
            {loading && (
              <p className="text-center text-sm text-[var(--color-neutral-400)] py-8">Loading conversation…</p>
            )}
            {!loading && messages.length === 0 && (
              <p className="text-center text-sm text-[var(--color-neutral-400)] py-8">
                No messages yet — say hello!
              </p>
            )}
            {messages.map((m) => {
              const mine = m.sender_id === myId;
              return (
                <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm break-words ${
                      mine
                        ? "bg-[var(--color-primary-500)] text-white rounded-br-sm"
                        : "bg-white border border-[var(--color-neutral-200)] text-[var(--color-neutral-800)] rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 mt-0.5 ${mine ? "flex-row-reverse" : ""}`}>
                    <SenderName name={m.sender_type} type={m.sender_type} />
                    <span className="text-[10px] text-[var(--color-neutral-400)]">{timeLabel(m.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {error && <p className="px-4 py-1.5 text-xs text-[var(--color-error)] bg-[var(--color-error)]/5">{error}</p>}

          {/* Composer */}
          <div className="flex items-center gap-2 p-3 border-t border-[var(--color-neutral-200)]">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message…"
              maxLength={2000}
              className="flex-1 min-h-11 px-3 rounded-xl border border-[var(--color-neutral-300)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] bg-white"
              aria-label="Message body"
            />
            <Button size="sm" onClick={handleSend} disabled={sending || !draft.trim()} className="min-h-11">
              {sending ? "…" : "Send"}
            </Button>
          </div>
        </>
      )}
    </div>
  );

  if (!compact) {
    return <div className={className}>{panel}</div>;
  }

  // Compact floating launcher (storefront / driver page)
  return (
    <div className={`fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 ${className}`}>
      {open && (
        <div className="w-[92vw] max-w-[380px] sm:w-[380px]">
          {panel}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="relative w-14 h-14 rounded-full bg-[var(--color-primary-500)] text-white shadow-[var(--glow-green)] hover:bg-[var(--color-primary-600)] transition-colors flex items-center justify-center"
      >
        {open ? <Icon name="cross" size={22} /> : <Icon name="chat" size={22} />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[var(--color-error)] text-white text-[11px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}

export default ChatWidget;
