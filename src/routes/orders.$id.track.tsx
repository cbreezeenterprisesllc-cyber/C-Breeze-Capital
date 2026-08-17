import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopbarNav } from "~/components/Navigation";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Icon } from "~/components/Icon";
import { ChatWidget } from "~/components/ChatWidget";
import { SiteFooter } from "~/components/SiteFooter";

export const Route = createFileRoute("/orders/$id/track")({
  component: TrackOrder,
});

const STATUS_STEPS = ["pending", "confirmed", "preparing", "in_transit", "delivered"];

const STATUS_LABELS: Record<string, string> = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_ICONS: Record<string, any> = {
  pending: <Icon name="pencil" size={14} />,
  confirmed: <Icon name="check" size={14} />,
  preparing: <Icon name="chef" size={14} />,
  in_transit: <Icon name="car" size={14} />,
  delivered: <Icon name="celebration" size={14} />,
  cancelled: <Icon name="cross" size={14} />,
};

function TrackOrder() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch order:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [id]);

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
            <p className="text-[var(--color-neutral-500)] mb-6">This order doesn't exist or has been removed.</p>
            <Link to="/dispensaries"><Button variant="neon" className="inline-flex items-center gap-2"><Icon name="leaf" size={16} /> Browse Dispensaries</Button></Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === "cancelled";
  const items: any[] = order.items || [];

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
            variant={isCancelled ? "error" : currentStepIndex >= 4 ? "success" : currentStepIndex >= 2 ? "accent" : "primary"}
            size="md"
            dot
            className="mt-2 inline-flex items-center gap-1"
          >
            {STATUS_LABELS[order.status] || order.status} {STATUS_ICONS[order.status]}
          </Badge>
        </div>

        {/* Progress Bar */}
        {!isCancelled && (
          <Card padding="lg" className="mb-8">
            <CardBody>
              <div className="flex items-center justify-between mb-6">
                {STATUS_STEPS.map((status, i) => {
                  const completed = i < currentStepIndex;
                  const active = i === currentStepIndex;
                  return (
                    <div key={status} className="flex flex-col items-center relative flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-[var(--transition-slow)] ${
                        completed ? "bg-[var(--color-success)] text-white shadow-md" :
                        active ? "bg-[var(--color-primary-500)] text-white shadow-[var(--glow-green)] scale-110" :
                        "bg-[var(--color-neutral-200)] text-[var(--color-neutral-500)]"
                      }`}>
                        {completed ? "✓" : active ? "●" : "○"}
                      </div>
                      <p className={`text-xs mt-2 font-medium ${active ? "text-[var(--color-primary-700)]" : completed ? "text-[var(--color-success)]" : "text-[var(--color-neutral-400)]"}`}>
                        {STATUS_LABELS[status]}
                      </p>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`absolute top-5 left-[60%] w-[80%] h-0.5 ${completed ? "bg-[var(--color-success)]" : "bg-[var(--color-neutral-200)]"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              {order.status === "in_transit" && (
                <div className="text-center text-sm text-[var(--color-primary-600)] animate-pulse flex items-center justify-center gap-1">
                  <Icon name="car" size={16} /> Your driver is on the way!
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
                <span className="text-[var(--color-neutral-500)]">Delivery Address</span>
                <span className="font-medium text-right max-w-[200px]">{order.delivery_address}</span>
              </div>
              {order.delivery_notes && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-neutral-500)]">Notes</span>
                  <span className="italic text-[var(--color-neutral-600)]">{order.delivery_notes}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-neutral-500)]">Subtotal</span>
                <span className="font-medium">${(order.total - (order.tax || 0) - (order.delivery_fee || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-neutral-500)]">Delivery Fee</span>
                <span className="font-medium">{order.delivery_fee > 0 ? `${order.delivery_fee.toFixed(2)}` : "Free"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-neutral-500)]">Tax</span>
                <span className="font-medium">${(order.tax || 0).toFixed(2)}</span>
              </div>
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

        {/* Actions */}
        <div className="mt-8 text-center">
          <Link to="/dispensaries">
            <Button variant="outline" className="inline-flex items-center gap-2"><Icon name="leaf" size={16} /> Browse More</Button>
          </Link>
        </div>
      </main>

      {/* Unified chat — order-scoped thread with dispensary + assigned driver */}
      <ChatWidget
        orderId={id}
        title={`Order #${id.slice(0, 8)}`}
        subtitle="Dispensary · Driver · Support"
        compact
      />
      <SiteFooter />
    </div>
  );
}
