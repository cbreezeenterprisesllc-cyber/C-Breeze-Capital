import { useState } from "react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { useCart } from "./CartStore";

export interface Product {
  id: string;
  name: string;
  price: number;
  thc: string;
  cbd?: string;
  category: "Flower" | "Edible" | "Tincture" | "Vape" | "Topical" | "Pre-Roll";
  strain?: "Indica" | "Sativa" | "Hybrid";
  description?: string;
  effects?: string[];
  image?: string;
  dispensaryId: string;
  dispensaryName: string;
  inStock?: boolean;
}

interface ProductCardProps {
  product: Product;
  variant?: "compact" | "detail";
  onSelect?: (product: Product) => void;
}

const categoryColors: Record<string, string> = {
  Flower: "primary",
  Edible: "accent",
  Tincture: "info",
  Vape: "warning",
  Topical: "success",
  "Pre-Roll": "primary",
};

const strainBadgeVariant: Record<string, "indica" | "sativa" | "hybrid"> = {
  Indica: "indica",
  Sativa: "sativa",
  Hybrid: "hybrid",
};

const categoryGradients: Record<string, string> = {
  Flower: "from-[var(--color-primary-600)] to-[var(--color-primary-400)]",
  Edible: "from-[var(--color-amber-500)] to-[var(--color-amber-300)]",
  Tincture: "from-[var(--color-purple-500)] to-[var(--color-purple-400)]",
  Vape: "from-[var(--color-magenta-500)] to-[var(--color-magenta-400)]",
  Topical: "from-[var(--color-lime-500)] to-[var(--color-primary-400)]",
  "Pre-Roll": "from-[var(--color-primary-700)] to-[var(--color-primary-500)]",
};

export function ProductCard({ product, variant = "compact", onSelect }: ProductCardProps) {
  const { addItem, itemCount } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAdding(true);
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      thc: product.thc,
      dispensaryName: product.dispensaryName,
      dispensaryId: product.dispensaryId,
    });
    setTimeout(() => setAdding(false), 400);
  };

  if (variant === "detail") {
    return (
      <div className="bg-[var(--surface-primary)] rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] shadow-sm overflow-hidden animate-fade-in">
        {/* Image */}
        <div className={`aspect-[16/9] bg-gradient-to-br ${categoryGradients[product.category] || "from-[var(--color-primary-100)] to-[var(--color-primary-200)]"} flex items-center justify-center relative overflow-hidden`}>
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white/60 font-[var(--font-heading)] text-2xl opacity-70">
              {product.category}
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant={categoryColors[product.category] as any} size="sm" glow>
                {product.category}
              </Badge>
              <h1 className="mt-2 font-[var(--font-heading)] text-2xl font-bold text-[var(--color-neutral-800)]">
                {product.name}
              </h1>
              <a
                href={`/dispensaries/${product.dispensaryId}`}
                className="text-sm text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] transition-colors"
              >
                {product.dispensaryName}
              </a>
            </div>
            <span className="text-2xl font-bold gradient-text-green">
              ${product.price.toFixed(2)}
            </span>
          </div>

          {/* THC/CBD Chips */}
          <div className="flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-100)] px-3 py-1 text-sm font-medium text-[var(--color-primary-800)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-500)] animate-pulse" />
              THC {product.thc}
            </span>
            {product.cbd && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-amber-500)]/20 px-3 py-1 text-sm font-medium text-[var(--color-amber-600)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-amber-500)]" />
                CBD {product.cbd}
              </span>
            )}
            {product.strain && (
              <Badge variant={strainBadgeVariant[product.strain]} size="sm">{product.strain}</Badge>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-[var(--color-neutral-600)] leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Effects */}
          {product.effects && product.effects.length > 0 && (
            <div>
              <p className="text-sm font-medium text-[var(--color-neutral-700)] mb-2">Effects</p>
              <div className="flex flex-wrap gap-1.5">
                {product.effects.map((effect) => (
                  <span
                    key={effect}
                    className="rounded-full border border-[var(--color-neutral-200)] px-3 py-1 text-xs text-[var(--color-neutral-600)] bg-[var(--color-neutral-50)] hover:border-[var(--color-primary-200)] hover:text-[var(--color-primary-700)] transition-colors"
                  >
                    {effect}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <div className="sticky bottom-0 pt-4 border-t border-[var(--color-neutral-200)] flex items-center gap-4">
            <AddToCartButton productId={product.id} onAdd={handleAdd} adding={adding} />
          </div>
        </div>
      </div>
    );
  }

  // Compact variant
  return (
    <div
      className="flex items-center gap-4 bg-[var(--surface-primary)] rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] p-3 shadow-sm transition-all duration-[var(--transition-base)] hover:shadow-lg hover:-translate-y-1 hover:border-[var(--color-primary-200)] cursor-pointer active:scale-[0.99]"
      onClick={() => onSelect?.(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(product); } }}
    >
      {/* Image placeholder */}
      <div className={`relative w-16 h-16 shrink-0 rounded-[var(--radius-lg)] bg-gradient-to-br ${categoryGradients[product.category] || "from-[var(--color-primary-100)] to-[var(--color-primary-200)]"} flex items-center justify-center overflow-hidden`}>
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[10px] font-medium text-white/70">
            {product.category}
          </span>
        )}
        {/* Type label overlay */}
        <span className="absolute bottom-0 left-0 right-0 bg-black/40 text-[10px] text-white text-center py-0.5 font-medium backdrop-blur-sm">
          {product.category}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--color-neutral-800)] truncate">
          {product.name}
        </p>
        <p className="text-sm text-[var(--color-primary-600)] font-medium">
          THC: {product.thc}
        </p>
        {product.strain && (
          <p className="text-xs text-[var(--color-neutral-400)] italic">
            {product.strain}
          </p>
        )}
      </div>

      {/* Price + Add */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="font-bold gradient-text-green text-lg">
          ${product.price.toFixed(2)}
        </span>
        <button
          onClick={handleAdd}
          disabled={product.inStock === false}
          className={`inline-flex items-center justify-center rounded-[var(--radius-md)] px-4 py-1.5 text-sm font-medium text-white transition-all active:scale-[0.93] disabled:opacity-50 disabled:cursor-not-allowed ${adding ? "bg-[var(--color-primary-500)] scale-110" : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)] hover:shadow-md"}`}
        >
          {adding ? "✓" : "Add"}
        </button>
      </div>
    </div>
  );
}

/* ── Add to Cart Button with qty feedback ────────────────── */
function AddToCartButton({
  productId,
  onAdd,
  adding,
}: {
  productId: string;
  onAdd: (e: React.MouseEvent) => void;
  adding: boolean;
}) {
  const { state, updateQuantity } = useCart();
  const item = state.items.find((i) => i.productId === productId);

  if (item && item.quantity > 0) {
    return (
      <div className="flex items-center gap-3 animate-cart-slide">
        <div className="flex items-center rounded-[var(--radius-md)] border border-[var(--color-primary-200)] overflow-hidden shadow-sm">
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateQuantity(productId, item.quantity - 1);
            }}
            className="w-9 h-9 flex items-center justify-center text-[var(--color-primary-700)] hover:bg-[var(--color-primary-100)] transition-colors"
          >
            −
          </button>
          <span className="w-10 text-center font-semibold text-[var(--color-primary-800)] text-sm">
            {item.quantity}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateQuantity(productId, item.quantity + 1);
            }}
            className="w-9 h-9 flex items-center justify-center text-[var(--color-primary-700)] hover:bg-[var(--color-primary-100)] transition-colors"
          >
            +
          </button>
        </div>
        <span className="font-semibold gradient-text-green">
          ${(item.quantity * (item.price || 0)).toFixed(2)}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={onAdd}
      disabled={adding}
      className={`inline-flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.95] ${adding ? "bg-[var(--color-primary-500)] scale-105" : "bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-600)] hover:shadow-md"}`}
    >
      <svg className={`w-4 h-4 transition-transform ${adding ? "rotate-90 scale-110" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      {adding ? "Added!" : "Add to Cart"}
    </button>
  );
}