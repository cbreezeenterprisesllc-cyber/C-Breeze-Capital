import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Badge } from "~/components/Badge";
import { Icon } from "~/components/Icon";

export const Route = createFileRoute("/dashboard/merchant/analytics")({
  component: AnalyticsPage,
});

const topProducts = [
  { rank: 1, name: "Blue Dream", revenue: 4200, category: "Flower" },
  { rank: 2, name: "OG Kush", revenue: 3800, category: "Flower" },
  { rank: 3, name: "Gummies Pack", revenue: 2100, category: "Edible" },
  { rank: 4, name: "Pre-Roll 3pk", revenue: 1800, category: "Flower" },
  { rank: 5, name: "CBD Tincture", revenue: 1200, category: "Tincture" },
];

const summary = [
  { metric: "Total Revenue", thisMonth: "$12,400", lastMonth: "$11,200", change: "+10%" },
  { metric: "Orders", thisMonth: "147", lastMonth: "132", change: "+11%" },
  { metric: "Avg Order Value", thisMonth: "$84.35", lastMonth: "$84.85", change: "-1%" },
  { metric: "Avg Delivery Time", thisMonth: "18.2 min", lastMonth: "19.5 min", change: "-7%" },
];

function AnalyticsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[var(--text-h2)] font-[var(--font-heading)]">Analytics</h1>
        <select className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm">
          <option value="30d">Last 30 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card padding="lg">
          <CardHeader><h2 className="text-[var(--text-h4)] font-[var(--font-heading)]">Revenue</h2></CardHeader>
          <CardBody><div className="h-48 bg-[var(--color-primary-100)] rounded-xl flex items-center justify-center text-[var(--color-primary-400)]"><div className="text-center"><div className="text-4xl mb-2"><Icon name="chart" size={48} /></div><p className="text-sm">Line chart: Revenue over time</p></div></div></CardBody>
        </Card>
        <Card padding="lg">
          <CardHeader><h2 className="text-[var(--text-h4)] font-[var(--font-heading)]">Order Volume</h2></CardHeader>
          <CardBody><div className="h-48 bg-[var(--color-neutral-100)] rounded-xl flex items-center justify-center text-[var(--color-neutral-400)]"><div className="text-center"><div className="text-4xl mb-2"><Icon name="chart" size={48} /></div><p className="text-sm">Bar chart: Orders per day</p></div></div></CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card padding="lg">
          <CardHeader><h2 className="text-[var(--text-h4)] font-[var(--font-heading)]">Top Products</h2></CardHeader>
          <CardBody>
            <div className="space-y-3">
              {topProducts.map(p => (
                <div key={p.rank} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[var(--color-neutral-400)] w-6">#{p.rank}</span>
                  <div className="flex-1"><p className="font-medium text-sm">{p.name}</p><p className="text-xs text-[var(--color-neutral-500)]">{p.category}</p></div>
                  <span className="font-bold text-sm">${(p.revenue / 1000).toFixed(1)}K</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card padding="lg">
          <CardHeader><h2 className="text-[var(--text-h4)] font-[var(--font-heading)]">Delivery Times</h2></CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-success)]/5">
                <span className="text-sm text-[var(--color-neutral-500)]">Average</span>
                <span className="font-bold text-lg">18 min</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-primary-100)]">
                <span className="text-sm text-[var(--color-neutral-500)]">Fastest</span>
                <span className="font-bold">8 min</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-warning)]/10">
                <span className="text-sm text-[var(--color-neutral-500)]">Slowest</span>
                <span className="font-bold">42 min</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card padding="lg">
        <CardHeader><h2 className="text-[var(--text-h4)] font-[var(--font-heading)]">Monthly Comparison</h2></CardHeader>
        <CardBody>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-neutral-500)] border-b border-[var(--color-neutral-200)]">
                <th className="pb-3 font-medium">Metric</th><th className="pb-3 font-medium">This Month</th><th className="pb-3 font-medium">Last Month</th><th className="pb-3 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {summary.map(s => (
                <tr key={s.metric} className="border-b border-[var(--color-neutral-100)]">
                  <td className="py-3 font-medium">{s.metric}</td>
                  <td className="py-3">{s.thisMonth}</td>
                  <td className="py-3">{s.lastMonth}</td>
                  <td className="py-3"><Badge variant={s.change.startsWith("+") ? "success" : "error"} size="sm">{s.change}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}