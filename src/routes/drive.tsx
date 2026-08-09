import { createFileRoute } from "@tanstack/react-router";
import { TopbarNav } from "~/components/Navigation";
import { Button } from "~/components/Button";
import { Card, CardBody } from "~/components/Card";
import { Badge } from "~/components/Badge";

export const Route = createFileRoute("/drive")({
  component: DrivePage,
});

const EARNINGS = [
  { label: "Per delivery", value: "$5–8", detail: "base pay" },
  { label: "Per mile", value: "$0.40", detail: "mileage reimbursement" },
  { label: "Tips", value: "100% yours", detail: "average $4–8 per delivery" },
  { label: "Earnings", value: "$18–29/hr", detail: "average per shift" },
];

const PERKS = [
  { icon: "📱", title: "Your schedule", desc: "Work when you want. No shifts, no minimums. You're a 1099 independent contractor." },
  { icon: "💰", title: "Weekly payouts", desc: "Direct deposit every Friday. Tips are yours immediately." },
  { icon: "🛡️", title: "Safety first", desc: "In-app emergency button, delivery verification, and real-time support." },
  { icon: "🚗", title: "Use your own car", desc: "2011 or newer vehicle with valid insurance. We handle the compliance." },
  { icon: "⭐", title: "Keep your rating up", desc: "Top-rated drivers get priority on high-value deliveries." },
  { icon: "📋", title: "Simple requirements", desc: "21+, valid license, pass background check. That's it." },
];

function DrivePage() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--surface-secondary)" }}>
      <TopbarNav
        branding={{ title: "GreenExpress" }}
        items={[
          { label: "Home", href: "/" },
          { label: "Drive", href: "/drive", active: true },
        ]}
      />

      {/* Hero */}
      <section style={{ padding: "64px 24px 48px", textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
        <Badge variant="neon" size="sm">Now Hiring</Badge>
        <h1 style={{ fontSize: 42, fontWeight: 800, margin: "16px 0 8px", lineHeight: 1.15 }}>
          Deliver cannabis.<br />Earn $18–29/hr.
        </h1>
        <p style={{ fontSize: 18, color: "var(--color-neutral-500)", maxWidth: 520, margin: "0 auto 24px" }}>
          Flexible schedule, 1099 independent contractor, weekly pay. Apply in 5 minutes.
        </p>
        <a href="/drivers/apply" style={{ textDecoration: "none" }}>
          <Button variant="neon" size="lg">Start Application &rarr;</Button>
        </a>
      </section>

      {/* Earnings cards */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 48 }}>
          {EARNINGS.map((e) => (
            <Card key={e.label} padding="md" glass>
              <CardBody>
                <p style={{ fontSize: 13, color: "var(--color-neutral-500)", marginBottom: 4 }}>{e.label}</p>
                <p style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{e.value}</p>
                <p style={{ fontSize: 12, color: "var(--color-neutral-400)", margin: 0 }}>{e.detail}</p>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Perks */}
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: "center" }}>
          Why drive with GreenExpress
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {PERKS.map((p) => (
            <Card key={p.title} padding="md">
              <CardBody>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{p.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{p.title}</h3>
                <p style={{ fontSize: 14, color: "var(--color-neutral-500)", margin: 0 }}>{p.desc}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "48px 24px", background: "var(--surface-primary)" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Ready to start earning?</h2>
        <p style={{ fontSize: 16, color: "var(--color-neutral-500)", marginBottom: 20 }}>
          Applications take 5 minutes. Background check takes 3-5 days. Start delivering.
        </p>
        <a href="/drivers/apply" style={{ textDecoration: "none" }}>
          <Button variant="neon" size="lg">Apply Now &rarr;</Button>
        </a>
        <p style={{ fontSize: 13, color: "var(--color-neutral-400)", marginTop: 12 }}>
          Must be 21+ with valid driver's license, insurance, and 2011+ vehicle.
        </p>
      </section>
    </div>
  );
}
