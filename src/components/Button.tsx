import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "neon" | "neon-amber" | "neon-purple";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  glow?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary-800)] text-white hover:bg-[var(--color-primary-700)] active:bg-[var(--color-primary-900)] shadow-sm hover:shadow-md",
  secondary:
    "bg-[var(--color-primary-100)] text-[var(--color-primary-800)] hover:bg-[var(--color-primary-200)] active:bg-[var(--color-primary-300)]",
  outline:
    "border-2 border-[var(--color-primary-700)] text-[var(--color-primary-700)] hover:bg-[var(--color-primary-100)] active:bg-[var(--color-primary-200)]",
  ghost:
    "text-[var(--color-primary-700)] hover:bg-[var(--color-primary-100)] active:bg-[var(--color-primary-200)]",
  danger:
    "bg-[var(--color-error)] text-white hover:opacity-90 active:opacity-80 shadow-sm",
  neon:
    "neon-btn-green text-white font-semibold",
  "neon-amber":
    "neon-btn-amber text-[var(--color-neutral-800)] font-semibold",
  "neon-purple":
    "neon-btn-purple text-white font-semibold",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-5 py-2.5 text-base gap-2",
  lg: "px-7 py-3.5 text-lg gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  fullWidth = false,
  glow = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center font-medium rounded-[var(--radius-md)]",
        "transition-all duration-[var(--transition-base)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        "active:scale-[0.97]",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? "w-full" : "",
        glow && variant === "primary" ? "hover:shadow-[var(--glow-green)]" : "",
        className,
      ].join(" ")}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="leaf-spinner w-4 h-4 text-sm" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}