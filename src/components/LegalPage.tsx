// Shared layout for the site's legal policy pages (Terms / Privacy / Refunds).
// Renders the standard top nav, an article container, and the site footer so
// legal pages stay consistent with the rest of the public storefront.
import type { ReactNode } from "react";
import { TopbarNav } from "~/components/Navigation";
import { SiteFooter } from "~/components/SiteFooter";

interface LegalPageProps {
  title: string;
  children: ReactNode;
  /** e.g. "[Effective Date]" or a specific date */
  effectiveDate?: string;
}

export function LegalPage({ title, children, effectiveDate }: LegalPageProps) {
  return (
    <div className="min-h-dvh bg-[var(--surface-secondary)] flex flex-col">
      <TopbarNav
        branding={{ title: "GreenExpress" }}
        items={[
          { label: "Home", href: "/" },
          { label: "Dispensaries", href: "/dispensaries" },
          { label: "Pricing", href: "/pricing" },
        ]}
      />

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-4xl md:text-5xl font-[var(--font-heading)] text-[var(--color-primary-900)] mb-3">
          {title}
        </h1>
        {effectiveDate && (
          <p className="text-sm text-[var(--color-neutral-500)] mb-10">
            Effective Date: {effectiveDate}
          </p>
        )}
        <div className="legal-body text-[15px] leading-[var(--leading-body)] text-[var(--color-neutral-700)] space-y-6">
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
