// Shared site-wide footer with the Legal section (Terms / Privacy / Refunds).
// Used on all public pages so legal policies are reachable site-wide.
//
// The two link groups mirror the two-product split: the consumer GreenExpress App
// (order delivery) and the merchant GreenExpress SaaS (software for dispensaries).
import { Link } from "@tanstack/react-router";

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Refund & Cancellation Policy", href: "/legal/refunds" },
];

const APP_LINKS = [
  { label: "Order delivery", href: "/" },
  { label: "Dispensaries", href: "/dispensaries" },
  { label: "Track an order", href: "/cart" },
];

const MERCHANT_LINKS = [
  { label: "For my dispensary", href: "/saas" },
  { label: "Pricing", href: "/pricing" },
  { label: "Partner with us", href: "/partner" },
  { label: "Drive with us", href: "/drive" },
];

export function SiteFooter() {
  return (
    <footer className="bg-[var(--color-primary-900)] text-white/60 py-12 mt-auto">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-3"><img src="/leaf-realistic.png" alt="" className="w-10 h-10 object-contain" /></div>
            <p className="font-[var(--font-heading)] text-lg text-white/80 mb-2">GreenExpress</p>
            <p className="text-sm max-w-xs">
              Cannabis delivery from licensed dispensaries. Must be 21+ to order — valid ID checked at the door.
            </p>
          </div>

          {/* Consumer app */}
          <div>
            <p className="text-white/90 font-semibold text-sm mb-3 uppercase tracking-wide">GreenExpress App</p>
            <ul className="space-y-2 text-sm">
              {APP_LINKS.map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Merchant SaaS */}
          <div>
            <p className="text-white/90 font-semibold text-sm mb-3 uppercase tracking-wide">For dispensaries</p>
            <ul className="space-y-2 text-sm">
              {MERCHANT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-white/90 font-semibold text-sm mb-3 uppercase tracking-wide">Legal</p>
            <ul className="space-y-2 text-sm">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 text-center">
          <p className="text-xs">&copy; 2026 GreenExpress — a subsidiary of C Breeze Enterprises LLC. All rights reserved.</p>
          <p className="text-xs mt-2 text-white/40">
            GreenExpress is a technology platform, not a dispensary. Cannabis is sold and delivered by licensed retailers.
          </p>
        </div>
      </div>
    </footer>
  );
}
