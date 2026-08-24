import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopbarNav } from "~/components/Navigation";
import { Button } from "~/components/Button";
import { Card, CardHeader, CardBody, CardFooter } from "~/components/Card";
import { Input } from "~/components/Input";
import { Modal } from "~/components/Modal";
import { Icon } from "~/components/Icon";
import { useCart } from "~/context/CartContext";
import { apiFetch } from "~/lib/api-config";
import { SiteFooter } from "~/components/SiteFooter";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, tenantId, tenantName, clearCart } = useCart();

  const [showAgeModal, setShowAgeModal] = useState(true);
  const [ageVerified, setAgeVerified] = useState(false);
  const [ageError, setAgeError] = useState("");
  const [birthDate, setBirthDate] = useState("");
  // Fulfillment: delivery (courier) / pickup (at store) / curbside (bring it to my car).
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup" | "curbside">("delivery");
  const [address, setAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");
  const [pickupVehicle, setPickupVehicle] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderResult, setOrderResult] = useState<{ success: boolean; orderId?: string; error?: string } | null>(null);
  // Scheduled delivery / pickup — "asap" is the default; "schedule" lets the
  // customer pick one of the store's schedulable windows (within operating hours).
  const [scheduleType, setScheduleType] = useState<"asap" | "schedule">("asap");
  const [scheduledAt, setScheduledAt] = useState("");
  const [windows, setWindows] = useState<{ start: string; label: string }[]>([]);
  useEffect(() => {
    let cancelled = false;
    if (!tenantId) return;
    (async () => {
      try {
        const res = await apiFetch(`/api/tenants/${tenantId}/delivery-windows`);
        const payload = await res.json();
        if (!cancelled && payload.success && payload.data?.enabled) {
          setWindows(payload.data.windows || []);
          // Reset to ASAP if scheduling is disabled / no windows available.
          if (!(payload.data.windows || []).length) setScheduleType("asap");
        }
      } catch {
        /* scheduling unavailable — stay on ASAP */
      }
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  // Driver tip — drivers keep 100% of tips, so this is genuinely passed through.
  const TIP_PRESETS = [10, 15, 20, 25];
  const [tipPercent, setTipPercent] = useState(0); // 0 = none
  const [customTip, setCustomTip] = useState("");

  const isPickup = fulfillment !== "delivery";
  // Delivery fee is waived for pickup and curbside (no courier is used).
  const deliveryFee = isPickup ? 0 : subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const tipAmount =
    customTip !== "" ? Math.max(0, Number(customTip) || 0)
    : Math.round(subtotal * (tipPercent / 100) * 100) / 100;
  const total = subtotal + deliveryFee + tax + tipAmount;

  const handleAgeVerify = () => {
    if (!birthDate) {
      setAgeError("Please enter your date of birth.");
      return;
    }
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    if (age >= 21) {
      setAgeVerified(true);
      setShowAgeModal(false);
      setAgeError("");
    } else {
      setAgeError("You must be 21 or older to order.");
    }
  };

  const handlePlaceOrder = async () => {
    if (!tenantId || items.length === 0) return;
    if (fulfillment === "delivery" && !address.trim()) return;
    if (scheduleType === "schedule" && !scheduledAt) {
      setOrderResult({ success: false, error: "Please pick a delivery window." });
      return;
    }
    setPlacing(true);
    try {
      const customerId = "anon-" + Date.now();
      // delivery_address is NOT NULL; for pickup/curbside store the store name so the
      // row stays valid — the customer is coming to the dispensary instead.
      const resolvedAddress = isPickup && address.trim() === "" ? `${tenantName} (${fulfillment})` : address;
      const res = await apiFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          customerId,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          fulfillmentType: fulfillment,
          deliveryAddress: resolvedAddress,
          deliveryNotes,
          pickupNotes,
          pickupVehicle,
          scheduledDeliveryAt: scheduleType === "schedule" && scheduledAt ? scheduledAt : undefined,
          deliveryFee,
          tax,
          tip: tipAmount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const orderId = data.data.id;
        clearCart();

        // Redirect to Stripe Checkout
        try {
          const checkoutRes = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              tenantId,
              customerId,
              total: (total).toFixed(2),
            }),
          });
          const checkoutData = await checkoutRes.json();
          if (checkoutData.success && checkoutData.data.url) {
            window.location.href = checkoutData.data.url;
            return;
          }
        } catch {
          // Stripe checkout failed — fall through to order confirmation
        }

        setOrderResult({ success: true, orderId });
      } else {
        setOrderResult({ success: false, error: data.error || "Failed to place order" });
      }
    } catch (err) {
      setOrderResult({ success: false, error: "Network error. Please try again." });
    } finally {
      setPlacing(false);
    }
  };

  if (orderResult?.success && orderResult.orderId) {
    return (
      <div className="min-h-dvh bg-[var(--surface-secondary)] flex items-center justify-center">
        <Card padding="lg" className="max-w-md w-full text-center animate-scale-in">
          <CardBody>
            <div className="mb-4 flex justify-center"><Icon name="check" size={56} /></div>
            <h1 className="text-[var(--text-h2)] font-[var(--font-heading)] gradient-text-green mb-2">
              Order Placed!
            </h1>
            <p className="text-[var(--color-neutral-500)] mb-6">
              Your order is being prepared. Track it in real-time.
            </p>
            <Link to="/orders/$id/track" params={{ id: orderResult.orderId }}>
              <Button size="lg" variant="neon" className="inline-flex items-center gap-2"><Icon name="rocket" size={18} /> Track Delivery</Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (items.length === 0 && !orderResult) {
    return (
      <div className="min-h-dvh bg-[var(--surface-secondary)] flex items-center justify-center">
        <Card padding="lg" className="max-w-md w-full text-center animate-fade-in">
          <CardBody>
            <div className="mb-4 flex justify-center"><Icon name="cart" size={56} /></div>
            <h2 className="text-[var(--text-h3)] font-[var(--font-heading)] text-[var(--color-neutral-600)] mb-2">
              Your cart is empty
            </h2>
            <Link to="/dispensaries"><Button variant="neon" className="inline-flex items-center gap-2"><Icon name="leaf" size={18} /> Browse Dispensaries</Button></Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--surface-secondary)]">
      <TopbarNav
        branding={{ title: "GreenExpress" }}
        items={[
          { label: "Home", href: "/" },
          { label: "Cart", href: "/cart" },
          { label: "Checkout", active: true },
        ]}
      />

      {/* Age Verification Modal */}
      <Modal open={showAgeModal} onClose={() => {}} title={<span className="flex items-center gap-2"><Icon name="age" size={20} /> Age Verification Required</span>} size="sm">
        <div className="space-y-4 animate-scale-in">
          <p className="text-sm text-[var(--color-neutral-500)]">
            You must be <strong>21 or older</strong> to order cannabis products. Please verify your age.
          </p>
          <Input
            type="date"
            label="Date of Birth"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            error={ageError}
          />
          <Button fullWidth variant="neon" onClick={handleAgeVerify} className="inline-flex items-center justify-center gap-2">
            <Icon name="check" size={18} /> Verify Age
          </Button>
          <p className="text-xs text-[var(--color-neutral-400)] text-center">
            By proceeding, you confirm you are 21+ and agree to our terms.
          </p>
        </div>
      </Modal>

      <main className="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
        <h1 className="text-4xl font-[var(--font-heading)] gradient-text-green mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Fulfillment — delivery, pickup, or curbside */}
          <div className="lg:col-span-2 space-y-6">
            <Card padding="lg">
              <CardHeader>
                <h2 className="text-[var(--text-h4)] font-[var(--font-heading)] text-[var(--color-neutral-800)] flex items-center gap-2">
                  <Icon name="shop" size={18} /> How would you like your order?
                </h2>
              </CardHeader>
              <CardBody className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFulfillment("delivery")}
                    className={`rounded-xl border-2 p-4 text-left transition-colors ${fulfillment === "delivery" ? "bg-[var(--color-primary-50)] border-[var(--color-primary-600)]" : "bg-white border-[var(--color-neutral-200)] hover:border-[var(--color-primary-400)]"}`}
                  >
                    <p className="font-semibold text-[var(--color-neutral-800)]">Delivery</p>
                    <p className="text-xs text-[var(--color-neutral-500)] mt-1">Courier brings it to your door</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillment("pickup")}
                    className={`rounded-xl border-2 p-4 text-left transition-colors ${fulfillment === "pickup" ? "bg-[var(--color-primary-50)] border-[var(--color-primary-600)]" : "bg-white border-[var(--color-neutral-200)] hover:border-[var(--color-primary-400)]"}`}
                  >
                    <p className="font-semibold text-[var(--color-neutral-800)]">Pickup</p>
                    <p className="text-xs text-[var(--color-neutral-500)] mt-1">Pick it up at the dispensary</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillment("curbside")}
                    className={`rounded-xl border-2 p-4 text-left transition-colors ${fulfillment === "curbside" ? "bg-[var(--color-primary-50)] border-[var(--color-primary-600)]" : "bg-white border-[var(--color-neutral-200)] hover:border-[var(--color-primary-400)]"}`}
                  >
                    <p className="font-semibold text-[var(--color-neutral-800)]">Curbside</p>
                    <p className="text-xs text-[var(--color-neutral-500)] mt-1">We bring it to your car</p>
                  </button>
                </div>
                {fulfillment === "delivery" && (
                  <div className="space-y-4 animate-fade-in">
                    <Input label="Delivery Address" placeholder="123 Main St, Apt 4, City, State ZIP" value={address} onChange={(e) => setAddress(e.target.value)} error={!address && orderResult ? "Address is required" : ""} />
                    <Input label="Delivery Notes (optional)" placeholder="Gate code, landmark, etc." value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} />
                  </div>
                )}
                {fulfillment === "pickup" && (
                  <div className="space-y-4 animate-fade-in text-sm">
                    <div className="rounded-lg bg-[var(--color-neutral-50)] border border-[var(--color-neutral-200)] p-4">
                      <p className="font-semibold text-[var(--color-neutral-800)] mb-1">Pick up at {tenantName}</p>
                      <p className="text-[var(--color-neutral-500)] leading-relaxed">Head to the dispensary counter with a valid government-issued ID. Your order will be ready once the store marks it ready.</p>
                    </div>
                    <Input label="Pickup Notes (optional)" placeholder="Contact name, preferred time, etc." value={pickupNotes} onChange={(e) => setPickupNotes(e.target.value)} />
                  </div>
                )}
                {fulfillment === "curbside" && (
                  <div className="space-y-4 animate-fade-in text-sm">
                    <div className="rounded-lg bg-[var(--color-neutral-50)] border border-[var(--color-neutral-200)] p-4">
                      <p className="font-semibold text-[var(--color-neutral-800)] mb-1">Curbside at {tenantName}</p>
                      <p className="text-[var(--color-neutral-500)] leading-relaxed">Pull into a curbside spot and let us know you have arrived — we'll bring the order to your car. Have your ID ready.</p>
                    </div>
                    <Input label="Vehicle / Parking Spot" placeholder="e.g. White Toyota Camry, spot 4" value={pickupVehicle} onChange={(e) => setPickupVehicle(e.target.value)} />
                    <Input label="Arrival / Pickup Notes (optional)" placeholder="Call when I'm out front" value={pickupNotes} onChange={(e) => setPickupNotes(e.target.value)} />
                  </div>
                )}
                {/* Schedule — only shown when the store offers schedulable windows */}
                {windows.length > 0 && (
                  <div className="space-y-3 animate-fade-in border-t border-[var(--color-neutral-200)] pt-5">
                    <h3 className="text-sm font-semibold text-[var(--color-neutral-800)]">
                      <Icon name="clock" size={16} className="inline mr-1" />
                      {isPickup ? "When do you want to pick it up?" : "When should it arrive?"}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => { setScheduleType("asap"); setScheduledAt(""); }}
                        className={`rounded-xl border-2 p-3 text-left transition-colors ${scheduleType === "asap" ? "bg-[var(--color-primary-50)] border-[var(--color-primary-600)]" : "bg-white border-[var(--color-neutral-200)] hover:border-[var(--color-primary-400)]"}`}
                      >
                        <p className="font-semibold text-[var(--color-neutral-800)] text-sm">As soon as possible</p>
                        <p className="text-xs text-[var(--color-neutral-500)] mt-0.5">{isPickup ? "Start prep right away" : "Fastest delivery"}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleType("schedule")}
                        className={`rounded-xl border-2 p-3 text-left transition-colors ${scheduleType === "schedule" ? "bg-[var(--color-primary-50)] border-[var(--color-primary-600)]" : "bg-white border-[var(--color-neutral-200)] hover:border-[var(--color-primary-400)]"}`}
                      >
                        <p className="font-semibold text-[var(--color-neutral-800)] text-sm">Schedule for later</p>
                        <p className="text-xs text-[var(--color-neutral-500)] mt-0.5">Pick a delivery window</p>
                      </button>
                    </div>
                    {scheduleType === "schedule" && (
                      <div className="flex flex-wrap gap-2 animate-scale-in">
                        {windows.map((w) => (
                          <button
                            key={w.start}
                            type="button"
                            onClick={() => setScheduledAt(w.start)}
                            className={`px-3 py-2 rounded-full text-sm font-semibold border transition-colors ${scheduledAt === w.start ? "bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)]" : "bg-white text-[var(--color-neutral-700)] border-[var(--color-neutral-300)] hover:border-[var(--color-primary-400)]"}`}
                          >
                            {w.label}
                          </button>
                        ))}
                        {scheduledAt && (
                          <button
                            type="button"
                            onClick={() => setScheduledAt("")}
                            className="px-3 py-2 rounded-full text-sm font-medium text-[var(--color-neutral-500)] underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Order Items */}
            <Card padding="lg">
              <CardHeader>
                <h2 className="text-[var(--text-h4)] font-[var(--font-heading)] text-[var(--color-neutral-800)] flex items-center gap-2">
                  <Icon name="package" size={18} /> Items
                </h2>
              </CardHeader>
              <CardBody>
                <div className="divide-y divide-[var(--color-neutral-200)]">
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between py-3 animate-cart-slide">
                      <div>
                        <p className="font-medium text-[var(--color-neutral-800)]">{item.name}</p>
                        <p className="text-sm text-[var(--color-neutral-500)]">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold gradient-text-green">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Driver Tip */}
            <Card padding="lg">
              <CardHeader>
                <h2 className="text-[var(--text-h4)] font-[var(--font-heading)] text-[var(--color-neutral-800)] flex items-center gap-2">
                  <Icon name="dollars" size={18} /> Tip
                </h2>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-[var(--color-neutral-500)] mb-4">
                  <strong className="text-[var(--color-neutral-700)]">{isPickup ? "100% of your tip goes to the store team." : "100% of your tip goes to your driver."}</strong>{" "}
                  {isPickup ? "A thank-you for great service." : "A thank-you for a quick, careful delivery."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {TIP_PRESETS.map((p) => {
                    const active = customTip === "" && tipPercent === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => { setTipPercent(p); setCustomTip(""); }}
                        className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                          active
                            ? "bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)]"
                            : "bg-white text-[var(--color-neutral-700)] border-[var(--color-neutral-300)] hover:border-[var(--color-primary-400)]"
                        }`}
                      >
                        {p}%
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => { setTipPercent(0); setCustomTip(""); }}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                      customTip === "" && tipPercent === 0
                        ? "bg-[var(--color-neutral-700)] text-white border-[var(--color-neutral-700)]"
                        : "bg-white text-[var(--color-neutral-700)] border-[var(--color-neutral-300)] hover:border-[var(--color-primary-400)]"
                    }`}
                  >
                    No tip
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm text-[var(--color-neutral-500)]">Or custom amount:</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-neutral-400)]">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={customTip}
                      onChange={(e) => { setCustomTip(e.target.value); setTipPercent(0); }}
                      className="pl-7 w-32"
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card padding="lg" glow>
              <CardHeader>
                <h2 className="text-[var(--text-h4)] font-[var(--font-heading)] text-[var(--color-neutral-800)] flex items-center gap-2">
                  <Icon name="clipboard" size={18} /> Summary
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-neutral-500)]">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-neutral-500)]">{isPickup ? "Delivery (Free)" : "Delivery"}</span>
                    <span className="font-medium">{deliveryFee === 0 ? <span className="text-[var(--color-success)] font-semibold">Free</span> : `${deliveryFee.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-neutral-500)]">Tax</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-neutral-500)]">{isPickup ? "Tip (100% to store)" : "Tip (100% to driver)"}</span>
                    <span className="font-medium">{tipAmount > 0 ? `${tipAmount.toFixed(2)}` : <span className="text-[var(--color-neutral-400)]">—</span>}</span>
                  </div>
                  <div className="border-t border-[var(--color-neutral-200)] pt-3 flex justify-between">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-xl gradient-text-green">${total.toFixed(2)}</span>
                  </div>
                  {subtotal < 50 && (
                    <p className="text-xs text-[var(--color-amber-600)] bg-[var(--color-amber-500)]/10 px-3 py-2 rounded-lg mt-2 flex items-center gap-1">
                      <Icon name="lightbulb" size={14} /> Add ${(50 - subtotal).toFixed(2)} more for <strong>free delivery</strong>!
                    </p>
                  )}
                </div>
              </CardBody>
              <CardFooter>
                <Button
                  size="lg"
                  fullWidth
                  variant="neon"
                  onClick={handlePlaceOrder}
                  loading={placing}
                  disabled={!ageVerified || (fulfillment === "delivery" && !address.trim()) || (scheduleType === "schedule" && !scheduledAt)}
                  className="inline-flex items-center justify-center gap-2"
                >
                  <Icon name="rocket" size={18} /> Place Order — ${total.toFixed(2)}
                </Button>
                {orderResult && !orderResult.success && (
                  <p className="text-sm text-[var(--color-error)] mt-2 animate-fade-in">{orderResult.error}</p>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}