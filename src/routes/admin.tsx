import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarNav } from "~/components/Navigation";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const adminNav = [
  { label: "Dashboard", href: "/admin", icon: <span>📊</span>, active: true },
  { label: "Tenants", href: "/admin/tenants", icon: <span>🏪</span> },
  { label: "Revenue", href: "/admin/revenue", icon: <span>💳</span> },
  { label: "Drivers", href: "/admin/drivers", icon: <span>🚗</span> },
  { label: "Compliance", href: "/admin/compliance", icon: <span>📋</span> },
  { label: "Settings", href: "/admin/settings", icon: <span>⚙️</span> },
];

function AdminLayout() {
  return (
    <div className="flex h-dvh">
      <SidebarNav branding={{ title: "GreenExpress", logo: <span className="text-emerald-400 text-xl">🌿</span> }} items={adminNav} />
      <div className="flex-1 overflow-y-auto bg-[var(--surface-secondary)]">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}