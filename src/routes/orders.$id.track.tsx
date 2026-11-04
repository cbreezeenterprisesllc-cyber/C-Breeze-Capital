import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { TopbarNav } from "~/components/Navigation";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Icon } from "~/components/Icon";
import { ChatWidget } from "~/components/ChatWidget";
import { SiteFooter } from "~/components/SiteFooter";
import { formatScheduledLabel } from "~/lib/delivery-windows";
import { getChatToken } from "~/lib/chat-client";
import {
  formatTime,
  formatWindowLabel,
  normalizeStatus,
  pipelineFor,
  STATUS_DESCRIPTIONS,
  STATUS_LABELS,
  STATUS_SHORT,
  type DispatchStatus,
} from "~/lib/dispatch";

export const Route = createFileRoute("/orders/$id/track")({
  component: TrackOrder,
});

type OrderEvent = {
  status: string;
  previous_status?: string;
  actor_name?: string;
  actor_role?: string;
  note?: string;
  created_at: string;
};

const STATUS_ICONS: Record<string, any> = {
  pending: <Icon name="pencil" size={14} />,
  assigned: <Icon name="person" size={14} />,
  ready: <Icon name="chef" size={14} />,
  picked_up: <Icon name="package" size={14} />,
  in_transit: <Icon name="car" size={14} />,
  delivered: <Icon name="celebration" size={14} />,
  cancelled: <Icon name="cross" size={14} />,
};

function TrackOrder() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);
  // Rating state
  const [alreadyRated, setAlreadyRated] = useState<number | null>(null);
  const [rateValue, setRateValue] = useState(0);
  const [rateComment, setRateComment] = useState("");
  const [rateMsg, setRateMsg] = useState("");
  const [rateError, setRateError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Polls the REAL order state — the same rows the dispensary's staff update.
  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (data.success) {
        setOrder((prev: any) => {
          if (prev && prev.dispatch_status !== data.data.dispatch_status) {
            setPulse(true);
            setTimeout(() => setPulse(false), 1200);
          }
          return data.data;
        });
      }
    } catch (err) {
      console.error("Failed to fetch order:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-[var(--surface-secondary)] flex items-center justify-center">
        <div className="text-center">
          <div className="leaf-spinner mx-auto mb-4" />
          <p className="text-[var(--color-neutral-500)]">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-dvh bg-[var(--surface-secondary)] flex items-center justify-center">
        <Card padding="lg" className="max-w-md w-full text-center animate-fade-in">
          <CardBody>
            <div className="mb-4 flex justify-center"><Icon name="search" size={56} /></div>
            <h1 className="text-2xl font-[var(--font-heading)] text-[var(--color-neutral-600)] mb-2">Order not found</h1>
            <p className="text-[var(--color-neutral-500)] mb-6">This order doesn&apos;t exist or has been removed.</p>
            <Link to="/dispensaries"><Button variant="neon" className="inline-flex items-center gap-2"><Icon name="leaf" size={16} /> Browse Dispensaries</Button></Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  const status: DispatchStatus = normalizeStatus(order.dispatch_status ?? order.status);
  const isCancelled = status === "cancelled";
  const isPickup = order.is_pickup ?? (order.fulfillment_type === "pickup" || order.fulfillment_type === "curbside");
  const rail = pipelineFor(order.fulfillment_type);
  const currentStepIndex = rail.indexOf(status);
  const items: any[] = order.items || [];
  const events: OrderEvent[] = order.events || [];
  const effectiveRated = alreadyRated ?? (order.my_rating != null ? order.my_rating : null);
  const windowLabel = formatWindowLabel(order.window?.start ?? null, order.window?.end ?? null);
  const staffName = order.staff_name || "";

  const submitRating = async () => {
    setRateError(""); setRateMsg("");
    if (rateValue < 1) { setRateError("Tap a star to rate your delivery."); return; }
    const token = getChatToken();
    if (!token) { setRateError("Sign in to rate this delivery — your rated order saves to your account."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${id}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: rateValue, comment: rateComment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) { setAlreadyRated(rateValue || 0); setRateMsg("Thanks — you've already rated this delivery."); }
        else setRateError(data.error || "Couldn't submit your rating. Please try again.");
        return;
      }
      setAlreadyRated(rateValue);
      setRateMsg("Thanks for rating your delivery! Your feedback goes to the dispensary.");
      fetchOrder();
    } catch {
      setRateError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[var(--surface-secondary)]">
      <TopbarNav
        branding={{ title: "GreenExpress" }}
        items={[
          { label: "Home", href: "/" },
          { label: "Dispensaries", href: "/dispensaries" },
          { label: "Track Order", active: true },
        ]}
      />

      <main className="max-w-2xl mx-auto px-6 py-12 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">{isCancelled ? <Icon name="cross" size={48} /> : <Icon name="truck" size={48} />}</div>
          <h1 className="text-4xl font-[var(--font-heading)] gradient-text-green mb-2">
            {isCancelled ? "Order Cancelled" : "Order Tracking"}
          </h1>
          <p className="text-[var(--color-neutral-500)]">
            Order #{id.slice(0, 8)} · {order.customer_name || "GreenExpress"}
          </p>
          <Badge
            variant={isCancelled ? "error" : status === "delivered" ? "success" : status === "pending" ? "primary" : "accent"}
            size="md"
            dot
            className={`mt-2 inline-flex items-center gap-1 transition-transform duration-500 ${pulse ? "scale-110" : ""}`}
          >
            {STATUS_LABELS[status] || status} {STATUS_ICONS[status]}
          </Badge>
          <p className="text-sm text-[var(--color-neutral-500)] mt-2">{STATUS_DESCRIPTIONS[status]}</p>
        </div>

        {/* Estimated window */}
        {!isCancelled && windowLabel && status !== "delivered" && (
          <Card padding="md" className="mb-6">
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--color-neutral-600)]">
                  <Icon name="clock" size={16} />
                  <span>{isPickup ? "Estimated ready" : "Estimated arrival"}</span>
                </div>
                <span className="font-semibold text-[var(--color-primary-700)]">{windowLabel}</span>
              </div>
              <p className="text-xs text-[var(--color-neutral-400)] mt-1">
                {order.window?.scheduled
                  ? "Your chosen delivery window. The dispensary's own staff make the delivery."
                  : "Estimated by the dispensary from when your order was placed."}
              </p>
            </CardBody>
          </Card>
        )}

        {/* Progress rail — driven by the real pipeline */}
        {!isCancelled && (
          <Card padding="lg" className="mb-8">
            <CardBody>
              <div className="flex items-center justify-between mb-6">
                {rail.map((step, i) => {
                  const completed = i < currentStepIndex;
                  const active = i === currentStepIndex;
                  return (
                    <div key={step} className="flex flex-col items-center relative flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-[var(--transition-slow)] ${
                        completed ? "bg-[var(--color-success)] text-white shadow-md" :
                        active ? "bg-[var(--color-primary-500)] text-white shadow-[var(--glow-green)] scale-110" :
                        "bg-[var(--color-neutral-200)] text-[var(--color-neutral-500)]"
                      }`}>
                        {completed ? "✓" : active ? "●" : "○"}
                      </div>
                      <p className={`text-xs mt-2 font-medium text-center ${active ? "text-[var(--color-primary-700)]" : completed ? "text-[var(--color-success)]" : "text-[var(--color-neutral-400)]"}`}>
                        {STATUS_SHORT[step]}
                      </p>
                      {i < rail.length - 1 && (
                        <div className={`absolute top-5 left-[60%] w-[80%] h-0.5 ${completed ? "bg-[var(--color-success)]" : "bg-[var(--color-neutral-200)]"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              {status === "in_transit" && (
                <div className="text-center text-sm text-[var(--color-primary-600)] animate-pulse flex items-center justify-center gap-1">
                  <Icon name="car" size={16} /> {staffName ? `${staffName} is on the way` : "Your delivery is on the way"}!
                </div>
              )}
              {status === "assigned" && staffName && (
                <div className="text-center text-sm text-[var(--color-neutral-600)] flex items-center justify-center gap-1">
                  <Icon name="person" size={16} /> {staffName} from the dispensary will deliver your order.
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Cancelled Notice */}
        {isCancelled && (
          <Card padding="lg" className="mb-8 border-[var(--color-error)]/30 animate-scale-in">
            <CardBody className="text-center">
              <div className="flex justify-center mb-3"><Icon name="cross" size={40} /></div>
              <p className="text-[var(--color-error)] font-medium">This order has been cancelled.</p>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">No charges were made.</p>
            </CardBody>
          </Card>
        )}

        {/* Rate the delivery — after the dispensary marks it delivered */}
        {status === "delivered" && order.driver_id && (
          <Card padding="lg" className="mb-6 border-[var(--color-primary-300)] animate-scale-in">
            <CardHeader>
              <h2 className="text-lg font-[var(--font-heading)] text-[var(--color-neutral-800)] flex items-center gap-2">
                <Icon name="celebration" size={18} /> {effectiveRated != null ? "Rating submitted" : "Rate your delivery"}
              </h2>
            </CardHeader>
            <CardBody>
              {effectiveRated != null ? (
                <div className="text-center py-2">
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={`text-2xl ${i <= effectiveRated ? "text-amber-400" : "text-[var(--color-neutral-300)]"}`}>★</span>
                    ))}
                  </div>
                  <p className="text-sm text-[var(--color-neutral-500)]">You rated this delivery {effectiveRated} out of 5 stars. Thank you!</p>
                  {rateMsg && <p className="text-sm text-[var(--color-success-700)] mt-2">{rateMsg}</p>}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-[var(--color-neutral-600)] mb-3">
                    How was your delivery{staffName ? ` from ${staffName}` : ""}? Your rating goes to the dispensary.
                  </p>
                  <div className="flex justify-center gap-3 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setRateValue(i); setRateError(""); }}
                        className={`text-3xl transition-transform ${i <= rateValue ? "text-amber-400 scale-110" : "text-[var(--color-neutral-300)] hover:text-amber-200"}`}
                        aria-label={`${i} star${i > 1 ? "s" : ""}`}
                      >★</button>
                    ))}
                  </div>
                  <textarea
                    value={rateComment}
                    onChange={(e) => setRateComment(e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="Optional: leave a quick note about your delivery..."
                    className="w-full p-3 rounded-xl border border-[var(--color-neutral-200)] text-sm resize-none focus:border-[var(--color-primary-400)] transition-colors mb-3 bg-[var(--surface-primary)]"
                  />
                  {rateError && <p className="text-sm text-[var(--color-error)] mb-2">{rateError}</p>}
                  {rateMsg && <p className="text-sm text-[var(--color-success-700)] mb-2">{rateMsg}</p>}
                  <div className="text-center">
                    <Button variant="neon" onClick={submitRating} disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit Rating"}
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Live status history — real events, real timestamps */}
        {events.length > 0 && (
          <Card padding="lg" className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-[var(--font-heading)] text-[var(--color-neutral-800)] flex items-center gap-2">
                <Icon name="clock" size={18} /> Status history
              </h2>
            </CardHeader>
            <CardBody>
              <ol className="space-y-3">
                {events.map((ev, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-[var(--color-primary-400)] shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-neutral-800)]">{STATUS_LABELS[normalizeStatus(ev.status)] || ev.status}</p>
                      <p className="text-xs text-[var(--color-neutral-500)]">
                        {formatTime(ev.created_at)}
                        {ev.actor_name ? ` · ${ev.actor_name}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        )}

        {/* Order Details */}
        <Card padding="lg" className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-[var(--font-heading)] text-[var(--color-neutral-800)] flex items-center gap-2">
              <Icon name="clipboard" size={18} /> Order Details
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-neutral-500)]">Dispensary</span>
                <span className="font-medium">{order.customer_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-neutral-500)]">{order.fulfillment_type === "curbside" ? "Curbside at" : order.fulfillment_type === "pickup" ? "Pick up at" : "Delivery Address"}</span>
                <span className="font-medium text-right max-w-[200px]">{order.delivery_address}{order.fulfillment_type === "curbside" && order.pickup_vehicle ? ` • ${order.pickup_vehicle}` : ""}</span>
              </div>
              {formatScheduledLabel(order.scheduled_delivery_at) && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-neutral-500)]">{order.fulfillment_type === "pickup" || order.fulfillment_type === "curbside" ? "Scheduled pickup" : "Scheduled delivery"}</span>
                  <span className="font-medium text-[var(--color-primary-700)]">{formatScheduledLabel(order.scheduled_delivery_at)}</span>
                </div>
              )}
              {order.delivery_notes && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-neutral-500)]">Notes</span>
                  <span className="italic text-[var(--color-neutral-600)]">{order.delivery_notes}</span>
                </div>
              )}
              {(order.fulfillment_type === "pickup" || order.fulfillment_type === "curbside") && order.pickup_notes && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-neutral-500)]">Arrival / pickup notes</span>
                  <span className="italic text-[var(--color-neutral-600)]">{order.pickup_notes}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-neutral-500)]">Subtotal</span>
                <span className="font-medium">${(order.total - (order.tax || 0) - (order.delivery_fee || 0) - (order.tip_amount || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-neutral-500)]">Delivery Fee</span>
                <span className="font-medium">{order.delivery_fee > 0 ? `${order.delivery_fee.toFixed(2)}` : "Free"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-neutral-500)]">Tax</span>
                <span className="font-medium">${(order.tax || 0).toFixed(2)}</span>
              </div>
              {(order.tip_amount || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-neutral-500)]">{order.fulfillment_type === "pickup" || order.fulfillment_type === "curbside" ? "Tip (100% to store)" : "Tip (100% to delivery staff)"}</span>
                  <span className="font-medium">${(order.tip_amount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-[var(--color-neutral-200)] pt-3 flex justify-between">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg gradient-text-green">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Items */}
        {items.length > 0 && (
          <Card padding="lg">
            <CardHeader>
              <h2 className="text-lg font-[var(--font-heading)] text-[var(--color-neutral-800)] flex items-center gap-2">
                <Icon name="package" size={18} /> Items
              </h2>
            </CardHeader>
            <CardBody>
              <div className="divide-y divide-[var(--color-neutral-200)]">
                {items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between py-2.5 animate-cart-slide" style={{ animationDelay: `${i * 50}ms` }}>
                    <div>
                      <p className="font-medium text-[var(--color-neutral-800)]">{item.product_name}</p>
                      <p className="text-sm text-[var(--color-neutral-400)]">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">${(Number(item.unit_price) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        <p className="text-center text-xs text-[var(--color-neutral-400)] mt-6">
          Sold and delivered by {order.customer_name || "the licensed dispensary"} — a licensed retailer. GreenExpress provides the ordering and tracking software.
        </p>

        {/* Actions */}
        <div className="mt-8 text-center">
          <Link to="/dispensaries">
            <Button variant="outline" className="inline-flex items-center gap-2"><Icon name="leaf" size={16} /> Browse More</Button>
          </Link>
        </div>
      </main>

      {/* Unified chat — order-scoped thread with dispensary + delivery staff */}
      <ChatWidget
        orderId={id}
        title={`Order #${id.slice(0, 8)}`}
        subtitle="Dispensary · Delivery staff · Support"
        compact
      />
      <SiteFooter />
    </div>
  );
}
