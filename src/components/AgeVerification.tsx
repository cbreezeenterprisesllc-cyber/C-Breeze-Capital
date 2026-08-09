import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Modal } from "./Modal";
import { useCart } from "./CartStore";

interface AgeVerificationModalProps {
  open: boolean;
  onVerified: () => void;
  onClose: () => void;
}

export function AgeVerificationModal({ open, onVerified, onClose }: AgeVerificationModalProps) {
  const [step, setStep] = useState<"age" | "details" | "confirm">("age");
  const [birthDate, setBirthDate] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");

  const { subtotal, itemCount, clearCart } = useCart();
  const deliveryFee = 5.0;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  const handleAgeVerify = () => {
    setError("");

    if (!birthDate) {
      setError("Please enter your birth date");
      return;
    }

    const date = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())
      ? age - 1
      : age;

    if (actualAge < 21) {
      setError("You must be 21 or older to use this service");
      return;
    }

    if (!confirmed) {
      setError("Please confirm you are 21+ to continue");
      return;
    }

    setStep("details");
  };

  const handleDetailsSubmit = () => {
    if (!name || !phone || !address) {
      setError("Please fill in all required fields");
      return;
    }
    setError("");
    setStep("confirm");
  };

  const handlePlaceOrder = () => {
    // Simulate order placement
    clearCart();
    onVerified();
  };

  const handleClose = () => {
    setStep("age");
    setBirthDate("");
    setConfirmed(false);
    setError("");
    setName("");
    setPhone("");
    setAddress("");
    setInstructions("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} size="lg">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {["age", "details", "confirm"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step === s
                  ? "bg-[var(--color-primary-700)] text-white"
                  : ["age", "details", "confirm"].indexOf(step) > i
                  ? "bg-[var(--color-primary-100)] text-[var(--color-primary-700)]"
                  : "bg-[var(--color-neutral-200)] text-[var(--color-neutral-500)]"
              }`}
            >
              {["age", "details", "confirm"].indexOf(step) > i ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs font-medium ${
                step === s
                  ? "text-[var(--color-primary-700)]"
                  : "text-[var(--color-neutral-500)]"
              }`}
            >
              {s === "age" ? "Age Verify" : s === "details" ? "Details" : "Confirm"}
            </span>
            {i < 2 && <div className="w-8 h-px bg-[var(--color-neutral-200)]" />}
          </div>
        ))}
      </div>

      {/* Step 1: Age Verification */}
      {step === "age" && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-[var(--color-accent-500)]/20 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-[var(--color-accent-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="font-[var(--font-heading)] text-xl font-bold text-[var(--color-neutral-800)]">
              Age Verification
            </h3>
            <p className="mt-1 text-sm text-[var(--color-neutral-500)]">
              You must be 21+ to purchase cannabis products
            </p>
          </div>

          <Input
            label="Birth Date"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            error={error && error.includes("21") || error.includes("birth") ? error : ""}
          />

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[var(--color-neutral-300)] text-[var(--color-primary-700)] focus:ring-[var(--color-primary-500)]"
            />
            <span className="text-sm text-[var(--color-neutral-600)]">
              I confirm that I am 21 years of age or older
            </span>
          </label>

          {error && error.includes("confirm") && (
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          )}

          <Button fullWidth onClick={handleAgeVerify}>
            Verify & Continue
          </Button>
        </div>
      )}

      {/* Step 2: Delivery Details */}
      {step === "details" && (
        <div className="space-y-4">
          <h3 className="font-[var(--font-heading)] text-lg font-bold text-[var(--color-neutral-800)]">
            Delivery Details
          </h3>

          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
          <Input label="Phone Number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
          <Input label="Delivery Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Apt 4" />
          <Input label="Delivery Instructions (optional)" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Leave at door, don't ring bell" />

          {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setStep("age")}>
              Back
            </Button>
            <Button fullWidth onClick={handleDetailsSubmit}>
              Continue to Review
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm & Place Order */}
      {step === "confirm" && (
        <div className="space-y-4">
          <h3 className="font-[var(--font-heading)] text-lg font-bold text-[var(--color-neutral-800)]">
            Order Summary
          </h3>

          {/* Delivery Info */}
          <div className="bg-[var(--color-neutral-50)] rounded-[var(--radius-md)] p-4 space-y-1 text-sm">
            <p><span className="font-medium text-[var(--color-neutral-700)]">Delivering to:</span></p>
            <p className="text-[var(--color-neutral-600)]">{name}</p>
            <p className="text-[var(--color-neutral-600)]">{address}</p>
            <p className="text-[var(--color-neutral-600)]">{phone}</p>
            {instructions && (
              <p className="text-[var(--color-neutral-500)] italic">"{instructions}"</p>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => {
              // This would ideally come from the cart, but we're showing the summary
              return null;
            })}
          </div>

          {/* Price Breakdown */}
          <div className="border-t border-[var(--color-neutral-200)] pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-[var(--color-neutral-500)]">
              <span>Subtotal ({itemCount} items)</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[var(--color-neutral-500)]">
              <span>Delivery fee</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[var(--color-neutral-500)]">
              <span>Tax (est.)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-[var(--color-neutral-800)] pt-2 border-t border-[var(--color-neutral-200)]">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setStep("details")}>
              Back
            </Button>
            <Button fullWidth onClick={handlePlaceOrder}>
              Place Order — ${total.toFixed(2)}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}