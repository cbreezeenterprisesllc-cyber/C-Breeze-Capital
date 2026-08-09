import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "~/components/Card";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { Input } from "~/components/Input";
import { Select } from "~/components/Select";
import { Modal } from "~/components/Modal";

export const Route = createFileRoute("/dashboard/merchant/inventory")({
  component: InventoryPage,
});

const mockProducts = [
  { id: "p1", name: "Blue Dream", category: "Flower", strain: "Sativa", stock: 45, price: 45.00, thc: "22%", cbd: "0.1%", image: "🍃" },
  { id: "p2", name: "Gummies Pack", category: "Edible", strain: "", stock: 120, price: 28.00, thc: "10mg", cbd: "0%", image: "🍬" },
  { id: "p3", name: "CBD Tincture", category: "Tincture", strain: "", stock: 30, price: 35.00, thc: "0%", cbd: "15%", image: "💧" },
  { id: "p4", name: "OG Kush", category: "Flower", strain: "Indica", stock: 0, price: 50.00, thc: "25%", cbd: "0.2%", image: "🍃" },
  { id: "p5", name: "Pre-Roll 3pk", category: "Flower", strain: "Hybrid", stock: 65, price: 22.00, thc: "20%", cbd: "0.1%", image: "🚬" },
];

function InventoryPage() {
  const [products] = useState(mockProducts);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const filtered = products.filter(p =>
    (search ? p.name.toLowerCase().includes(search.toLowerCase()) : true) &&
    (catFilter !== "all" ? p.category === catFilter : true)
  );

  const stockLevel = (s: number) => s > 20 ? "success" : s > 5 ? "warning" : "error";
  const stockBadge = (s: number) => s > 20 ? { v: "success" as const, t: "In Stock" } : s > 0 ? { v: "warning" as const, t: "Low Stock" } : { v: "error" as const, t: "Out of Stock" };

  const openAdd = () => { setEditing(null); setShowModal(true); };
  const openEdit = (p: any) => { setEditing(p); setShowModal(true); };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-[var(--font-heading)] gradient-text-green">📦 Inventory</h1>
        <Button variant="neon" onClick={openAdd}>+ Add Product</Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 max-w-xs">
          <Input placeholder="🔍 Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="px-4 py-2 rounded-xl border border-[var(--color-neutral-200)] bg-white text-sm focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)] transition-colors" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="Flower">Flower</option>
          <option value="Edible">Edible</option>
          <option value="Tincture">Tincture</option>
          <option value="Vape">Vape</option>
          <option value="Topical">Topical</option>
        </select>
      </div>

      <Card padding="none" className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-[var(--color-primary-100)] text-[var(--color-primary-800)]">
              <th className="p-4 font-medium w-12"></th>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">Stock</th>
              <th className="p-4 font-medium">Price</th>
              <th className="p-4 font-medium">THC</th>
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-t border-[var(--color-neutral-200)] hover:bg-[var(--color-primary-100)]/30 transition-colors">
                <td className="p-4 text-2xl text-center">{p.image}</td>
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4"><Badge variant="primary" size="sm">{p.category}</Badge></td>
                <td className="p-4">
                  <Badge variant={stockBadge(p.stock).v} size="sm" dot>
                    {p.stock} {stockBadge(p.stock).t === "Out of Stock" ? "(OOS)" : ""}
                  </Badge>
                </td>
                <td className="p-4 font-semibold">${p.price.toFixed(2)}</td>
                <td className="p-4 text-[var(--color-neutral-500)]">{p.thc}</td>
                <td className="p-4">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>✏️ Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {filtered.length === 0 && <p className="text-center py-12 text-[var(--color-neutral-400)]">No products match your filters.</p>}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "✏️ Edit Product" : "➕ Add Product"} size="md">
        <div className="space-y-4 animate-scale-in">
          <Input label="Product Name" defaultValue={editing?.name} placeholder="e.g. Blue Dream" />
          <Select label="Category" options={[{ value: "flower", label: "🌿 Flower" }, { value: "edible", label: "🍬 Edible" }, { value: "tincture", label: "💧 Tincture" }, { value: "vape", label: "💨 Vape" }, { value: "topical", label: "🧴 Topical" }]} />
          <div className="flex gap-4">
            <div className="flex-1"><Input label="Price ($)" type="number" defaultValue={editing?.price} /></div>
            <div className="flex-1"><Input label="Stock" type="number" defaultValue={editing?.stock} /></div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1"><Input label="THC %" defaultValue={editing?.thc} /></div>
            <div className="flex-1"><Input label="CBD %" defaultValue={editing?.cbd} /></div>
          </div>
          <Input label="Description" placeholder="Brief product description" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="neon" onClick={() => setShowModal(false)}>{editing ? "💾 Save Changes" : "➕ Add Product"}</Button>
        </div>
      </Modal>
    </div>
  );
}