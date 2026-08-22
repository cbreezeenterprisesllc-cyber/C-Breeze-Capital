import { type ReactNode, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";

interface NavItem {
  label: string;
  href?: string;
  icon?: ReactNode;
  active?: boolean;
  onClick?: () => void;
  children?: NavItem[];
}

interface NavigationProps {
  items: NavItem[];
  variant?: "sidebar" | "topbar";
  branding?: {
    logo?: ReactNode;
    title?: string;
  };
  className?: string;
}

export function SidebarNav({
  items,
  branding,
  className = "",
}: {
  items: NavItem[];
  branding?: NavigationProps["branding"];
  className?: string;
}) {
  return (
    <nav
      className={[
        "flex flex-col h-full w-64 bg-[var(--color-primary-900)] text-white",
        className,
      ].join(" ")}
    >
      {/* Branding */}
      {branding && (
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          {branding.logo && (
            <div className="w-8 h-8 shrink-0">{branding.logo}</div>
          )}
          {branding.title && (
            <span className="font-[var(--font-heading)] text-lg font-bold tracking-tight gradient-text-amber">
              {branding.title}
            </span>
          )}
        </div>
      )}

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((item, i) => (
          <NavItemRow key={i} item={item} variant="sidebar" />
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10 text-xs text-white/40">
        <span className="inline-flex items-center gap-1">
          <span className="live-dot" />
          GreenExpress v1.0
        </span>
      </div>
    </nav>
  );
}

export function TopbarNav({
  items,
  branding,
  className = "",
}: {
  items: NavItem[];
  branding?: NavigationProps["branding"];
  className?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav
      className={[
        "relative flex items-center justify-between px-6 py-3",
        "bg-[var(--surface-primary)]/90 backdrop-blur-md border-b border-[var(--color-neutral-200)]",
        "sticky top-0 z-[var(--z-sticky)]",
        className,
      ].join(" ")}
    >
      {/* Branding */}
      {branding && (
        <a href="/" className="flex items-center gap-3 group">
          {branding.logo && (
            <div className="w-7 h-7 shrink-0 group-hover:scale-110 transition-transform">{branding.logo}</div>
          )}
          {branding.title && (
            <span className="font-[var(--font-heading)] text-lg font-bold text-[var(--color-primary-800)] group-hover:gradient-text-green transition-all">
              {branding.title}
            </span>
          )}
        </a>
      )}

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center gap-1">
        {items.map((item, i) => (
          <NavItemRow key={i} item={{ ...item, active: item.active ?? (item.href ? location.pathname === item.href : false) }} variant="topbar" />
        ))}
      </div>

      {/* Mobile Hamburger */}
      <button
        className="md:hidden p-2 text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] rounded-[var(--radius-md)] transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {mobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="animate-fade-in absolute top-full left-0 right-0 bg-[var(--surface-primary)] border-b border-[var(--color-neutral-200)] shadow-lg z-[var(--z-dropdown)] p-4 space-y-1 md:hidden">
          {items.map((item, i) => (
            <NavItemRow key={i} item={item} variant="sidebar" />
          ))}
        </div>
      )}
    </nav>
  );
}

/* ── Single Nav Item Row ─────────────────────────────────── */
function NavItemRow({
  item,
  variant,
}: {
  item: NavItem;
  variant: "sidebar" | "topbar";
}) {
  const baseClasses =
    variant === "sidebar"
      ? "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-[var(--transition-fast)]"
      : "flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-[var(--transition-fast)]";

  const activeClasses =
    variant === "sidebar"
      ? "bg-white/10 text-white shadow-sm"
      : "bg-[var(--color-primary-100)] text-[var(--color-primary-800)]";

  const hoverClasses =
    variant === "sidebar"
      ? "hover:bg-white/5 hover:text-white/90"
      : "hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-primary-700)]";

  const inactiveClasses =
    variant === "sidebar"
      ? "text-white/60"
      : "text-[var(--color-neutral-600)]";

  if (item.href) {
    // Use client-side routing for internal links so SPA state (e.g. the cart
    // context) survives navigation. Full-page loads wipe in-memory state.
    if (item.href.startsWith("/")) {
      return (
        <Link
          to={item.href}
          className={`${baseClasses} ${item.active ? activeClasses : `${inactiveClasses} ${hoverClasses}`}`}
        >
          {item.icon && <span className="w-5 h-5 shrink-0">{item.icon}</span>}
          {item.label}
        </Link>
      );
    }
    return (
      <a
        href={item.href}
        className={`${baseClasses} ${item.active ? activeClasses : `${inactiveClasses} ${hoverClasses}`}`}
      >
        {item.icon && <span className="w-5 h-5 shrink-0">{item.icon}</span>}
        {item.label}
      </a>
    );
  }

  return (
    <button
      onClick={item.onClick}
      className={`w-full ${baseClasses} ${item.active ? activeClasses : `${inactiveClasses} ${hoverClasses}`}`}
    >
      {item.icon && <span className="w-5 h-5 shrink-0">{item.icon}</span>}
      {item.label}
    </button>
  );
}

export { NavItemRow }; // for composability