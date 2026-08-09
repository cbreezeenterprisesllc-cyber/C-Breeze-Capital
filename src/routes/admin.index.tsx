import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Badge } from "~/components/Badge";
import { Icon, type IconName } from "~/components/Icon";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const tenants = [
  { name: "Green Haven", mrr: 12400, orders: 147, growth: "+12%" },
  { name: "Urban Leaf", mrr: 9800, orders: 112, growth: "+8%" },
  { name: "Coastal Care", mrr: 7200, orders: 89, growth: "+5%" },
  { name: "Mountain Meds", mrr: 5100, orders: 56, growth: "-2%" },
];

function AdminDashboard() {
  const totalMRR = tenants.reduce((s, t) => s + t.mrr, 0);
  const totalOrders = tenants.reduce((s, t) => s + t.orders, 0);

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-[var(--font-heading)] gradient-text-green mb-8 flex items-center gap-2">
        <Icon name="chart" size={28} /> Platform Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "MRR", value: `${(totalMRR / 1000).toFixed(1)}K`, badge: "+8.2%", icon: "money" as IconName },
          { label: "Tenants", value: "12", badge: "+1 new", icon: "shop" as IconName },
          { label: "Uptime", value: "98.7%", badge: "Stable", icon: "chart" as IconName },
          { label: "Avg Revenue/Tenant", value: "$3,767", badge: "+5.1%", icon: "money" as IconName },
        ].map((kpi, i) => (
          <Card key={i} padding="md" hover glow className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
            <CardBody>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-[var(--color-neutral-500)]">{kpi.label}</p>
                <Icon name={kpi.icon} size={18} />
              </div>
              <p className="text-3xl font-bold gradient-text-green">{kpi.value}</p>
              <Badge variant="success" size="sm" className="mt-1">{kpi.badge}</Badge>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card padding="lg" className="animate-fade-in-up delay-200">
        <CardHeader>
          <h2 className="text-lg font-[var(--font-heading)] text-[var(--color-neutral-800)] flex items-center gap-2"><Icon name="shop" size={18} /> Revenue by Tenant</h2>
        </CardHeader>
        <CardBody>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-neutral-500)] border-b border-[var(--color-neutral-200)]">
                <th className="pb-3 font-medium">Tenant</th>
                <th className="pb-3 font-medium">MRR</th>
                <th className="pb-3 font-medium">Orders</th>
                <th className="pb-3 font-medium">Growth</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t, i) => (
                <tr key={t.name} className={`border-b border-[var(--color-neutral-100)] hover:bg-[var(--color-primary-100)]/30 transition-colors ${i === 0 ? "bg-[var(--color-primary-100)]/40" : ""}`}>
                  <td className="py-3 font-medium">
                    <div className="flex items-center gap-2">
                      {i === 0 && <Icon name="medal" size={16} />}
                      {t.name}
                    </div>
                  </td>
                  <td className="py-3 font-semibold">${t.mrr.toLocaleString()}</td>
                  <td className="py-3">{t.orders}</td>
                  <td className="py-3">
                    <Badge variant={t.growth.startsWith("+") ? "success" : "error"} size="sm" dot>
                      {t.growth}
                    </Badge>
                  </td>
                </tr>
              ))}
              <tr className="font-bold border-t-2 border-[var(--color-primary-200)] bg-[var(--color-primary-100)]/20">
                <td className="py-3 flex items-center gap-1"><Icon name="chart" size={14} /> Total</td>
                <td className="py-3 gradient-text-green">${totalMRR.toLocaleString()}</td>
                <td className="py-3">{totalOrders}</td>
                <td className="py-3"><Badge variant="success" size="sm" dot>+6%</Badge></td>
              </tr>
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}