// Shared site-wide footer with the Legal section (Terms / Privacy / Refunds).
// Used on all public pages so legal policies are reachable site-wide.
import { Link } from "@tanstack/react-router";

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Refund & Cancellation Policy", href: "/legal/refunds" },
];

export function SiteFooter() {
  return (
    <footer className="bg-[var(--color-primary-900)] text-white/60 py-12 mt-auto">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-3"><img src="/leaf-realistic.png" alt="" className="w-10 h-10 object-contain" /></div>
            <p className="font-[var(--font-heading)] text-lg text-white/80 mb-2">GreenExpress</p>
            <p className="text-sm max-w-xs">
              Premium cannabis delivery from local dispensaries. Must be 21+ to order.
            </p>
          </div>

          {/* Navigate */}
          <div>
            <p className="text-white/90 font-semibold text-sm mb-3 uppercase tracking-wide">Explore</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/dispensaries" className="hover:text-white transition-colors">Dispensaries</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/drive" className="hover:text-white transition-colors">Drive with us</Link></li>
              <li><Link to="/drivers/apply" className="hover:text-white transition-colors">Driver application</Link></li>
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
        </div>
      </div>
    </footer>
  );
}
