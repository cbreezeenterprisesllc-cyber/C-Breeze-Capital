import type { ReactNode, SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder = "Select...",
  className = "",
  id,
  ...props
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-[var(--color-neutral-700)] mb-1.5"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={[
          "block w-full rounded-[var(--radius-md)] border py-2.5 pl-3 pr-10 text-base",
          "bg-[var(--surface-primary)] text-[var(--color-neutral-700)]",
          "transition-all duration-[var(--transition-fast)]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
          "appearance-none bg-no-repeat",
          error
            ? "border-[var(--color-error)] focus-visible:ring-[var(--color-error)]"
            : "border-[var(--color-neutral-200)] focus-visible:ring-[var(--color-primary-500)]",
          "disabled:bg-[var(--color-neutral-100)] disabled:cursor-not-allowed",
          className,
        ].join(" ")}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%237D7870'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
          backgroundPosition: "right 0.75rem center",
          backgroundSize: "1.25rem",
        }}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-[var(--color-error)]">{error}</p>
      )}
    </div>
  );
}