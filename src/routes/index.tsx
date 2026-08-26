import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { TopbarNav } from "~/components/Navigation";
import { Button } from "~/components/Button";
import { Card, CardBody } from "~/components/Card";
import { Icon } from "~/components/Icon";
import { SiteFooter } from "~/components/SiteFooter";
import siteConfig from "~/../site.json";

const getTenants = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("~/lib/db");
  const db = getDb();
  return db.prepare("SELECT id, name, slug, store_name, logo_url, primary_color, secondary_color FROM tenants WHERE is_active = 1 ORDER BY name").all();
});

export const Route = createFileRoute("/")({
  loader: () => getTenants(),
  component: Home,
});

/* ── Floating Leaf Particles (SVG-based, animated) ──────── */
function LeafParticles({ count = 8 }: { count?: number }) {
  const leafSrcs = ["/leaf-realistic.png", "/leaf-golden.png"];
  const sizes = [16, 22, 14, 20, 18, 24, 16, 20];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <img
          key={i}
          src={leafSrcs[i % leafSrcs.length]}
          alt=""
          className="leaf-particle"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${sizes[i % sizes.length]}px`,
            height: `${sizes[i % sizes.length]}px`,
            opacity: 0.25 + Math.random() * 0.3,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${10 + Math.random() * 15}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Scroll Reveal Hook ────────────────────────────────────── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    // Observe all children with .reveal class
    el.querySelectorAll(".reveal").forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ── Animated Stat Counter ─────────────────────────────────── */
function StatCounter({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            let start = 0;
            const duration = 1500;
            const step = Math.ceil(value / 30);
            const interval = setInterval(() => {
              start += step;
              if (start >= value) {
                setDisplay(value);
                clearInterval(interval);
              } else {
                setDisplay(start);
              }
            }, duration / 30);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl font-bold gradient-text-green font-[var(--font-heading)]">
        {display}{suffix}
      </p>
      <p className="text-sm text-[var(--color-neutral-500)] mt-1">{label}</p>
    </div>
  );
}

/* ── Home Page Component ───────────────────────────────────── */
function Home() {
  const tenants = Route.useLoaderData() as Array<{
    id: string; name: string; slug: string; store_name: string;
    logo_url: string; primary_color: string; secondary_color: string;
  }>;
  const sectionRef = useScrollReveal();

  return (
    <div className="min-h-dvh bg-[var(--surface-secondary)]">
      <TopbarNav
        branding={{ title: "GreenExpress" }}
        items={[
          { label: "Dispensaries", href: "/dispensaries" },
          { label: "For Dispensaries", href: "/partner" },
          { label: "Drive", href: "/drive" },
          { label: "Pricing", href: "/pricing" },
          { label: "Cart", href: "/cart" },
        ]}
      />

      <main>
        {/* ══════════════════════════════════════════════════════
            HERO SECTION — Animated Gradient + Particles
            ══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden min-h-[85vh] flex items-center" style={{
  backgroundImage: 'url(/hero-bg-texture.jpg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundColor: 'var(--color-primary-900)',
}}>
          <LeafParticles count={10} />

          {/* Decorative glow orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[var(--color-primary-500)]/10 blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[var(--color-amber-500)]/8 blur-3xl animate-float" style={{ animationDelay: "-2s" }} />

          <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center">
            {/* Leaf icon — photorealistic */}
            <div className="mb-6 animate-float flex justify-center"><img src="/leaf-realistic.png" alt="" className="w-20 h-20 object-contain drop-shadow-lg" /></div>

            {/* Headline with gradient */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-[var(--font-heading)] text-white leading-[var(--leading-display)] mb-6 animate-fade-in-up">
              The Technology Layer
              <br />
              <span className="gradient-text-amber">for Your Dispensary</span>
            </h1>

            {/* Subtitle — merchant-first */}
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 animate-fade-in-up delay-200">
              GreenExpress is your storefront, CRM, and marketing engine. We bring you more customers —
              you remain the licensed seller and set your own terms.
            </p>

            {/* CTA Buttons — merchant-first, keep consumer path */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
              <Link to="/pricing">
                <Button size="lg" variant="neon" glow className="text-lg px-10 py-4 inline-flex items-center gap-2">
                  <Icon name="rocket" size={20} /> Grow Your Dispensary
                </Button>
              </Link>
              <Link to="/partner">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 text-lg px-10 py-4 inline-flex items-center gap-2">
                  <Icon name="chat" size={20} /> Partner With Us
                </Button>
              </Link>
              <a href="#dispensaries">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 text-lg px-10 py-4">
                  Browse Dispensaries
                </Button>
              </a>
            </div>

            {/* Stats row — tech/merchant metrics */}
            <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto mt-16 animate-fade-in-up delay-500">
              <StatCounter value={4} label="Plans" />
              <StatCounter value={299} label="Starting /mo" suffix="$" />
              <StatCounter value={0} label="on Sales" suffix="%" />
            </div>
          </div>

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--surface-secondary)] to-transparent" />
        </section>

        {/* ══════════════════════════════════════════════════════
            FEATURES SECTION
            ══════════════════════════════════════════════════════ */}
        <section id="features" ref={sectionRef} className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl md:text-5xl font-[var(--font-heading)] text-[var(--color-primary-900)] mb-4">
              Why <span className="gradient-text-amber">GreenExpress</span>?
            </h2>
            <p className="text-lg text-[var(--color-neutral-500)] max-w-xl mx-auto">
              Everything you need to attract, convert, and retain customers — without building your own tech stack.
              You stay the licensed seller and compliance party.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "rocket" as const,
                title: "Storefront & Ordering",
                desc: "A branded online storefront with your menu, ordering, and order routing — you remain the seller of record.",
              },
              {
                icon: "shield" as const,
                title: "CRM & Marketing",
                desc: "Customer records, messaging, promotions, loyalty, and campaigns to bring new customers and keep them coming back.",
              },
              {
                icon: "chart" as const,
                title: "Aggregate Analytics",
                desc: "Clear, aggregate metrics on revenue, customers, retention, and demand — without exposing individual purchase data.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="reveal text-center p-8 rounded-[var(--radius-xl)] bg-[var(--surface-primary)] border border-[var(--color-neutral-200)] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-[var(--transition-base)]"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="mb-4 flex justify-center"><Icon name={feature.icon} size={44} /></div>
                <h3 className="font-[var(--font-heading)] text-xl text-[var(--color-primary-800)] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[var(--color-neutral-500)] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            DISPENSARIES GRID
            ══════════════════════════════════════════════════════ */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="text-center mb-12 reveal">
            <h2 className="text-4xl md:text-5xl font-[var(--font-heading)] text-[var(--color-primary-900)] mb-4">
              Featured <span className="gradient-text-green">Dispensaries</span>
            </h2>
            <p className="text-lg text-[var(--color-neutral-500)]">
              Shop from Portland's best cannabis shops.
            </p>
          </div>

          {tenants.length === 0 ? (
            <div className="text-center py-16 text-[var(--color-neutral-400)] reveal">
              <div className="mb-4 flex justify-center"><img src="/leaf-realistic.png" alt="" className="w-12 h-12 object-contain opacity-40" /></div>
              <p className="text-lg">No dispensaries available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tenants.map((t, i) => (
                <Link key={t.id} to="/dispensaries/$id" params={{ id: t.slug }} className="block reveal" style={{ animationDelay: `${i * 100}ms` }}>
                  <Card hover padding="lg" className="h-full">
                    <CardBody>
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className="w-14 h-14 rounded-[var(--radius-lg)] flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-md"
                          style={{ backgroundColor: t.primary_color || "var(--color-primary-700)" }}
                        >
                          {t.store_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-[var(--font-heading)] text-[var(--text-h4)] text-[var(--color-neutral-800)]">
                            {t.store_name}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-sm text-[var(--color-neutral-500)]">
                            <span className="live-dot" />
                            Open now
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--color-primary-600)] font-medium">
                          Browse menu →
                        </span>
                        <span className="text-xs text-[var(--color-neutral-400)] bg-[var(--color-neutral-100)] px-2 py-1 rounded-full">
                          {t.name}
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════
            CTA BANNER
            ══════════════════════════════════════════════════════ */}
        <section className="gradient-bg-animated py-20 relative overflow-hidden">
          <LeafParticles count={6} />
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-[var(--font-heading)] text-white mb-6 reveal">
              Ready to <span className="gradient-text-amber">Grow</span> Your Dispensary?
            </h2>
            <p className="text-lg text-white/70 max-w-xl mx-auto mb-10 reveal delay-200">
              Join the dispensaries using GreenExpress to win more customers and keep them coming back.
            </p>
            <div className="reveal delay-300 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/pricing">
                <Button size="lg" variant="neon" glow className="text-lg px-12 py-4 shadow-2xl inline-flex items-center gap-2">
                  <Icon name="rocket" size={22} /> See Plans
                </Button>
              </Link>
              <Link to="/dispensaries">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 text-lg px-12 py-4 inline-flex items-center gap-2">
                  <Icon name="leaf" size={22} /> Browse Dispensaries
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FOOTER
            ══════════════════════════════════════════════════════ */}
        <SiteFooter />
      </main>
    </div>
  );
}