import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "~/components/Card";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { Modal } from "~/components/Modal";

export const Route = createFileRoute("/dashboard/merchant/orders")({
  component: OrdersPage,
});

const orders = [
  { id: "ORD-1042", customer: "John Doe", phone: "(555) 123-4567", address: "123 Main St, Apt 4", items: [{ name: "Blue Dream", qty: 1, price: 45 }], subtotal: 52, delivery: 5, total: 57, status: "preparing", time: "5m" },
  { id: "ORD-1041", customer: "Sarah Miller", phone: "(555) 987-6543", address: "456 Oak Ave", items: [{ name: "Pre-Roll 3pk", qty: 2, price: 22 }], subtotal: 45, delivery: 5, total: 50, status: "in_transit", time: "12m" },
  { id: "ORD-1040", customer: "Mike R.", phone: "(555) 456-7890", address: "789 Pine Rd", items: [{ name: "CBD Tincture", qty: 1, price: 35 }], subtotal: 38, delivery: 0, total: 38, status: "delivered", time: "30m" },
  { id: "ORD-1039", customer: "Anna K.", phone: "(555) 234-5678", address: "321 Elm St", items: [{ name: "Gummies Pack", qty: 2, price: 28 }, { name: "Blue Dream", qty: 1, price: 45 }], subtotal: 72, delivery: 5, total: 77, status: "pending", time: "45m" },
];

const statusColors: Record<string, "neutral" | "primary" | "warning" | "info" | "success" | "error"> = {
  pending: "neutral", confirmed: "primary", preparing: "warning", assigned: "info", in_transit: "success", delivered: "success", cancelled: "error",
};

const statusOptions = ["pending", "confirmed", "preparing", "in_transit", "delivered", "cancelled"];

function OrdersPage() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const current = orders.find(o => o.id === selected?.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[var(--text-h2)] font-[var(--font-heading)]">Orders</h1>
        <select className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <Card padding="none">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]">
              <th className="p-4 font-medium">#</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Items</th>
              <th className="p-4 font-medium">Total</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-t border-[var(--color-neutral-200)] hover:bg-[var(--color-neutral-50)] cursor-pointer" onClick={() => setSelected(o)}>
                <td className="p-4 font-medium">{o.id}</td>
                <td className="p-4">{o.customer}</td>
                <td className="p-4">{o.items.length}</td>
                <td className="p-4 font-medium">${o.total.toFixed(2)}</td>
                <td className="p-4"><Badge variant={statusColors[o.status] || "neutral"} size="sm">{o.status}</Badge></td>
                <td className="p-4 text-[var(--color-neutral-500)]">{o.time} ago</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={current ? `Order ${current.id}` : ""} size="lg">
        {current && (
          <div>
            <div className="flex justify-between mb-4">
              <Badge variant={statusColors[current.status] || "neutral"} size="md">{current.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div><p className="text-[var(--color-neutral-500)]">Customer</p><p className="font-medium">{current.customer}</p></div>
              <div><p className="text-[var(--color-neutral-500)]">Phone</p><p className="font-medium">{current.phone}</p></div>
              <div className="col-span-2"><p className="text-[var(--color-neutral-500)]">Address</p><p className="font-medium">{current.address}</p></div>
            </div>
            <div className="border-t border-[var(--color-neutral-200)] pt-4 mb-4">
              {current.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between py-1 text-sm"><span>{item.name} × {item.qty}</span><span>${(item.price * item.qty).toFixed(2)}</span></div>
              ))}
            </div>
            <div className="border-t border-[var(--color-neutral-200)] pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-[var(--color-neutral-500)]">Subtotal</span><span>${current.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-neutral-500)]">Delivery</span><span>${current.delivery.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-base"><span>Total</span><span>${current.total.toFixed(2)}</span></div>
            </div>
            <CardFooter>
              <div className="flex gap-3">
                <Button size="sm" variant="secondary">Assign Driver</Button>
                <Button size="sm" variant="secondary">Mark Ready</Button>
                <Button size="sm" variant="danger">Cancel</Button>
              </div>
            </CardFooter>
          </div>
        )}
      </Modal>
    </div>
  );
}