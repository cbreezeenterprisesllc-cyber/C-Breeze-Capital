import { apiFetch } from "~/lib/api-config";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TopbarNav } from "~/components/Navigation";
import { Button } from "~/components/Button";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Input } from "~/components/Input";
import { Select } from "~/components/Select";
import { Badge } from "~/components/Badge";
import { Icon, type IconName } from "~/components/Icon";

export const Route = createFileRoute("/drivers/apply")({
  component: DriverApplyPage,
});

const DELIVERY_STATES = ["AK", "AZ", "CA", "CO", "CT", "DC", "DE", "IL", "MA", "MD", "ME", "MI", "MN", "MO", "MT", "NJ", "NM", "NV", "NY", "OH", "OR", "RI", "VA", "VT", "WA"];
const STATE_OPTIONS = DELIVERY_STATES.map(state => ({ value: state, label: state }));

const STEPS = [
  { num: 1, label: "Personal Info", icon: "person" as IconName },
  { num: 2, label: "License", icon: "id-card" as IconName },
  { num: 3, label: "Vehicle", icon: "car" as IconName },
  { num: 4, label: "Insurance", icon: "shield" as IconName },
  { num: 5, label: "Documents", icon: "settings" as IconName },
  { num: 6, label: "Compliance", icon: "clipboard" as IconName },
  { num: 7, label: "Review", icon: "check" as IconName },
];

function DriverApplyPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form state
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", dateOfBirth: "",
    address: "", city: "", state: "OR", zipCode: "",
    driversLicenseNumber: "", driversLicenseState: "OR", driversLicenseExpiry: "",
    vehicleMake: "", vehicleModel: "", vehicleYear: "", vehicleColor: "", vehiclePlate: "",
    insuranceProvider: "", insurancePolicyNumber: "", insuranceCoverageLimit: "",
    vehicleRegistration: "", hasSmartphone: true, backgroundCheckConsent: false,
    drugPolicyConsent: false, contractorAgreementConsent: false, complianceAcknowledgment: false,
  });

  const update = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const canAdvance = () => {
    switch (step) {
      case 1: return form.fullName && form.email && form.phone && form.dateOfBirth;
      case 2: return form.driversLicenseNumber && form.driversLicenseExpiry;
      case 3: return form.vehicleMake && form.vehicleModel && form.vehicleYear && form.vehicleColor && form.vehiclePlate;
      case 4: return form.insuranceProvider && form.insurancePolicyNumber && form.insuranceCoverageLimit && form.backgroundCheckConsent;
      case 5: return true;
      case 6: return form.drugPolicyConsent && form.contractorAgreementConsent && form.complianceAcknowledgment;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/drivers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ success: true, message: "Your application has been submitted! We'll review it and get back to you within 48 hours." });
      } else {
        setResult({ success: false, message: data.error || "Failed to submit application" });
      }
    } catch {
      setResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-dvh bg-[var(--surface-secondary)]">
        <TopbarNav branding={{ title: "GreenExpress" }} items={[{ label: "Home", href: "/" }]} />
        <main className="max-w-lg mx-auto px-6 py-20 text-center animate-scale-in">
          <div className="flex justify-center mb-4">{result.success ? <Icon name="celebration" size={64} /> : <Icon name="cross" size={64} />}</div>
          <h1 className="text-3xl font-[var(--font-heading)] gradient-text-green mb-4">
            {result.success ? "Application Submitted!" : "Submission Failed"}
          </h1>
          <p className="text-[var(--color-neutral-500)] mb-8">{result.message}</p>
          {result.success && (
            <Link to="/drivers/status">
              <Button variant="neon" className="inline-flex items-center gap-2"><Icon name="clipboard" size={18} /> Check Application Status</Button>
            </Link>
          )}
          {!result.success && (
            <Button variant="outline" onClick={() => setResult(null)}>Try Again</Button>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--surface-secondary)]">
      <TopbarNav
        branding={{ title: "GreenExpress" }}
        items={[
          { label: "Home", href: "/" },
          { label: "Drive With Us", href: "/drivers/apply", active: true },
        ]}
      />

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="flex justify-center mb-4"><Icon name="car" size={48} /></div>
          <h1 className="text-4xl font-[var(--font-heading)] gradient-text-green mb-2">
            Drive With GreenExpress
          </h1>
          <p className="text-[var(--color-neutral-500)] max-w-md mx-auto">
            Earn money delivering cannabis on your own schedule. Complete the application below to get started.
          </p>
        </div>

        <Card padding="md" className="mb-8 border-[var(--color-primary-200)]">
          <h2 className="font-semibold mb-3">Driver requirements</h2>
          <div className="grid sm:grid-cols-2 gap-2 text-sm text-[var(--color-neutral-600)]">
            {['21+ years old', 'Valid US driver\'s license', '2011+ vehicle with active insurance', 'Background and driving record checks', 'Smartphone with active data plan', 'Compliance agreements required'].map(item => <div key={item}>✓ {item}</div>)}
          </div>
        </Card>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-10 animate-fade-in-up delay-100">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step > s.num ? "bg-[var(--color-success)] text-white" :
                step === s.num ? "bg-[var(--color-primary-500)] text-white shadow-[var(--glow-green)] scale-110" :
                "bg-[var(--color-neutral-200)] text-[var(--color-neutral-500)]"
              }`}>
                {step > s.num ? "✓" : s.num}
              </div>
              <span className={`text-xs hidden sm:inline font-medium ${
                step === s.num ? "text-[var(--color-primary-700)]" : "text-[var(--color-neutral-400)]"
              }`}>{s.label}</span>
              {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${step > s.num ? "bg-[var(--color-success)]" : "bg-[var(--color-neutral-200)]"}`} />}
            </div>
          ))}
        </div>

        <Card padding="lg" className="animate-fade-in-up delay-200">
          <CardHeader>
            <h2 className="text-lg font-[var(--font-heading)] flex items-center gap-2">
              <Icon name={STEPS[step - 1].icon} size={20} /> Step {step}: {STEPS[step - 1].label}
            </h2>
          </CardHeader>
          <CardBody>
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <Input label="Full Legal Name" placeholder="John Doe" value={form.fullName} onChange={e => update("fullName", e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Email" type="email" placeholder="john@example.com" value={form.email} onChange={e => update("email", e.target.value)} />
                  <Input label="Phone" placeholder="(503) 555-0123" value={form.phone} onChange={e => update("phone", e.target.value)} />
                </div>
                <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e => update("dateOfBirth", e.target.value)} />
                {form.dateOfBirth && (() => { const d = new Date(form.dateOfBirth); const now = new Date(); let age = now.getFullYear() - d.getFullYear(); if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--; return age < 21 ? <p className="text-xs text-red-600">You must be 21 or older to apply</p> : null; })()}
                <Input label="Street Address" placeholder="123 Main St" value={form.address} onChange={e => update("address", e.target.value)} />
                <div className="grid grid-cols-3 gap-4">
                  <Input label="City" placeholder="Portland" value={form.city} onChange={e => update("city", e.target.value)} />
                  <Select label="State" options={STATE_OPTIONS} value={form.state} onChange={e => update("state", e.target.value)} placeholder="Select state" />
                  <Input label="ZIP Code" placeholder="97201" value={form.zipCode} onChange={e => update("zipCode", e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 2: License */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-xl bg-[var(--color-primary-100)] text-sm mb-4 flex items-start gap-2">
                  <Icon name="id-card" size={16} className="mt-0.5 shrink-0" /> You must have a valid US driver's license. All information must match your physical license exactly.
                </div>
                <Input label="Driver's License Number" placeholder="D123456789" value={form.driversLicenseNumber} onChange={e => update("driversLicenseNumber", e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <Select label="License State" options={STATE_OPTIONS} value={form.driversLicenseState} onChange={e => update("driversLicenseState", e.target.value)} placeholder="Select state" />
                  <Input label="Expiration Date" type="date" value={form.driversLicenseExpiry} onChange={e => update("driversLicenseExpiry", e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 3: Vehicle */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-xl bg-[var(--color-amber-500)]/10 text-sm mb-4 flex items-start gap-2">
                  <Icon name="car" size={16} className="mt-0.5 shrink-0" /> Your vehicle must be in good condition, insured, and have enough space for deliveries.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Make" placeholder="Toyota" value={form.vehicleMake} onChange={e => update("vehicleMake", e.target.value)} />
                  <Input label="Model" placeholder="Camry" value={form.vehicleModel} onChange={e => update("vehicleModel", e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Input label="Year" type="number" placeholder="2022" value={form.vehicleYear} onChange={e => update("vehicleYear", e.target.value)} />
                    <p className="text-xs text-[var(--color-neutral-500)] mt-1">Must be 2011 or newer</p>
                    {form.vehicleYear && Number(form.vehicleYear) < 2011 && <p className="text-xs text-red-600 mt-1">Vehicle must be 2011 or newer</p>}
                  </div>
                  <Input label="Color" placeholder="White" value={form.vehicleColor} onChange={e => update("vehicleColor", e.target.value)} />
                  <Input label="License Plate" placeholder="ABC123" value={form.vehiclePlate} onChange={e => update("vehiclePlate", e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 4: Insurance */}
            {step === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-xl bg-[var(--color-primary-100)] text-sm mb-4 flex items-start gap-2">
                  <Icon name="shield" size={16} className="mt-0.5 shrink-0" /> You must have active auto insurance. We'll verify your coverage during the review process.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Insurance Provider" placeholder="Progressive" value={form.insuranceProvider} onChange={e => update("insuranceProvider", e.target.value)} />
                  <Input label="Policy Number" placeholder="POL-123456" value={form.insurancePolicyNumber} onChange={e => update("insurancePolicyNumber", e.target.value)} />
                </div>
                <label className="block text-sm font-medium">Coverage Limit
                  <select value={form.insuranceCoverageLimit} onChange={e => update("insuranceCoverageLimit", e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-neutral-200)] p-3 bg-transparent">
                    <option value="">Select coverage</option><option>$100k/$300k/$50k</option><option>$250k/$500k/$100k</option><option>$500k/$500k/$100k</option><option>Other</option>
                  </select>
                </label>
                <Input label="Vehicle Registration" placeholder="Registration number or document reference" value={form.vehicleRegistration} onChange={e => update("vehicleRegistration", e.target.value)} />
                <label className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-neutral-200)] cursor-pointer hover:bg-[var(--color-primary-100)]/30 transition-colors">
                  <input type="checkbox" checked={form.backgroundCheckConsent} onChange={e => update("backgroundCheckConsent", e.target.checked)} className="mt-1" />
                  <div>
                    <p className="font-medium text-sm">Background Check Consent</p>
                    <p className="text-xs text-[var(--color-neutral-500)] mt-1">I consent to a background check as part of the driver application process. This includes a criminal history check and driving record review.</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-neutral-200)] cursor-pointer hover:bg-[var(--color-primary-100)]/30 transition-colors">
                  <input type="checkbox" checked={form.hasSmartphone} onChange={e => update("hasSmartphone", e.target.checked)} className="mt-1" />
                  <div>
                    <p className="font-medium text-sm">Smartphone Access</p>
                    <p className="text-xs text-[var(--color-neutral-500)] mt-1">I confirm I have a smartphone to use the delivery driver app for accepting orders and navigation.</p>
                  </div>
                </label>
              </div>
            )}

            {/* Step 6: Compliance */}
            {step === 6 && (
              <div className="space-y-3 animate-fade-in">
                {[
                  ["drugPolicyConsent", "Drug & Alcohol Policy", "I agree to zero tolerance during delivery windows and no cannabis use within 8 hours of a shift."],
                  ["contractorAgreementConsent", "Independent Contractor Agreement", "I agree to execute the contractor agreement electronically before my first shift."],
                  ["complianceAcknowledgment", "Compliance Rules", "I acknowledge the age verification, chain-of-custody, delivery-zone, and customer privacy requirements. I understand that additional state-specific rules apply and will be covered during onboarding."],
                ].map(([field, title, text]) => (
                  <label key={field} className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-neutral-200)] cursor-pointer hover:bg-[var(--color-primary-100)]/30 transition-colors">
                    <input type="checkbox" checked={Boolean(form[field as keyof typeof form])} onChange={e => update(field, e.target.checked)} className="mt-1" />
                    <div><p className="font-medium text-sm">{title}</p><p className="text-xs text-[var(--color-neutral-500)] mt-1">{text}</p></div>
                  </label>
                ))}
                <div className="p-3 rounded-lg bg-[var(--color-primary-50)] text-xs text-[var(--color-neutral-600)] flex items-start gap-1">
                  <Icon name="clipboard" size={12} className="mt-0.5 shrink-0" /> <strong>State-specific requirements vary.</strong> We support delivery onboarding across AK, AZ, CA, CO, CT, DC, DE, IL, MA, MD, ME, MI, MN, MO, MT, NJ, NM, NV, NY, OH, OR, RI, VA, VT, and WA. Licensing, worker classification, vehicle limits, team requirements, order/payment rules, delivery zones, operating hours, and documentation can differ by state; Oregon deliveries, for example, must use OLCC-licensed dispensaries, remain within approved zones, and follow applicable delivery-hour limits. Your state-specific requirements are reviewed during onboarding training.
                </div>
              </div>
            )}

            {/* Step 7: Review */}
            {step === 7 && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-xl bg-[var(--color-success)]/5 border border-[var(--color-success)]/20 text-sm mb-4 flex items-center gap-2">
                  <Icon name="check" size={16} /> Please review your application details before submitting.
                </div>
                {[
                  { label: "Full Name", value: form.fullName },
                  { label: "Email", value: form.email },
                  { label: "Phone", value: form.phone },
                  { label: "Address", value: `${form.address}, ${form.city}, ${form.state} ${form.zipCode}` },
                  { label: "License", value: `${form.driversLicenseNumber} (${form.driversLicenseState})` },
                  { label: "Vehicle", value: `${form.vehicleYear} ${form.vehicleMake} ${form.vehicleModel} - ${form.vehicleColor}` },
                  { label: "Plate", value: form.vehiclePlate },
                  { label: "Insurance", value: `${form.insuranceProvider} — ${form.insurancePolicyNumber}` },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-2 border-b border-[var(--color-neutral-100)]">
                    <span className="text-[var(--color-neutral-500)]">{item.label}</span>
                    <span className="font-medium text-right max-w-[60%]">{item.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-[var(--color-neutral-200)]">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(s => s - 1)}>← Back</Button>
              ) : (
                <div />
              )}
              {step < 7 ? (
                <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
                  Continue →
                </Button>
              ) : (
                <Button variant="neon" onClick={handleSubmit} loading={submitting} disabled={submitting} className="inline-flex items-center gap-2">
                  <Icon name="rocket" size={16} /> Submit Application
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4 mt-8 animate-fade-in-up delay-300">
          {[
            { icon: "dollars" as IconName, title: "Flexible Hours", desc: "Drive when you want" },
            { icon: "chart" as IconName, title: "Great Earnings", desc: "Competitive pay + tips" },
            { icon: "target" as IconName, title: "Local Routes", desc: "Stay in your area" },
          ].map((b, i) => (
            <div key={i} className="text-center p-4 rounded-xl bg-[var(--surface-primary)] border border-[var(--color-neutral-200)]">
              <div className="mb-1 flex justify-center"><Icon name={b.icon} size={24} /></div>
              <p className="font-semibold text-xs">{b.title}</p>
              <p className="text-[10px] text-[var(--color-neutral-500)]">{b.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}