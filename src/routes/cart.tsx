import { createFileRoute, Link } from "@tanstack/react-router";
import { TopbarNav } from "~/components/Navigation";
import { Button } from "~/components/Button";
import { Card, CardHeader, CardBody, CardFooter } from "~/components/Card";
import { Icon } from "~/components/Icon";
import { useCart } from "~/context/CartContext";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { items, itemCount, subtotal, tenantId, tenantName, removeItem, updateQuantity, clearCart } = useCart();

  const deliveryFee = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  return (
    <div className="min-h-dvh bg-[var(--surface-secondary)]">
      <TopbarNav
        branding={{ title: "GreenExpress" }}
        items={[
          { label: "Home", href: "/" },
          { label: "Dispensaries", href: "/dispensaries" },
          { label: `Cart (${itemCount})`, href: "/cart", active: true },
        ]}
      />

      <main className="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-[var(--font-heading)] gradient-text-green flex items-center gap-2">
            <Icon name="cart" size={32} /> Shopping Cart
          </h1>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-[var(--color-error)] hover:bg-[var(--color-error)]/10 flex items-center gap-1">
              <Icon name="trash" size={16} /> Clear All
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 animate-fade-in-up">
            <div className="mb-4 flex justify-center"><Icon name="cart" size={64} /></div>
            <h2 className="text-2xl font-[var(--font-heading)] text-[var(--color-neutral-600)] mb-2">
              Your cart is empty
            </h2>
            <p className="text-[var(--color-neutral-500)] mb-6">
              Browse dispensaries to add products.
            </p>
            <Link to="/dispensaries">
              <Button variant="neon" className="inline-flex items-center gap-2"><Icon name="leaf" size={18} /> Browse Dispensaries</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, i) => (
                <Card key={item.productId} padding="md" className="animate-cart-slide" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-primary-300)] flex items-center justify-center shrink-0">
                      <Icon name="leaf" size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-[var(--font-heading)] text-[var(--text-body-lg)] text-[var(--color-neutral-800)] truncate">
                        {item.name}
                      </h3>
                      {item.thcContent && (
                        <p className="text-sm text-[var(--color-primary-600)]">THC: {item.thcContent}</p>
                      )}
                      <p className="text-sm text-[var(--color-neutral-400)]">{item.tenantName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        className="w-8 h-8 rounded-full border border-[var(--color-primary-200)] flex items-center justify-center text-sm hover:bg-[var(--color-primary-100)] transition-colors"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="font-semibold w-6 text-center text-[var(--color-primary-800)]">{item.quantity}</span>
                      <button
                        className="w-8 h-8 rounded-full border border-[var(--color-primary-200)] flex items-center justify-center text-sm hover:bg-[var(--color-primary-100)] transition-colors"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="font-bold gradient-text-green">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        className="text-xs text-[var(--color-error)] hover:underline hover:font-semibold transition-all"
                        onClick={() => removeItem(item.productId)}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <Card padding="lg" glow>
                <CardHeader>
                  <h2 className="text-[var(--text-h4)] font-[var(--font-heading)] text-[var(--color-neutral-800)] flex items-center gap-2">
                    <Icon name="clipboard" size={18} /> Order Summary
                  </h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-neutral-500)]">Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-neutral-500)]">Delivery Fee</span>
                      <span className="font-medium">{deliveryFee === 0 ? <span className="text-[var(--color-success)] font-semibold">Free</span> : `${deliveryFee.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-neutral-500)]">Tax (8%)</span>
                      <span className="font-medium">${tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-[var(--color-neutral-200)] pt-3 flex justify-between">
                      <span className="font-bold text-[var(--color-neutral-800)]">Total</span>
                      <span className="font-bold text-xl gradient-text-green">${total.toFixed(2)}</span>
                    </div>
                    {subtotal < 50 && (
                      <p className="text-xs text-[var(--color-amber-600)] bg-[var(--color-amber-500)]/10 px-3 py-2 rounded-lg mt-2 flex items-center gap-1">
                        <Icon name="lightbulb" size={14} /> Add ${(50 - subtotal).toFixed(2)} more for <strong>free delivery</strong>
                      </p>
                    )}
                  </div>
                </CardBody>
                <CardFooter>
                  <Link to="/checkout" className="block">
                    <Button size="lg" fullWidth variant="neon" className="inline-flex items-center justify-center gap-2">
                      <Icon name="rocket" size={18} /> Proceed to Checkout
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}