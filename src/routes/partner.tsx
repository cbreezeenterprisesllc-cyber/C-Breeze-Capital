import { apiFetch } from "~/lib/api-config";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TopbarNav } from "~/components/Navigation";
import { Button } from "~/components/Button";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Input } from "~/components/Input";
import { Icon } from "~/components/Icon";
import { SiteFooter } from "~/components/SiteFooter";

export const Route = createFileRoute("/partner")({
  component: PartnerPage,
});

function PartnerPage() {
  const [form, setForm] = useState({
    dispensary_name: "",
    city: "",
    state: "",
    website: "",
    contact_name: "",
    contact_email: "",
    message: "",
    opted_in: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const canSubmit =
    form.dispensary_name.trim() &&
    form.contact_email.trim() &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.contact_email) &&
    !form.contact_email.includes("+") &&
    form.opted_in;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await apiFetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({
          success: true,
          message: "Thanks — we've received your interest. Our team will reach out to get you set up.",
        });
        setForm({ dispensary_name: "", city: "", state: "", website: "", contact_name: "", contact_email: "", message: "", opted_in: false });
      } else {
        setResult({ success: false, message: data.error || "Something went wrong. Please try again." });
      }
    } catch {
      setResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--surface-secondary)" }}>
      <TopbarNav
        branding={{ title: "GreenExpress" }}
        items={[
          { label: "Home", href: "/" },
          { label: "For Dispensaries", href: "/partner", active: true },
          { label: "Pricing", href: "/pricing" },
          { label: "Dispensaries", href: "/dispensaries" },
        ]}
      />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="flex justify-center mb-2"><Icon name="chat" size={48} /></div>
          <h1 style={{ fontSize: 34, fontWeight: 700, marginBottom: 8 }}>Partner with GreenExpress</h1>
          <p style={{ color: "var(--color-neutral-500)", maxWidth: 560, margin: "0 auto", fontSize: 17 }}>
            Bring your dispensary more customers with our storefront, CRM, and marketing — without building your own
            tech stack. You remain the licensed seller and set your own terms.
          </p>
        </div>

        <Card padding="lg">
          <CardHeader>
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>Tell us about your dispensary</h2>
            <p style={{ fontSize: 14, color: "var(--color-neutral-500)" }}>
              No call required — submit this form and our team will follow up by email.
            </p>
          </CardHeader>
          <CardBody>
            {result && (
              <div
                style={{
                  padding: 14, borderRadius: 12, marginBottom: 16,
                  background: result.success ? "var(--color-success-50, #ecfdf5)" : "var(--color-error-50, #fef2f2)",
                  border: `1px solid ${result.success ? "var(--color-success)" : "var(--color-error)"}`,
                  color: result.success ? "var(--color-success-700, #047857)" : "var(--color-error-700, #b91c1c)",
                  fontSize: 14,
                }}
              >
                {result.message}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
              <Input label="Dispensary name *" value={form.dispensary_name} onChange={(e) => update("dispensary_name", e.target.value)} placeholder="e.g. Green Leaf Wellness" required />
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <Input label="City" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Portland" />
                <Input label="State" value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="OR" maxLength={2} />
              </div>
              <Input label="Website" value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://yourdispensary.com" />
              <Input label="Contact name" value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} placeholder="Your name" />
              <Input label="Contact email *" type="email" value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} placeholder="you@yourdispensary.com" required />
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-neutral-700)", display: "block", marginBottom: 6 }}>
                  Short message <span style={{ fontWeight: 400, color: "var(--color-neutral-400)" }}>(optional)</span>
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="Tell us a little about your dispensary and what you're looking for."
                  rows={4}
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "10px 12px",
                    borderRadius: 10, border: "1px solid var(--color-neutral-300)",
                    backgroundColor: "var(--surface-primary)", fontSize: 14, fontFamily: "inherit",
                  }}
                />
              </div>

              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, color: "var(--color-neutral-600)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.opted_in}
                  onChange={(e) => update("opted_in", e.target.checked)}
                  style={{ marginTop: 3 }}
                />
                <span>
                  Yes, GreenExpress may contact me by email regarding this application and our services. *
                </span>
              </label>

              <div style={{ marginTop: 4 }}>
                <Button variant="neon" fullWidth size="lg" type="submit" disabled={!canSubmit || submitting}>
                  {submitting ? "Submitting…" : "Submit Interest"}
                </Button>
              </div>
            </form>

            <p style={{ fontSize: 13, color: "var(--color-neutral-400)", marginTop: 16, textAlign: "center" }}>
              Prefer to jump straight in?{" "}
              <Link to="/pricing" style={{ color: "var(--color-primary-600)" }}>See plans &amp; pricing</Link>
            </p>
          </CardBody>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
