import { createFileRoute, Link } from "@tanstack/react-router";
import { TopbarNav } from "~/components/Navigation";
import { Button } from "~/components/Button";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Badge } from "~/components/Badge";
import { Icon } from "~/components/Icon";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

const TIERS = [
  {
    name: "Starter",
    setup: "$999",
    monthly: "$199/mo",
    commission: "10%",
    bestFor: "Single-location shops",
    features: [
      "White-label dispensary storefront",
      "Real-time inventory management",
      "Order processing & driver dispatch",
      "Age verification & compliance tools",
      "Email support within 24 hours",
    ],
    link: "https://buy.stripe.com/dRmeVdbOybw17x90Et97G0g",
    highlighted: false,
  },
  {
    name: "Growth",
    setup: "$1,499",
    monthly: "$349/mo",
    commission: "7%",
    bestFor: "Multi-location dispensaries",
    features: [
      "Everything in Starter, plus:",
      "Multi-location management",
      "Advanced analytics & reporting",
      "Priority dispatch & routing",
      "Dedicated account manager",
    ],
    link: "https://buy.stripe.com/14A5kDcSC1VrdVx9aZ97G0h",
    highlighted: true,
  },
  {
    name: "Enterprise",
    setup: "$1,999",
    monthly: "$499/mo",
    commission: "5%",
    bestFor: "Delivery networks & chains",
    features: [
      "Everything in Growth, plus:",
      "Unlimited locations & users",
      "Custom integrations & API access",
      "Fleet management dashboard",
      "Priority 24/7 support + SLA",
    ],
    link: "https://buy.stripe.com/fZu00j5qa43zbNpbj797G0i",
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
          { label: "Pricing", href: "/pricing", active: true },
        ]}
      />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="flex justify-center mb-2"><Icon name="heart" size={48} /></div>
          <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>
            Simple, Transparent Pricing
          </h1>
          <p style={{ color: "var(--color-neutral-500)", maxWidth: 480, margin: "0 auto", fontSize: 18 }}>
            One-time setup fee + monthly SaaS. Commission only on delivered orders. No hidden costs.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
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
                <p style={{ fontSize: 32, fontWeight: 700, margin: "8px 0 0" }}>{tier.setup}</p>
                <p style={{ fontSize: 14, color: "var(--color-neutral-500)" }}>one-time setup</p>
              </CardHeader>

              <CardBody>
                <div style={{ display: "flex", gap: 16, fontSize: 14, padding: "16px 0", margin: "16px 0", borderTop: "1px solid var(--color-neutral-200)", borderBottom: "1px solid var(--color-neutral-200)" }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>{tier.monthly}</p>
                    <p style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>monthly SaaS</p>
                  </div>
                  <div style={{ borderLeft: "1px solid var(--color-neutral-200)", paddingLeft: 16 }}>
                    <p style={{ fontWeight: 600 }}>{tier.commission}</p>
                    <p style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>per order</p>
                  </div>
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

                <a href={tier.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <Button variant={tier.highlighted ? "neon" : "outline"} fullWidth>
                    Get Started &rarr;
                  </Button>
                </a>
              </CardBody>
            </Card>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 14, color: "var(--color-neutral-500)" }}>
          Monthly billing starts after your 14-day onboarding period.{" "}
          <Link to="/" style={{ color: "var(--color-primary-600)" }}>
            Questions? Contact us
          </Link>
        </div>
      </main>
    </div>
  );
}
