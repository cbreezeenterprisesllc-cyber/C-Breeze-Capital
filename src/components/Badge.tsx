import type { ReactNode } from "react";

type BadgeVariant =
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "indica"
  | "sativa"
  | "hybrid"
  | "neon";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  glow?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary:
    "bg-[var(--color-primary-100)] text-[var(--color-primary-800)]",
  accent:
    "bg-[var(--color-amber-500)]/20 text-[var(--color-amber-600)]",
  success:
    "bg-[var(--color-success)]/15 text-[var(--color-success)]",
  warning:
    "bg-[var(--color-warning)]/30 text-[var(--color-neutral-700)]",
  error:
    "bg-[var(--color-error)]/15 text-[var(--color-error)]",
  info:
    "bg-[var(--color-info)]/15 text-[var(--color-info)]",
  neutral:
    "bg-[var(--color-neutral-200)] text-[var(--color-neutral-600)]",
  indica:
    "strain-indica",
  sativa:
    "strain-sativa",
  hybrid:
    "strain-hybrid",
  neon:
    "bg-gradient-to-r from-[var(--color-neon-green)] to-[var(--color-primary-500)] text-[var(--color-neutral-900)] font-bold",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-[0.6875rem]",
  md: "px-2.5 py-1 text-xs",
};

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
  glow = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 font-medium rounded-[var(--radius-full)]",
        "whitespace-nowrap select-none",
        "transition-all duration-[var(--transition-fast)]",
        variantStyles[variant],
        sizeStyles[size],
        glow ? "glow-green" : "",
        className,
      ].join(" ")}
    >
      {dot && (
        <span
          className={[
            "w-1.5 h-1.5 rounded-full",
            {
              primary: "bg-[var(--color-primary-600)]",
              accent: "bg-[var(--color-amber-600)]",
              success: "bg-[var(--color-success)]",
              warning: "bg-[var(--color-warning)]",
              error: "bg-[var(--color-error)]",
              info: "bg-[var(--color-info)]",
              neutral: "bg-[var(--color-neutral-500)]",
              indica: "bg-white/70",
              sativa: "bg-white/70",
              hybrid: "bg-white/70",
              neon: "bg-[var(--color-neutral-900)]",
            }[variant],
          ].join(" ")}
        />
      )}
      {children}
    </span>
  );
}