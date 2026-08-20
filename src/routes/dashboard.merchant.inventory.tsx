import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card } from "~/components/Card";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { Modal } from "~/components/Modal";
import { Icon } from "~/components/Icon";
import { getChatToken, chatLogin, DEMO_ACCOUNTS } from "~/lib/chat-client";

export const Route = createFileRoute("/dashboard/merchant/inventory")({
  component: InventoryPage,
});

function decodeTenantId(token: string | null): { role?: string; tenantId?: string } {
  if (!token) return {};
  try {
    const part = token.split(".")[1];
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return { role: json.role, tenantId: json.tenantId };
  } catch { return {}; }
}

type Product = {
  id: string;
  name: string;
  category_name?: string;
  price: number;
  stock: number;
  thc_content?: string;
  cbd_content?: string;
  strain_type?: string;
  unit?: string;
  description?: string;
  is_active: number;
};
type Category = { id: string; name: string };

const EMPTY_FORM = { name: "", categoryId: "", price: "", stock: "", thc: "", cbd: "", strain: "", unit: "g", description: "" };

function InventoryPage() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detachTenant = useCallback(() => {
    const t = getChatToken();
    const { role, tenantId } = decodeTenantId(t);
    if (t && role === "merchant" && tenantId) setTenantId(tenantId);
    else setTenantId(null);
  }, []);

  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      const [p, c] = await Promise.all([
        fetch(`/api/products?tenantId=${tenantId}&all=1`).then((r) => r.json()),
        fetch(`/api/categories?tenantId=${tenantId}`).then((r) => r.json()),
      ]);
      setProducts((p.data as Product[]) || []);
      setCategories((c.data as Category[]) || []);
    } catch { /* ignore */ }
  }, [tenantId]);

  useEffect(() => { detachTenant(); }, [detachTenant]);
  useEffect(() => { if (tenantId) load(); }, [tenantId, load]);

  const signIn = async (role: string) => { await chatLogin(role); setMsg(null); detachTenant(); };

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setError(null); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name || "",
      categoryId: (p as any).category_id || "",
      price: String(p.price ?? ""),
      stock: String(p.stock ?? ""),
      thc: p.thc_content || "",
      cbd: p.cbd_content || "",
      strain: p.strain_type || "",
      unit: p.unit || "g",
      description: p.description || "",
    });
    setError(null);
    setShowModal(true);
  };

  const save = async () => {
    setError(null);
    if (!form.name.trim() || form.price === "") { setError("Name and price are required."); return; }
    setSaving(true);
    const body = {
      name: form.name.trim(),
      categoryId: form.categoryId || null,
      price: Number(form.price),
      stock: Number(form.stock) || 0,
      thcContent: form.thc,
      cbdContent: form.cbd,
      strainType: form.strain,
      unit: form.unit || "g",
      description: form.description,
      is_active: 1,
    };
    try {
      const url = editing ? `/api/products/${editing.id}` : `/api/products`;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok) { setError(payload.error || "Save failed."); setSaving(false); return; }
      setMsg(editing ? "Product updated — it now shows on the storefront." : "Product added — live on the storefront.");
      setShowModal(false);
      load();
    } catch { setError("Network error."); }
    setSaving(false);
  };

  const remove = async (p: Product) => {
    if (!window.confirm(`Delete "${p.name}"? It will be removed from the storefront (order history is kept).`)) return;
    await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    setMsg(`"${p.name}" removed from the storefront.`);
    load();
  };

  const filtered = products.filter((p) =>
    (search ? (p.name || "").toLowerCase().includes(search.toLowerCase()) : true) &&
    (catFilter !== "all" ? (p.category_name || "Uncategorized") === catFilter : true)
  );
  const stockBadge = (s: number) => (s > 20 ? { v: "success" as const, t: "In Stock" } : s > 0 ? { v: "warning" as const, t: "Low Stock" } : { v: "error" as const, t: "Out of Stock" });
  const catOptions = Array.from(new Set(products.map((p) => p.category_name || "Uncategorized")));

  if (!tenantId) {
    return (
      <Card>
        <div className="p-10 text-center space-y-3">
          <Icon name="package" size={28} />
          <p className="font-semibold">Sign in to manage inventory</p>
          <p className="text-sm text-[var(--color-neutral-500)]">Use a merchant account to add, edit, and delete products for your storefront.</p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {DEMO_ACCOUNTS.filter((a) => a.role === "merchant").map((a) => (
              <Button key={a.email} onClick={() => signIn(a.role)}>{a.label.split("·")[1].trim()}</Button>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-[var(--font-heading)] gradient-text-green flex items-center gap-2"><Icon name="package" size={28} /> Inventory</h1>
        <Button variant="neon" onClick={openAdd}>+ Add Product</Button>
      </div>
      {msg && <div className="mb-4 rounded-lg bg-[var(--color-success-50)] border border-[var(--color-success-200)] px-4 py-2 text-sm text-[var(--color-success-700)]">{msg}</div>}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 max-w-xs">
          <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-neutral-200)] bg-white px-4 py-2 text-sm focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)] transition-colors" />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-[var(--color-neutral-200)] bg-white text-sm focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)] transition-colors">
          <option value="all">All Categories</option>
          {catOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <Card padding="none" className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-[var(--color-primary-100)] text-[var(--color-primary-800)]">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">Stock</th>
              <th className="p-4 font-medium">Price</th>
              <th className="p-4 font-medium">THC</th>
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const sb = stockBadge(p.stock || 0);
              return (
                <tr key={p.id} className={`border-t border-[var(--color-neutral-200)] hover:bg-[var(--color-primary-100)]/30 transition-colors ${p.is_active === 0 ? "opacity-50" : ""}`}>
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4"><Badge variant="primary" size="sm">{p.category_name || "Uncategorized"}</Badge></td>
                  <td className="p-4"><Badge variant={sb.v} size="sm" dot>{sb.t}</Badge></td>
                  <td className="p-4 font-semibold">${Number(p.price || 0).toFixed(2)}</td>
                  <td className="p-4 text-[var(--color-neutral-500)]">{p.thc_content || "—"}</td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(p)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      {filtered.length === 0 && <p className="text-center py-12 text-[var(--color-neutral-400)]">No products match your filters.</p>}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={<span className="flex items-center gap-2"><Icon name="package" size={18} /> {editing ? "Edit Product" : "Add Product"}</span>} size="md">
        <div className="space-y-4 animate-scale-in">
          {error && <div className="rounded-lg bg-[var(--color-danger-50)] px-3 py-2 text-sm text-[var(--color-danger-700)]">{error}</div>}
          <div>
            <label className="text-xs font-medium text-[var(--color-neutral-600)]">Product Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Blue Dream"
              className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--color-neutral-600)]">Category</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm">
                <option value="">Uncategorized</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-neutral-600)]">Strain type</label>
              <input value={form.strain} onChange={(e) => setForm({ ...form, strain: e.target.value })} placeholder="e.g. Sativa"
                className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--color-neutral-600)]">Price ($)</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-neutral-600)]">Stock</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--color-neutral-600)]">THC</label>
              <input value={form.thc} onChange={(e) => setForm({ ...form, thc: e.target.value })} placeholder="e.g. 22%"
                className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-neutral-600)]">CBD</label>
              <input value={form.cbd} onChange={(e) => setForm({ ...form, cbd: e.target.value })} placeholder="e.g. 0.1%"
                className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-neutral-600)]">Unit</label>
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="g"
                className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--color-neutral-600)]">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="mt-1 w-full rounded-lg border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="neon" onClick={save} disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Add Product"}</Button>
        </div>
      </Modal>
    </div>
  );
}
