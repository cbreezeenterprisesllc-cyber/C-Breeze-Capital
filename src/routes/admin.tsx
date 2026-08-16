import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarNav } from "~/components/Navigation";
import { Icon } from "~/components/Icon";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const adminNav = [
  { label: "Dashboard", href: "/admin", icon: <Icon name="chart" size={18} />, active: true },
  { label: "Tenants", href: "/admin/tenants", icon: <Icon name="shop" size={18} /> },
  { label: "Revenue", href: "/admin/revenue", icon: <Icon name="money" size={18} /> },
  { label: "Support", href: "/admin/support", icon: <Icon name="chat" size={18} /> },
  { label: "Drivers", href: "/admin/drivers", icon: <Icon name="car" size={18} /> },
  { label: "Compliance", href: "/admin/compliance", icon: <Icon name="clipboard" size={18} /> },
  { label: "Settings", href: "/admin/settings", icon: <Icon name="settings" size={18} /> },
];

function AdminLayout() {
  return (
    <div className="flex h-dvh">
      <SidebarNav branding={{ title: "GreenExpress", logo: <Icon name="leaf" size={24} className="text-emerald-400" /> }} items={adminNav} />
      <div className="flex-1 overflow-y-auto bg-[var(--surface-secondary)]">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}