import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { TopbarNav } from "~/components/Navigation";
import { Button } from "~/components/Button";
import { Card, CardBody } from "~/components/Card";
import { Badge } from "~/components/Badge";

const getTenants = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("~/lib/db");
  const db = getDb();
  return db.prepare("SELECT id, name, slug, store_name, logo_url, primary_color FROM tenants WHERE is_active = 1 ORDER BY name").all();
});

export const Route = createFileRoute("/dispensaries")({
  loader: () => getTenants(),
  component: Dispensaries,
});

function Dispensaries() {
  const tenants = Route.useLoaderData() as Array<{
    id: string; name: string; slug: string; store_name: string;
    logo_url: string; primary_color: string;
  }>;

  return (
    <div className="min-h-dvh bg-[var(--surface-secondary)]">
      <TopbarNav
        branding={{ title: "GreenExpress" }}
        items={[
          { label: "Home", href: "/" },
          { label: "Dispensaries", href: "/dispensaries", active: true },
          { label: "Cart", href: "/cart" },
        ]}
      />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-[var(--font-heading)] text-[var(--color-primary-900)] mb-2">
            Dispensaries
          </h1>
          <p className="text-[var(--color-neutral-500)] text-lg max-w-xl">
            Choose a dispensary to browse their menu and place an order for delivery.
          </p>
        </div>

        {tenants.length === 0 ? (
          <div className="text-center py-20 text-[var(--color-neutral-400)] animate-fade-in">
            <div className="text-6xl mb-4">🌱</div>
            <p className="text-lg">No dispensaries available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((t, i) => (
              <Link key={t.id} to="/dispensaries/$id" params={{ id: t.slug }} className="block animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
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
                        <h3 className="font-[var(--font-heading)] text-[var(--text-h3)] text-[var(--color-neutral-800)]">
                          {t.store_name}
                        </h3>
                        <Badge variant="primary" size="sm" dot>Open</Badge>
                      </div>
                    </div>
                    <Button variant="neon" size="sm" fullWidth>View Menu →</Button>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}