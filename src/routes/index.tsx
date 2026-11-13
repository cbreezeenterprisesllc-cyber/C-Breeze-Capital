import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { ConsumerNav } from "~/components/AppNav";
import { Button } from "~/components/Button";
import { Card, CardBody } from "~/components/Card";
import { Badge } from "~/components/Badge";
import { Icon } from "~/components/Icon";
import { SiteFooter } from "~/components/SiteFooter";
import { useAppPageView } from "~/lib/app-source";
import { parseHours, isOpenAt, hasConfiguredHours } from "~/lib/store-hours";

// GreenExpress App — the consumer marketplace surface (root entry).
// The merchant product lives separately at /saas, /pricing and /partner; the nav
// keeps that door visible but this page is written for the person ordering.
const getAppStores = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("~/lib/db");
  const db = getDb();
  return db
    .prepare(
      "SELECT t.id, t.name, t.slug, t.store_name, t.primary_color, t.hours, " +
        "(SELECT COUNT(*) FROM products p WHERE p.tenant_id = t.id AND p.is_active = 1) AS product_count " +
        "FROM tenants t WHERE t.is_active = 1 ORDER BY t.store_name"
    )
    .all();
});

export const Route = createFileRoute("/")({
  loader: () => getAppStores(),
  component: AppHome,
});

const STEPS = [
  {
    icon: "shop" as const,
    title: "Pick a licensed dispensary",
    desc: "Every store on GreenExpress is a licensed retailer. Their real menu, their real prices — no markup added by us.",
  },
  {
    icon: "cart" as const,
    title: "Build your order",
    desc: "Browse flower, pre-rolls, vapes, edibles and more. Choose delivery, pickup or curbside, and schedule it if you like.",
  },
  {
    icon: "truck" as const,
    title: "Pay $7, they deliver",
    desc: "You pay GreenExpress a flat $7 service fee by card. The dispensary — the licensed seller — is paid for the product and sends it out.",
  },
];

const FEE_POINTS = [
  {
    icon: "dollars" as const,
    title: "$7 flat, every order",
    desc: "One flat service fee for using the app — not a percentage of what you buy. A $30 order and a $300 order cost the same to order.",
  },
  {
    icon: "shield" as const,
    title: "Zero commission",
    desc: "We never take a cut of the cannabis sale. That is why the menu prices you see are the dispensary's own prices, not inflated ones.",
  },
  {
    icon: "id-card" as const,
    title: "Licensed sellers only",
    desc: "The dispensary stays the licensed seller and the compliance party. 21+ only, and your ID is checked at the door on delivery.",
  },
];

function AppHome() {
  const stores = Route.useLoaderData() as Array<{
    id: string;
    name: string;
    slug: string;
    store_name: string;
    primary_color: string;
    hours: string;
    product_count: number;
  }>;
  useAppPageView("app_home_view");

  return (
    <div className="min-h-dvh bg-[var(--surface-secondary)]">
      <ConsumerNav active="home" />

      <main>
        {/* ══ HERO — written for the customer, not the merchant ══ */}
        <section
          className="relative overflow-hidden min-h-[80vh] flex items-center"
          style={{
            backgroundImage: "url(/hero-bg-texture.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: "var(--color-primary-900)",
          }}
        >
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[var(--color-primary-500)]/10 blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[var(--color-amber-500)]/8 blur-3xl animate-float" style={{ animationDelay: "-2s" }} />

          <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center">
            <div className="mb-5 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
                <span className="live-dot" /> GreenExpress App · launching in Oregon
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-[var(--font-heading)] text-white leading-[var(--leading-display)] mb-6 animate-fade-in-up">
              Your dispensary,
              <br />
              <span className="gradient-text-green">delivered.</span>
            </h1>

            <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto mb-4 animate-fade-in-up delay-200">
              Order from licensed dispensaries near you — real menus, real prices, delivered to your door.
              One flat <strong className="text-white">$7 service fee</strong> per order. No commission on your cannabis.
            </p>
            <p className="text-sm text-white/50 mb-10 animate-fade-in-up delay-200">
              21+ only. Valid ID checked at the door. Licensed Oregon retailers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
              <Link to="/dispensaries">
                <Button size="lg" variant="neon" glow className="text-lg px-10 py-4 inline-flex items-center gap-2">
                  <Icon name="leaf" size={20} /> Browse dispensaries
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 text-lg px-10 py-4 inline-flex items-center gap-2">
                  <Icon name="clock" size={20} /> How it works
                </Button>
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-14 animate-fade-in-up delay-500 text-white">
              <div className="text-center">
                <p className="text-2xl font-bold gradient-text-green font-[var(--font-heading)]">$7</p>
                <p className="text-xs text-white/60 mt-1">flat per order</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold gradient-text-green font-[var(--font-heading)]">0%</p>
                <p className="text-xs text-white/60 mt-1">commission</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold gradient-text-green font-[var(--font-heading)]">21+</p>
                <p className="text-xs text-white/60 mt-1">ID at the door</p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--surface-secondary)] to-transparent" />
        </section>

        {/* ══ HOW IT WORKS ══ */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24 scroll-mt-24">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-[var(--font-heading)] text-[var(--color-primary-900)] mb-4">
              How <span className="gradient-text-green">ordering</span> works
            </h2>
            <p className="text-lg text-[var(--color-neutral-500)] max-w-xl mx-auto">
              Three steps, one flat fee, and a licensed dispensary does the rest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="text-center p-8 rounded-[var(--radius-xl)] bg-[var(--surface-primary)] border border-[var(--color-neutral-200)] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-[var(--transition-base)]"
              >
                <div className="mb-4 flex justify-center"><Icon name={step.icon} size={44} /></div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary-600)] mb-2">Step {i + 1}</p>
                <h3 className="font-[var(--font-heading)] text-xl text-[var(--color-primary-800)] mb-3">{step.title}</h3>
                <p className="text-[var(--color-neutral-500)] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ STORES NEAR YOU ══ */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-[var(--font-heading)] text-[var(--color-primary-900)] mb-4">
              Dispensaries <span className="gradient-text-amber">delivering now</span>
            </h2>
            <p className="text-lg text-[var(--color-neutral-500)]">
              Licensed stores on GreenExpress. Availability depends on your delivery address.
            </p>
          </div>

          {stores.length === 0 ? (
            <div className="text-center py-16 text-[var(--color-neutral-400)]">
              <div className="mb-4 flex justify-center"><img src="/leaf-realistic.png" alt="" className="w-12 h-12 object-contain opacity-40" /></div>
              <p className="text-lg">No dispensaries listed yet — we're onboarding stores now. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((t) => {
                const hours = parseHours(t.hours);
                const openNow = hasConfiguredHours(hours) ? isOpenAt(hours) : null;
                return (
                  <Link key={t.id} to="/dispensaries/$id" params={{ id: t.slug }} className="block">
                    <Card hover padding="lg" className="h-full">
                      <CardBody>
                        <div className="flex items-center gap-4 mb-4">
                          <div
                            className="w-14 h-14 rounded-[var(--radius-lg)] flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-md"
                            style={{ backgroundColor: t.primary_color || "var(--color-primary-700)" }}
                          >
                            {(t.store_name || "S").charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-[var(--font-heading)] text-[var(--text-h4)] text-[var(--color-neutral-800)]">
                              {t.store_name}
                            </h3>
                            {openNow === null ? (
                              <Badge variant="neutral" size="sm">Hours N/A</Badge>
                            ) : openNow ? (
                              <Badge variant="primary" size="sm" dot>Open now</Badge>
                            ) : (
                              <Badge variant="neutral" size="sm" dot>Closed</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[var(--color-primary-600)] font-medium">Shop the menu →</span>
                          <span className="text-xs text-[var(--color-neutral-500)] bg-[var(--color-neutral-100)] px-2 py-1 rounded-full">
                            {t.product_count} products
                          </span>
                        </div>
                      </CardBody>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ══ THE FLAT FEE, EXPLAINED ══ */}
        <section className="bg-[var(--surface-primary)] border-y border-[var(--color-neutral-200)] py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-4xl md:text-5xl font-[var(--font-heading)] text-[var(--color-primary-900)] mb-4">
                Why <span className="gradient-text-green">$7 flat</span>?
              </h2>
              <p className="text-lg text-[var(--color-neutral-500)] max-w-xl mx-auto">
                No percentage fees, no inflated menu prices, no cut of the sale — just one flat fee for the app.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {FEE_POINTS.map((point) => (
                <div key={point.title} className="p-8 rounded-[var(--radius-xl)] bg-[var(--surface-secondary)] border border-[var(--color-neutral-200)]">
                  <div className="mb-4"><Icon name={point.icon} size={36} /></div>
                  <h3 className="font-[var(--font-heading)] text-lg text-[var(--color-primary-800)] mb-2">{point.title}</h3>
                  <p className="text-sm text-[var(--color-neutral-500)] leading-relaxed">{point.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--color-neutral-400)] text-center max-w-2xl mx-auto mt-10 leading-relaxed">
              GreenExpress is a technology platform, not a dispensary. Cannabis is sold and delivered by licensed
              retailers, who remain the seller of record and the compliance party. The $7 service fee is a platform
              fee, not payment for cannabis.
            </p>
          </div>
        </section>

        {/* ══ MERCHANT DOOR (kept distinct from the consumer funnel) ══ */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="rounded-[var(--radius-xl)] bg-[var(--color-primary-900)] text-white p-10 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/50 mb-2">Own a dispensary?</p>
              <h2 className="text-3xl font-[var(--font-heading)] mb-2">That's a different product — GreenExpress SaaS.</h2>
              <p className="text-white/60 max-w-xl">
                Storefront, CRM, marketing and dispatch software for licensed retailers. You stay the seller,
                set your own prices, and pay a monthly subscription — never a commission.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link to="/saas">
                <Button size="lg" variant="neon" glow className="inline-flex items-center gap-2">
                  <Icon name="rocket" size={18} /> For my dispensary
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  See pricing
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter />
      </main>
    </div>
  );
}
