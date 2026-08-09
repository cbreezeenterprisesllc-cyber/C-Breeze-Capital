import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarNav } from "~/components/Navigation";

const merchantNavItems = [
  { label: "Dashboard", href: "/dashboard/merchant", icon: <span>📊</span>, active: true },
  { label: "Inventory", href: "/dashboard/merchant/inventory", icon: <span>📦</span> },
  { label: "Orders", href: "/dashboard/merchant/orders", icon: <span>📋</span> },
  { label: "Tracking", href: "/dashboard/merchant/tracking", icon: <span>📍</span> },
  { label: "Analytics", href: "/dashboard/merchant/analytics", icon: <span>📈</span> },
];

export const Route = createFileRoute("/dashboard/merchant")({
  component: MerchantLayout,
});

function MerchantLayout() {
  return (
    <div className="flex h-dvh">
      <SidebarNav
        branding={{ title: "GreenLeaf Dispensary" }}
        items={merchantNavItems}
      />
      <div className="flex-1 overflow-y-auto bg-[var(--surface-secondary)]">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}