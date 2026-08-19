import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarNav } from "~/components/Navigation";
import { Icon } from "~/components/Icon";

const merchantNavItems = [
  { label: "Dashboard", href: "/dashboard/merchant", icon: <Icon name="chart" size={18} />, active: true },
  { label: "Inbox", href: "/dashboard/merchant/inbox", icon: <Icon name="chat" size={18} /> },
  { label: "Inventory", href: "/dashboard/merchant/inventory", icon: <Icon name="package" size={18} /> },
  { label: "Orders", href: "/dashboard/merchant/orders", icon: <Icon name="clipboard" size={18} /> },
  { label: "Tracking", href: "/dashboard/merchant/tracking", icon: <Icon name="car" size={18} /> },
  { label: "Analytics", href: "/dashboard/merchant/analytics", icon: <Icon name="chart" size={18} /> },
  { label: "Settings", href: "/dashboard/merchant/settings", icon: <Icon name="settings" size={18} /> },
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