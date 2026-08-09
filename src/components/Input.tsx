import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export function Input({
  label,
  error,
  hint,
  icon,
  fullWidth = true,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--color-neutral-700)] mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--color-neutral-400)]">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={[
            "block w-full rounded-[var(--radius-md)] border",
            "bg-[var(--surface-primary)] text-[var(--color-neutral-700)]",
            "placeholder:text-[var(--color-neutral-400)]",
            "transition-all duration-[var(--transition-fast)]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
            error
              ? "border-[var(--color-error)] focus-visible:ring-[var(--color-error)]"
              : "border-[var(--color-neutral-200)] focus-visible:ring-[var(--color-primary-500)] focus-visible:border-[var(--color-primary-500)]",
            icon ? "pl-10" : "pl-3",
            props.type === "date" ? "pr-3" : "pr-3",
            "py-2.5 text-base",
            "disabled:bg-[var(--color-neutral-100)] disabled:cursor-not-allowed",
            className,
          ].join(" ")}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-[var(--color-error)]">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-sm text-[var(--color-neutral-500)]">{hint}</p>
      )}
    </div>
  );
}