import { useState } from "react";
import { Modal } from "~/components/Modal";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";

interface DeliveryVerificationProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  onConfirm: (data: { idPhoto?: string; deliveryPhoto?: string; notes?: string }) => void;
}

export function DeliveryVerificationModal({ open, onClose, orderId, onConfirm }: DeliveryVerificationProps) {
  const [step, setStep] = useState(1);
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm({ idPhoto: idPhoto || undefined, deliveryPhoto: deliveryPhoto || undefined, notes });
    onClose();
    setStep(1);
    setIdPhoto(null);
    setDeliveryPhoto(null);
    setNotes("");
  };

  const handleClose = () => {
    onClose();
    setStep(1);
    setIdPhoto(null);
    setDeliveryPhoto(null);
    setNotes("");
  };

  const simulateUpload = (setter: (v: string) => void) => {
    setter("uploaded-photo-" + Date.now() + ".jpg");
    setStep(s => Math.min(s + 1, 3));
  };

  return (
    <Modal open={open} onClose={handleClose} title={`📋 Delivery Verification — ${orderId?.slice(0, 8)}`} size="md">
      <div className="space-y-6 animate-scale-in">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? "bg-[var(--color-primary-500)] text-white shadow-[var(--glow-green)]" : "bg-[var(--color-neutral-200)] text-[var(--color-neutral-500)]"}`}>
                {step > s ? "✓" : s}
              </div>
              <span className="text-xs hidden sm:inline font-medium">{s === 1 ? "Verify ID" : s === 2 ? "Photo" : "Confirm"}</span>
              {s < 3 && <div className={`flex-1 h-0.5 rounded ${step > s ? "bg-[var(--color-primary-500)]" : "bg-[var(--color-neutral-200)]"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: ID Verification */}
        {step === 1 && (
          <div className="text-center py-6 animate-fade-in">
            <div className="text-5xl mb-4 animate-float">🪪</div>
            <h3 className="text-lg font-[var(--font-heading)] font-bold mb-2">Verify Customer ID</h3>
            <p className="text-sm text-[var(--color-neutral-500)] mb-6 max-w-sm mx-auto">
              Scan or upload the customer's ID to verify age (21+)
            </p>
            <div className="flex justify-center gap-4">
              <Button variant={idPhoto ? "neon" : "primary"} onClick={() => simulateUpload(setIdPhoto)}>
                {idPhoto ? "✅ ID Verified" : "📷 Upload ID"}
              </Button>
            </div>
            {idPhoto && (
              <p className="text-xs text-[var(--color-success)] mt-3 flex items-center justify-center gap-1">
                <span className="live-dot" /> ID uploaded: {idPhoto}
              </p>
            )}
          </div>
        )}

        {/* Step 2: Delivery Photo */}
        {step === 2 && (
          <div className="text-center py-6 animate-fade-in">
            <div className="text-5xl mb-4">📸</div>
            <h3 className="text-lg font-[var(--font-heading)] font-bold mb-2">Capture Delivery Photo</h3>
            <p className="text-sm text-[var(--color-neutral-500)] mb-6 max-w-sm mx-auto">
              Take a photo of the delivery with the recipient
            </p>
            <div className={`h-40 rounded-[var(--radius-xl)] flex items-center justify-center mb-6 border-2 border-dashed transition-colors ${deliveryPhoto ? "border-[var(--color-success)] bg-[var(--color-success)]/5" : "border-[var(--color-neutral-300)] bg-[var(--color-neutral-100)]"}`}>
              {deliveryPhoto ? (
                <div className="text-center animate-scale-in">
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-sm text-[var(--color-success)] font-medium">Photo captured successfully</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-[var(--color-neutral-400)] text-sm">📷 Camera preview area</p>
                  <p className="text-xs text-[var(--color-neutral-400)] mt-1">Click the button below to capture</p>
                </div>
              )}
            </div>
            <Button variant={deliveryPhoto ? "neon" : "primary"} onClick={() => simulateUpload(setDeliveryPhoto)}>
              {deliveryPhoto ? "✅ Photo Captured" : "📸 Capture Photo"}
            </Button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="py-4 animate-fade-in">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4 animate-bounce-in">✅</div>
              <h3 className="text-lg font-[var(--font-heading)] font-bold mb-2">Confirm Delivery</h3>
              <p className="text-sm text-[var(--color-neutral-500)]">Review and confirm the delivery</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-[var(--color-primary-100)]">
                <div className="flex items-center gap-2">
                  <span>🪪</span>
                  <span>ID Verification</span>
                </div>
                <Badge variant={idPhoto ? "success" : "error"} size="sm" dot>{idPhoto ? "Verified" : "Missing"}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-[var(--color-amber-500)]/10">
                <div className="flex items-center gap-2">
                  <span>📸</span>
                  <span>Delivery Photo</span>
                </div>
                <Badge variant={deliveryPhoto ? "success" : "error"} size="sm" dot>{deliveryPhoto ? "Captured" : "Missing"}</Badge>
              </div>
              <div>
                <textarea
                  className="w-full p-3 rounded-xl border border-[var(--color-neutral-200)] text-sm resize-none focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)] transition-colors bg-[var(--surface-primary)]"
                  rows={2}
                  placeholder="📝 Delivery notes (optional)"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>← Back</Button>
              <Button variant="neon" className="flex-1" onClick={handleConfirm}>✅ Confirm Delivery</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}