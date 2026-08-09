import { useCart } from "./CartStore";
import { Button } from "./Button";

export function CartFloatingBar() {
  const { itemCount, subtotal, openCart } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[var(--z-sticky)] p-4 pointer-events-none">
      <button
        onClick={openCart}
        className="pointer-events-auto mx-auto flex w-full max-w-lg items-center justify-between rounded-[var(--radius-lg)] bg-[--color-primary-900] px-5 py-3.5 text-white shadow-lg transition-all hover:bg-[--color-primary-800] active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
          <span className="font-medium">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold">${subtotal.toFixed(2)}</span>
          <span className="text-sm text-white/60">View Cart →</span>
        </div>
      </button>
    </div>
  );
}

export function CartDrawer() {
  const { state, closeCart, removeItem, updateQuantity, subtotal, itemCount } = useCart();
  const deliveryFee = 5.0;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  if (!state.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-overlay)]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeCart}
      />

      {/* Panel */}
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-[var(--surface-primary)] shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-neutral-200)]">
          <h2 className="font-[var(--font-heading)] text-lg font-bold text-[var(--color-neutral-800)]">
            Your Cart {itemCount > 0 && `(${itemCount})`}
          </h2>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items or Empty */}
        {state.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[var(--color-primary-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--color-neutral-700)]">Your cart is empty</h3>
            <p className="mt-1 text-sm text-[var(--color-neutral-500)]">Add some products to get started</p>
            <button
              onClick={closeCart}
              className="mt-4 rounded-[var(--radius-md)] bg-[--color-primary-700] px-5 py-2 text-sm font-medium text-white hover:bg-[--color-primary-600]"
            >
              Browse products
            </button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {state.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 bg-[var(--color-neutral-50)] rounded-[var(--radius-md)] p-3"
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 shrink-0 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-primary-200)] flex items-center justify-center">
                    <span className="text-xs font-medium text-[var(--color-primary-600)]">
                      {item.name.charAt(0)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-neutral-800)] truncate">
                      {item.name}
                    </p>
                    {item.dispensaryName && (
                      <p className="text-xs text-[var(--color-neutral-500)]">{item.dispensaryName}</p>
                    )}
                    <p className="text-xs text-[var(--color-primary-600)] font-medium">
                      ${item.price.toFixed(2)} ea
                    </p>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center rounded-[var(--radius-sm)] border border-[var(--color-neutral-200)] overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center text-xs text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)]"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-xs font-medium text-[var(--color-neutral-800)]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-xs text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)]"
                    >
                      +
                    </button>
                  </div>

                  {/* Line Total */}
                  <span className="text-sm font-semibold text-[var(--color-primary-800)] w-16 text-right">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-1 text-[var(--color-neutral-400)] hover:text-[var(--color-error)] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t border-[var(--color-neutral-200)] px-5 py-4 space-y-3">
              <div className="flex justify-between text-sm text-[var(--color-neutral-500)]">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-[var(--color-neutral-500)]">
                <span>Delivery fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-[var(--color-neutral-500)]">
                <span>Tax (est.)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-[var(--color-neutral-800)] pt-2 border-t border-[var(--color-neutral-200)]">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <a
                href="/checkout"
                onClick={closeCart}
                className="block w-full text-center rounded-[var(--radius-md)] bg-[--color-primary-700] px-5 py-3 text-sm font-semibold text-white hover:bg-[--color-primary-600] transition-colors"
              >
                Proceed to Checkout
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}