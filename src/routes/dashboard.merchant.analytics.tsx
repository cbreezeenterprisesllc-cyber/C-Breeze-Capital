import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Badge } from "~/components/Badge";
import { Button } from "~/components/Button";
import { getChatToken, chatLogin, DEMO_ACCOUNTS } from "~/lib/chat-client";

export const Route = createFileRoute("/dashboard/merchant/analytics")({
  component: AnalyticsPage,
});

function decodeTenant(token: string | null): { role?: string; tenantId?: string } {
  if (!token) return {};
  try {
    const part = token.split(".")[1];
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return { role: json.role, tenantId: json.tenantId };
  } catch { return {}; }
}
type Analytics = {
  periodDays: number;
  summary: { revenue: number; orders: number; aov: number; leadCount: number };
  customers: { totalDistinct: number; newCustomers: number; repeatCustomers: number; retentionPct: number };
  categories: Array<{ category: string; units: number; revenue: number }>;
  topProducts: Array<{ name: string; qty: number; revenue: number }>;
  geographic: Array<{ area: string; orders: number; revenue: number }>;
  acquisition: { conversionPct: number };
};

function AnalyticsPage() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [days, setDays] = useState("30");
  const [data, setData] = useState<Analytics | null>(null);
  const auth = () => ({ Authorization: "Bearer " + (getChatToken() || "") });
  const detach = useCallback(() => {
    const { role, tenantId } = decodeTenant(getChatToken());
    setTenantId(role === "merchant" && tenantId ? tenantId : null);
  }, []);
  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await fetch(`/api/analytics?days=${days}`, { headers: auth() });
      const j = await res.json();
      setData((j.data as Analytics) || null);
    } catch { setData(null); }
  }, [tenantId, days]);
  useEffect(() => { detach(); }, [detach]);
  useEffect(() => { if (tenantId) load(); }, [tenantId, load]);
  const signIn = async (role: string) => { await chatLogin(role); detach(); };

  if (!tenantId) {
    return (
      <div className="max-w-md mx-auto mt-10 text-center">
        <h1 className="text-xl font-semibold mb-4">Analytics</h1>
        <p className="text-sm text-gray-500 mb-4">Sign in as a merchant to view aggregate analytics for your storefront.</p>
        {DEMO_ACCOUNTS.filter((a) => a.mode === "demo").map((a) => (
          <Button key={a.role} variant="primary" className="m-1" onClick={() => signIn(a.role)}>Sign in as {a.label}</Button>
        ))}
      </div>
    );
  }
  const s = data?.summary;
  const c = data?.customers;
  const fmt = (n: number | undefined) => (n == null ? "—" : `$${Number(n).toFixed(2)}`);
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-heading">Analytics</h1>
        <select className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm" value={days} onChange={(e) => setDays(e.target.value)}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Aggregate, de-identified metrics for your storefront. Individual customer purchase data is never exposed.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card><CardBody><p className="text-xs text-gray-500">Revenue</p><p className="text-2xl font-bold">{fmt(s?.revenue)}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-gray-500">Orders</p><p className="text-2xl font-bold">{s?.orders ?? "—"}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-gray-500">Avg Order Value</p><p className="text-2xl font-bold">{fmt(s?.aov)}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-gray-500">Leads Captured</p><p className="text-2xl font-bold">{s?.leadCount ?? "—"}</p></CardBody></Card>
      </div>

      <Card padding="lg" className="mb-8">
        <CardHeader><h2 className="text-h4 font-heading">Customer Growth & Retention</h2></CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div><p className="text-xs text-gray-500">Total customers</p><p className="text-xl font-bold">{c?.totalDistinct ?? "—"}</p></div>
            <div><p className="text-xs text-gray-500">New (period)</p><p className="text-xl font-bold">{c?.newCustomers ?? "—"}</p></div>
            <div><p className="text-xs text-gray-500">Repeat</p><p className="text-xl font-bold">{c?.repeatCustomers ?? "—"}</p></div>
            <div><p className="text-xs text-gray-500">Retention</p><p className="text-xl font-bold">{c?.retentionPct ?? "—"}%</p></div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Conversion (leads → orders): {data?.acquisition?.conversionPct ?? "—"}%</p>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card padding="lg">
          <CardHeader><h2 className="text-h4 font-heading">Popular Categories</h2></CardHeader>
          <CardBody>
            {(data?.categories && data.categories.length) ? (
              <div className="space-y-3">
                {data.categories.map((cat) => (
                  <div key={cat.category} className="flex items-center gap-3">
                    <div className="flex-1"><p className="font-medium text-sm">{cat.category}</p><p className="text-xs text-gray-400">{cat.units} units</p></div>
                    <span className="font-bold text-sm">{fmt(cat.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No category data yet.</p>}
          </CardBody>
        </Card>
        <Card padding="lg">
          <CardHeader><h2 className="text-h4 font-heading">Top Products</h2></CardHeader>
          <CardBody>
            {(data?.topProducts && data.topProducts.length) ? (
              <div className="space-y-3">
                {data.topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-6">#{i + 1}</span>
                    <div className="flex-1"><p className="font-medium text-sm">{p.name}</p><p className="text-xs text-gray-400">{p.qty} sold</p></div>
                    <span className="font-bold text-sm">{fmt(p.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No product data yet.</p>}
          </CardBody>
        </Card>
      </div>

      <Card padding="lg">
        <CardHeader><h2 className="text-h4 font-heading">Demand by Area</h2></CardHeader>
        <CardBody>
          {(data?.geographic && data.geographic.length) ? (
            <div className="space-y-3">
              {data.geographic.map((g) => (
                <div key={g.area} className="flex items-center gap-3">
                  <div className="flex-1"><p className="font-medium text-sm">{g.area}</p></div>
                  <span className="text-sm text-gray-500">{g.orders} orders</span>
                  <span className="font-bold text-sm">{fmt(g.revenue)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">No geographic data yet.</p>}
        </CardBody>
      </Card>
    </div>
  );
}
