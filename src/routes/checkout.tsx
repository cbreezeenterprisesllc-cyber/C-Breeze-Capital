import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TopbarNav } from "~/components/Navigation";
import { Button } from "~/components/Button";
import { Card, CardHeader, CardBody, CardFooter } from "~/components/Card";
import { Input } from "~/components/Input";
import { Modal } from "~/components/Modal";
import { useCart } from "~/context/CartContext";
import { apiFetch } from "~/lib/api-config";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, tenantId, clearCart } = useCart();

  const [showAgeModal, setShowAgeModal] = useState(true);
  const [ageVerified, setAgeVerified] = useState(false);
  const [ageError, setAgeError] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderResult, setOrderResult] = useState<{ success: boolean; orderId?: string; error?: string } | null>(null);

  const deliveryFee = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

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
    if (!address.trim()) return;
    if (!tenantId || items.length === 0) return;
    setPlacing(true);
    try {
      const customerId = "anon-" + Date.now();
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
          deliveryAddress: address,
          deliveryNotes,
          deliveryFee,
          tax,
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
            <div className="text-5xl mb-4 animate-bounce-in">✅</div>
            <h1 className="text-[var(--text-h2)] font-[var(--font-heading)] gradient-text-green mb-2">
              Order Placed!
            </h1>
            <p className="text-[var(--color-neutral-500)] mb-6">
              Your order is being prepared. Track it in real-time.
            </p>
            <Link to="/orders/$id/track" params={{ id: orderResult.orderId }}>
              <Button size="lg" variant="neon">🚀 Track Delivery</Button>
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
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-[var(--text-h3)] font-[var(--font-heading)] text-[var(--color-neutral-600)] mb-2">
              Your cart is empty
            </h2>
            <Link to="/dispensaries"><Button variant="neon">🌿 Browse Dispensaries</Button></Link>
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
      <Modal open={showAgeModal} onClose={() => {}} title="🔞 Age Verification Required" size="sm">
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
          <Button fullWidth variant="neon" onClick={handleAgeVerify}>
            ✅ Verify Age
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
          {/* Delivery Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card padding="lg">
              <CardHeader>
                <h2 className="text-[var(--text-h4)] font-[var(--font-heading)] text-[var(--color-neutral-800)]">
                  📍 Delivery Details
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Delivery Address"
                  placeholder="123 Main St, Apt 4, City, State ZIP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  error={!address && orderResult ? "Address is required" : ""}
                />
                <Input
                  label="Delivery Notes (optional)"
                  placeholder="Gate code, landmark, etc."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                />
              </CardBody>
            </Card>

            {/* Order Items */}
            <Card padding="lg">
              <CardHeader>
                <h2 className="text-[var(--text-h4)] font-[var(--font-heading)] text-[var(--color-neutral-800)]">
                  🛍️ Items
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
          </div>

          {/* Summary */}
          <div>
            <Card padding="lg" glow>
              <CardHeader>
                <h2 className="text-[var(--text-h4)] font-[var(--font-heading)] text-[var(--color-neutral-800)]">
                  📋 Summary
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-neutral-500)]">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-neutral-500)]">Delivery</span>
                    <span className="font-medium">{deliveryFee === 0 ? <span className="text-[var(--color-success)] font-semibold">Free 🎉</span> : `$${deliveryFee.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-neutral-500)]">Tax</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-[var(--color-neutral-200)] pt-3 flex justify-between">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-xl gradient-text-green">${total.toFixed(2)}</span>
                  </div>
                  {subtotal < 50 && (
                    <p className="text-xs text-[var(--color-amber-600)] bg-[var(--color-amber-500)]/10 px-3 py-2 rounded-lg mt-2">
                      💡 Add ${(50 - subtotal).toFixed(2)} more for <strong>free delivery</strong>!
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
                  disabled={!ageVerified || !address.trim()}
                >
                  🚀 Place Order — ${total.toFixed(2)}
                </Button>
                {orderResult && !orderResult.success && (
                  <p className="text-sm text-[var(--color-error)] mt-2 animate-fade-in">{orderResult.error}</p>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}