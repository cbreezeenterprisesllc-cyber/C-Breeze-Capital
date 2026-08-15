import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { Icon } from "~/components/Icon";
import { ChatWidget } from "~/components/ChatWidget";
import {
  getChatUser, chatLogin, clearChatSession,
  listConversations, subscribeConversations, DEMO_ACCOUNTS,
  type ChatUser, type ChatConversation,
} from "~/lib/chat-client";

interface ChatInboxProps {
  title: string;
  subtitle?: string;
  /** Which demo roles are relevant for this surface (order matters) */
  demoRoles?: string[];
  className?: string;
}

function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function threadTitle(c: ChatConversation): string {
  if (c.order_id) return `Order #${c.order_id.slice(0, 8)}`;
  return c.store_name || "Store chat";
}

function participantNames(c: ChatConversation): string {
  return c.participants
    .map((p) => p.display_name || p.participant_type)
    .slice(0, 3)
    .join(", ");
}

export function ChatInbox({ title, subtitle, demoRoles = ["customer", "merchant", "driver", "support"], className = "" }: ChatInboxProps) {
  const [user, setUser] = useState<ChatUser | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getChatUser());
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (!getChatToken_()) return;
    try {
      const list = await listConversations();
      setConversations(list);
      // Auto-select the first conversation when none selected yet.
      setSelectedId((prev) => prev || list[0]?.id || null);
    } catch (e) {
      setError((e as Error).message || "Could not load conversations");
    }
  }, []);

  function getChatToken_(): string | null {
    try {
      return localStorage.getItem("ge_chat_token");
    } catch {
      return null;
    }
  }

  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setConversations([]);
      setSelectedId(null);
    }
  }, [user, refresh]);

  // Live refresh: when a new message arrives, update the list + unread counts.
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeConversations(() => refresh());
    return unsubscribe;
  }, [user, refresh]);

  const handleLogin = async (role: string) => {
    const u = await chatLogin(role);
    if (u) setUser(u);
    else setError("Demo sign-in failed — is the server up?");
  };

  const handleLogout = () => {
    clearChatSession();
    setUser(null);
  };

  const selected = conversations.find((c) => c.id === selectedId) || null;
  const totalUnread = conversations.reduce((s, c) => s + (Number(c.unread_count) || 0), 0);

  return (
    <div className={`animate-fade-in ${className}`}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-[var(--font-heading)] gradient-text-green flex items-center gap-2">
            <Icon name="chat" size={28} /> {title}
          </h1>
          {totalUnread > 0 && <Badge variant="error" size="md">{totalUnread} unread</Badge>}
        </div>
        {user && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-neutral-500)]">
            Signed in as <Badge variant="primary" size="sm">{user.name}</Badge>
            <button onClick={handleLogout} className="text-xs underline text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]">Sign out</button>
          </div>
        )}
      </div>
      {subtitle && <p className="text-[var(--color-neutral-500)] mb-6 -mt-4">{subtitle}</p>}

      {!user ? (
        <Card padding="lg" className="max-w-lg">
          <CardHeader>
            <h2 className="font-[var(--font-heading)] text-lg flex items-center gap-2"><Icon name="chat" size={18} /> Sign in to your inbox</h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-[var(--color-neutral-600)] mb-4">
              Pick a demo role to open this inbox. In production this uses the account's JWT.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.filter((a) => demoRoles.includes(a.role)).map((a) => (
                <Button key={a.role} size="sm" variant={a.role === "merchant" || a.role === "support" ? "neon" : "outline"} onClick={() => handleLogin(a.role)}>
                  {a.label}
                </Button>
              ))}
            </div>
            <p className="text-[11px] text-[var(--color-neutral-400)] mt-3">Age-verified accounts only. No medical advice in chat.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation list */}
          <Card padding="md" className="lg:col-span-1 h-fit lg:sticky lg:top-6">
            <CardHeader>
              <h2 className="font-[var(--font-heading)] text-sm uppercase tracking-wide text-[var(--color-neutral-500)]">Conversations ({conversations.length})</h2>
            </CardHeader>
            <div ref={listRef} className="max-h-[420px] lg:max-h-[540px] overflow-y-auto space-y-2">
              {loading && <p className="text-sm text-[var(--color-neutral-400)] py-6 text-center">Loading…</p>}
              {!loading && conversations.length === 0 && (
                <p className="text-sm text-[var(--color-neutral-400)] py-6 text-center">
                  No conversations yet. They appear here when customers message your store or an order is placed.
                </p>
              )}
              {conversations.map((c) => {
                const unread = Number(c.unread_count) || 0;
                const active = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedId(c.id); }}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                      active
                        ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)]"
                        : "border-[var(--color-neutral-200)] bg-white hover:border-[var(--color-primary-300)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-semibold truncate ${active ? "text-[var(--color-primary-700)]" : "text-[var(--color-neutral-800)]"}`}>
                        {threadTitle(c)}
                      </span>
                      <span className="text-[11px] text-[var(--color-neutral-400)] shrink-0">{timeAgo(c.last_message_at)}</span>
                    </div>
                    <p className="text-xs text-[var(--color-neutral-500)] truncate mt-0.5">{c.last_message || "No messages yet"}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[11px] text-[var(--color-neutral-400)] truncate">{participantNames(c)}</span>
                      {unread > 0 && (
                        <span className="min-w-5 h-5 px-1 rounded-full bg-[var(--color-error)] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Thread */}
          <div className="lg:col-span-2">
            {error && <p className="text-sm text-[var(--color-error)] bg-[var(--color-error)]/5 px-4 py-2 rounded-lg mb-3">{error}</p>}
            {selected ? (
              <ChatWidget
                conversationId={selected.id}
                title={threadTitle(selected)}
                subtitle={selected.store_name || participantNames(selected)}
                className="min-h-[540px]"
              />
            ) : (
              <Card padding="lg" className="min-h-[320px] flex items-center justify-center">
                <CardBody className="text-center text-[var(--color-neutral-400)]">
                  <Icon name="chat" size={40} className="mb-3" />
                  <p className="font-medium">Select a conversation</p>
                  <p className="text-sm">Messages appear here once a thread is open.</p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatInbox;
