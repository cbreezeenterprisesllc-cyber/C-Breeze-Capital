import { createFileRoute, Link } from "@tanstack/react-router";
import { TopbarNav } from "~/components/Navigation";
import { Button } from "~/components/Button";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Badge } from "~/components/Badge";
import { Icon } from "~/components/Icon";
import { SiteFooter } from "~/components/SiteFooter";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

const TIERS = [
  {
    name: "Starter",
    monthly: "Get in touch",
    pilot: false,
    note: "Digital profile & basics for single-location shops",
    bestFor: "Single-location dispensaries",
    features: [
      "Digital dispensary profile",
      "Menu integration",
      "Customer inquiries",
      "Basic analytics",
      "Promotions",
    ],
    link: null,
    highlighted: false,
  },
  {
    name: "Growth",
    monthly: "$299/mo",
    pilotPrice: "$224.25/mo",
    pilot: true,
    note: "Introductory pilot offer for the first two tenants, then $299/mo",
    bestFor: "Growing dispensaries",
    features: [
      "Everything in Starter, plus:",
      "Online-ordering integration (retailer remains the seller)",
      "Loyalty program",
      "CRM — customer records & messaging",
      "SMS/email marketing capability",
      "Advanced analytics",
    ],
    pilotLink: "https://buy.stripe.com/eVq3cvdWGbw1bNp9aZ97G0n",
    link: "https://buy.stripe.com/aFadR9g4OdE918Ldrf97G0m",
    highlighted: true,
  },
  {
    name: "Pro",
    monthly: "$699/mo",
    pilot: false,
    note: "For dispensaries scaling their acquisition & retention",
    bestFor: "Scaling dispensaries",
    features: [
      "Everything in Growth, plus:",
      "Automated campaigns",
      "Customer segmentation",
      "Abandoned-cart marketing",
      "Priority placement",
      "Advanced reporting",
    ],
    link: null,
    highlighted: false,
  },
  {
    name: "Enterprise",
    monthly: "$1,499+/mo",
    pilot: false,
    note: "Custom technology + white-label platform",
    bestFor: "Chains & large operators",
    features: [
      "Everything in Pro, plus:",
      "Custom technology & integrations",
      "White-label platform",
      "Dedicated support & success manager",
    ],
    link: null,
    highlighted: false,
  },
];

function PricingPage() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--surface-secondary)" }}>
      <TopbarNav
        branding={{ title: "GreenExpress" }}
        items={[
          { label: "Home", href: "/" },
          { label: "For Dispensaries", href: "/partner" },
          { label: "Pricing", href: "/pricing", active: true },
        ]}
      />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="flex justify-center mb-2"><Icon name="chart" size={48} /></div>
          <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>
            Pricing for Your Dispensary
          </h1>
          <p style={{ color: "var(--color-neutral-500)", maxWidth: 600, margin: "0 auto", fontSize: 18 }}>
            GreenExpress is your technology + customer-acquisition layer. Flat monthly SaaS — no percentage of your
            cannabis sales. You remain the licensed seller and compliance party; we bring the storefront, CRM,
            marketing, and customers.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {TIERS.map((tier) => (
            <Card
              key={tier.name}
              padding="lg"
              glow={tier.highlighted}
            >
              {tier.highlighted && (
                <div style={{ marginBottom: 8 }}>
                  <Badge variant="primary" size="sm">Most Popular</Badge>
                </div>
              )}

              <CardHeader>
                <h2 style={{ fontSize: 20, fontWeight: 600 }}>{tier.name}</h2>
                <p style={{ fontSize: 28, fontWeight: 700, margin: "8px 0 0" }}>{tier.monthly}</p>
                <p style={{ fontSize: 14, color: "var(--color-neutral-500)" }}>per month · flat rate</p>
              </CardHeader>

              <CardBody>
                <div style={{ fontSize: 14, padding: "14px 0", margin: "12px 0", borderTop: "1px solid var(--color-neutral-200)", borderBottom: "1px solid var(--color-neutral-200)" }}>
                  {tier.pilot ? (
                    <>
                      <p style={{ fontWeight: 700, color: "var(--color-primary-700)" }}>{tier.pilotPrice}</p>
                      <p style={{ fontSize: 13, color: "var(--color-neutral-500)" }}>Introductory pilot — first two tenants, then {tier.monthly}</p>
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: "var(--color-neutral-500)" }}>{tier.note}</p>
                  )}
                </div>

                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-primary-700)", marginBottom: 12, textTransform: "uppercase" }}>
                  {tier.bestFor}
                </p>

                <ul style={{ listStyle: "none", padding: 0, marginBottom: 24 }}>
                  {tier.features.map((f) => (
                    <li key={f} style={{ fontSize: 14, display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                      <span style={{ color: "var(--color-success)", flexShrink: 0 }}>✓</span>
                      <span style={{ color: "var(--color-neutral-600)" }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {tier.highlighted ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <a href={tier.pilotLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                      <Button variant="neon" fullWidth>Start Pilot — $224.25/mo</Button>
                    </a>
                    <a href={tier.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                      <Button variant="outline" fullWidth>or Standard $299/mo</Button>
                    </a>
                  </div>
                ) : (
                  <a href={tier.link || "/pricing"} style={{ textDecoration: "none" }}>
                    <Button variant={tier.highlighted ? "neon" : "outline"} fullWidth>
                      {tier.link ? "Get Started &rarr;" : "Contact Us"}
                    </Button>
                  </a>
                )}
              </CardBody>
            </Card>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 14, color: "var(--color-neutral-500)" }}>
          All plans include your online storefront. The first two tenants lock in the introductory pilot rate —
          after the pilot, plans continue at the standard monthly rate.{" "}
          <Link to="/dispensaries" style={{ color: "var(--color-primary-600)" }}>
            See the marketplace
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
