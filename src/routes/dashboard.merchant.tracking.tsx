import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHeader, CardBody, CardFooter } from "~/components/Card";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { Icon } from "~/components/Icon";

export const Route = createFileRoute("/dashboard/merchant/tracking")({
  component: TrackingPage,
});

const activeOrders = [
  { id: "ORD-1041", customer: "Sarah M.", status: "in_transit", driver: "Mike D.", eta: "8 min", color: "success" },
  { id: "ORD-1042", customer: "John D.", status: "preparing", driver: "Pending", eta: "—", color: "warning" },
  { id: "ORD-1039", customer: "Anna K.", status: "pending", driver: "Unassigned", eta: "—", color: "neutral" },
];

const drivers = [
  { name: "Mike D.", status: "Active", orders: 3, rating: 4.9 },
  { name: "Sara L.", status: "Idle", orders: 1, rating: 4.7 },
  { name: "Tom K.", status: "Offline", orders: 0, rating: 4.5 },
];

function TrackingPage() {
  return (
    <div>
      <h1 className="text-[var(--text-h2)] font-[var(--font-heading)] mb-8">Live Deliveries</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Map placeholder */}
        <div className="lg:col-span-2">
          <Card padding="lg">
            <CardBody>
              <div className="h-80 bg-[var(--color-primary-100)] rounded-xl flex items-center justify-center text-[var(--color-primary-400)]">
                <div className="text-center">
                  <div className="text-5xl mb-3"><Icon name="target" size={48} /></div>
                  <p className="text-lg font-medium">Map View</p>
                  <p className="text-sm">Driver locations and routes appear here</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Active orders */}
        <div>
          <Card padding="md">
            <CardHeader><h2 className="font-[var(--font-heading)] text-lg">Active Orders</h2></CardHeader>
            <CardBody className="space-y-3">
              {activeOrders.map(o => (
                <div key={o.id} className="p-3 rounded-lg border border-[var(--color-neutral-200)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{o.customer}</span>
                    <Badge variant={o.color as any} size="sm">{o.status}</Badge>
                  </div>
                  <p className="text-xs text-[var(--color-neutral-500)]">Driver: {o.driver}</p>
                  <p className="text-xs text-[var(--color-neutral-500)]">ETA: {o.eta}</p>
                  <Button size="sm" variant="ghost" className="mt-2">Track Live</Button>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Drivers */}
      <Card padding="lg">
        <CardHeader><h2 className="text-[var(--text-h4)] font-[var(--font-heading)]">Drivers</h2></CardHeader>
        <CardBody>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-neutral-500)] border-b border-[var(--color-neutral-200)]">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Active Orders</th>
                <th className="pb-3 font-medium">Rating</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(d => (
                <tr key={d.name} className="border-b border-[var(--color-neutral-100)]">
                  <td className="py-3 font-medium">{d.name}</td>
                  <td className="py-3"><Badge variant={d.status === "Active" ? "success" : d.status === "Idle" ? "warning" : "neutral"} size="sm">{d.status}</Badge></td>
                  <td className="py-3">{d.orders}</td>
                  <td className="py-3"><Icon name="star" size={14} /> {d.rating}</td>
                  <td className="py-3"><Button variant="ghost" size="sm">View</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}