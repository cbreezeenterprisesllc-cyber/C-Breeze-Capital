import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Badge } from "~/components/Badge";

export const Route = createFileRoute("/admin/revenue")({
  component: RevenuePage,
});

const tenants = [
  { name: "Green Haven", mrr: 12400, orders: 147, growth: 12, color: "#2D6A4F" },
  { name: "Urban Leaf", mrr: 9800, orders: 112, growth: 8, color: "#1B4332" },
  { name: "Coastal Care", mrr: 7200, orders: 89, growth: 5, color: "#52B788" },
  { name: "Mountain Meds", mrr: 5100, orders: 56, growth: -2, color: "#40916C" },
  { name: "High Rise", mrr: 3400, orders: 41, growth: 15, color: "#74C69D" },
];

const monthlyData = [
  { month: "Jan", revenue: 28000, orders: 320 },
  { month: "Feb", revenue: 31000, orders: 345 },
  { month: "Mar", revenue: 29000, orders: 330 },
  { month: "Apr", revenue: 34000, orders: 380 },
  { month: "May", revenue: 37000, orders: 410 },
  { month: "Jun", revenue: 38500, orders: 435 },
];

const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

function RevenuePage() {
  const totalMRR = tenants.reduce((s, t) => s + t.mrr, 0);
  return (
    <div>
      <h1 className="text-[var(--text-h2)] font-[var(--font-heading)] mb-8">Revenue Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card padding="md"><CardBody><p className="text-sm text-[var(--color-neutral-500)]">Total MRR</p><p className="text-3xl font-bold">${(totalMRR / 1000).toFixed(1)}K</p><Badge variant="success" size="sm">+8.2%</Badge></CardBody></Card>
        <Card padding="md"><CardBody><p className="text-sm text-[var(--color-neutral-500)]">Avg Order Value</p><p className="text-3xl font-bold">$84.35</p><Badge variant="success" size="sm">+3%</Badge></CardBody></Card>
        <Card padding="md"><CardBody><p className="text-sm text-[var(--color-neutral-500)]">Monthly Commission</p><p className="text-3xl font-bold">$3,850</p><Badge variant="success" size="sm">+12%</Badge></CardBody></Card>
      </div>

      <Card padding="lg" className="mb-8">
        <CardHeader><h2 className="text-[var(--text-h4)] font-[var(--font-heading)]">Revenue Over Time</h2></CardHeader>
        <CardBody>
          <div className="flex items-end gap-3 h-48">
            {monthlyData.map(d => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-[var(--color-neutral-500)]">${(d.revenue / 1000).toFixed(0)}K</span>
                <div className="w-full bg-[var(--color-primary-500)] rounded-t-md transition-all" style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: "20px" }} />
                <span className="text-xs text-[var(--color-neutral-500)]">{d.month}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card padding="lg">
        <CardHeader><h2 className="text-[var(--text-h4)] font-[var(--font-heading)]">Per-Tenant Revenue</h2></CardHeader>
        <CardBody>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[var(--color-neutral-500)] border-b"><th className="pb-3 font-medium">Tenant</th><th className="pb-3 font-medium">MRR</th><th className="pb-3 font-medium">Orders</th><th className="pb-3 font-medium">Growth</th><th className="pb-3 font-medium">Revenue Share</th></tr></thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.name} className="border-b border-[var(--color-neutral-100)]">
                  <td className="py-3"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />{t.name}</div></td>
                  <td className="py-3 font-medium">${t.mrr.toLocaleString()}</td>
                  <td className="py-3">{t.orders}</td>
                  <td className="py-3"><Badge variant={t.growth >= 0 ? "success" : "error"} size="sm">{t.growth >= 0 ? "+" : ""}{t.growth}%</Badge></td>
                  <td className="py-3">{((t.mrr / totalMRR) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}