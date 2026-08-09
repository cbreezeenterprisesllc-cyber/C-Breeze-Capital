import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  glass?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

export function Card({
  children,
  className = "",
  padding = "md",
  hover = false,
  glass = false,
  glow = false,
  onClick,
}: CardProps) {
  const glassStyles = glass
    ? "glass backdrop-blur-md border border-white/20"
    : "bg-[var(--surface-primary)] border border-[var(--color-neutral-200)]";

  return (
    <div
      className={[
        "rounded-[var(--radius-lg)]",
        glassStyles,
        "shadow-sm",
        hover
          ? `hover:shadow-lg transition-all duration-[var(--transition-base)] ${glass ? "hover:bg-white/20" : "hover:border-[var(--color-primary-200)] hover:-translate-y-1"} cursor-pointer`
          : "",
        glow && !glass ? "hover:shadow-[var(--glow-green)]" : "",
        paddingStyles[padding],
        className,
      ].join(" ")}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mb-4 flex items-center justify-between ${className}`}
    >
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({
  children,
  className = "",
  divided = true,
}: {
  children: ReactNode;
  className?: string;
  divided?: boolean;
}) {
  return (
    <div
      className={`mt-4 pt-4 ${
        divided ? "border-t border-[var(--color-neutral-200)]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}