import { createFileRoute, Link } from "@tanstack/react-router";
import { TopbarNav } from "~/components/Navigation";
import { ChatInbox } from "~/components/ChatInbox";

export const Route = createFileRoute("/dashboard/driver")({
  component: DriverPanel,
});

function DriverPanel() {
  return (
    <div className="min-h-dvh bg-[var(--surface-secondary)]">
      <TopbarNav
        branding={{ title: "GreenExpress Driver" }}
        items={[
          { label: "Home", href: "/" },
          { label: "Drive With Us", href: "/drivers/apply" },
          { label: "My Deliveries", active: true },
        ]}
      />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <ChatInbox
          title="My Deliveries"
          subtitle="Chat threads for the orders assigned to you — message customers and the store from one panel."
          demoRoles={["driver", "customer", "merchant", "support"]}
        />
        <p className="text-center text-sm text-[var(--color-neutral-400)] mt-10">
          Looking to drive for GreenExpress?{" "}
          <Link to="/drivers/apply" className="text-[var(--color-primary-600)] underline">Apply here</Link>.
        </p>
      </main>
    </div>
  );
}
