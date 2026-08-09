import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { Icon, type IconName } from "~/components/Icon";

export const Route = createFileRoute("/dashboard/merchant/")({
  component: MerchantDashboard,
});

const recentOrders = [
  { id: "ORD-1042", customer: "John D.", total: 52.00, status: "preparing", time: "5m ago" },
  { id: "ORD-1041", customer: "Sarah M.", total: 45.00, status: "in_transit", time: "12m ago" },
  { id: "ORD-1040", customer: "Mike R.", total: 38.00, status: "delivered", time: "30m ago" },
  { id: "ORD-1039", customer: "Anna K.", total: 72.00, status: "pending", time: "45m ago" },
];

const statusBadge: Record<string, "warning" | "info" | "success" | "primary" | "neutral"> = {
  pending: "warning", preparing: "primary", in_transit: "success", delivered: "neutral",
};

const statusIcons: Record<string, any> = {
  pending: <Icon name="clock" size={12} />, preparing: <Icon name="chef" size={12} />, in_transit: <Icon name="car" size={12} />, delivered: <Icon name="check" size={12} />,
};

function MerchantDashboard() {
  const [period] = useState("30d");

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-[var(--font-heading)] gradient-text-green flex items-center gap-2">
          <Icon name="chart" size={28} /> Dashboard
        </h1>
        <select className="px-3 py-2 rounded-xl border border-[var(--color-neutral-200)] bg-white text-sm focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)] transition-colors" value={period}>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[{ label: "Total Sales", value: "$12,420", change: "+12%", up: true, icon: "money" as IconName },
          { label: "Orders", value: "147", change: "+8%", up: true, icon: "package" as IconName },
          { label: "Active Items", value: "32", change: "—", up: null, icon: "leaf" as IconName },
          { label: "Avg Delivery", value: "18min", change: "-2min", up: true, icon: "truck" as IconName },
        ].map((kpi, i) => (
          <Card key={i} padding="md" hover glow className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
            <CardBody>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-[var(--color-neutral-500)]">{kpi.label}</p>
                <Icon name={kpi.icon} size={18} />
              </div>
              <p className="text-3xl font-bold gradient-text-green">{kpi.value}</p>
              {kpi.change !== "—" ? (
                <span className={`text-sm font-medium inline-flex items-center gap-1 mt-1 ${kpi.up ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}`}>
                  {kpi.up ? "↑" : "↓"} {kpi.change}
                </span>
              ) : (
                <span className="text-sm text-[var(--color-neutral-400)] mt-1 inline-block">—</span>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card padding="lg" className="mb-8 animate-fade-in-up delay-200">
        <CardHeader>
          <h2 className="text-lg font-[var(--font-heading)] text-[var(--color-neutral-800)] flex items-center gap-2"><Icon name="clipboard" size={18} /> Recent Orders</h2>
          <Button variant="ghost" size="sm">View All →</Button>
        </CardHeader>
        <CardBody>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-neutral-500)] border-b border-[var(--color-neutral-200)]">
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-[var(--color-neutral-100)] hover:bg-[var(--color-primary-100)]/30 cursor-pointer transition-colors">
                  <td className="py-3 font-medium">{o.id}</td>
                  <td className="py-3">{o.customer}</td>
                  <td className="py-3 font-semibold">${o.total.toFixed(2)}</td>
                  <td className="py-3">
                    <Badge variant={statusBadge[o.status] || "neutral"} size="sm">
                      {statusIcons[o.status] || ""} {o.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-[var(--color-neutral-500)]">{o.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Live Orders */}
      <Card padding="lg" className="animate-fade-in-up delay-300">
        <CardHeader>
          <h2 className="text-lg font-[var(--font-heading)] text-[var(--color-neutral-800)] flex items-center gap-2">
            <span className="relative flex h-3 w-3 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-success)]" /></span>
            Live Orders <span className="text-sm text-[var(--color-neutral-400)] font-normal">(3)</span>
          </h2>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-success)]/5 border border-[var(--color-success)]/10">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-success)]" /></span>
            <span className="flex-1 text-sm font-medium">Driver en route — 8 min away</span>
            <Badge variant="success" size="sm" dot>In Transit</Badge>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-primary-100)]">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary-500)] opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-primary-500)]" /></span>
            <span className="flex-1 text-sm font-medium">Preparing order — ~5 min</span>
            <Badge variant="primary" size="sm">Preparing</Badge>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/10">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-amber-500)] opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-amber-500)]" /></span>
            <span className="flex-1 text-sm font-medium">Awaiting driver — 15+ min</span>
            <Badge variant="warning" size="sm">Pending</Badge>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}