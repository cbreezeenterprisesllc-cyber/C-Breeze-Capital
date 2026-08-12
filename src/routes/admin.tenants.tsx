import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { Input } from "~/components/Input";
import { Modal } from "~/components/Modal";
import { Icon } from "~/components/Icon";

export const Route = createFileRoute("/admin/tenants")({
  component: TenantsPage,
});

const mockTenants = [
  { id: "1", name: "Green Haven Dispensary", slug: "green-haven", store: "Green Haven", email: "owner@greenhaven.com", status: "active", plan: "Pro", since: "Jan 2025", color: "#2D6A4F" },
  { id: "2", name: "Urban Leaf Co.", slug: "urban-leaf", store: "Urban Leaf", email: "info@urbanleaf.com", status: "active", plan: "Pro", since: "Mar 2025", color: "#1B4332" },
  { id: "3", name: "Mountain Meds", slug: "mountain-meds", store: "Mountain Meds", email: "hello@mountainmeds.com", status: "trial", plan: "Starter", since: "Jun 2026", color: "#40916C" },
  { id: "4", name: "Coastal Care", slug: "coastal-care", store: "Coastal Care", email: "info@coastalcare.com", status: "active", plan: "Pro", since: "Feb 2025", color: "#52B788" },
];

function TenantsPage() {
  const [tenants] = useState(mockTenants);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const openAdd = () => { setEditing(null); setShowModal(true); };
  const openEdit = (t: any) => { setEditing(t); setShowModal(true); };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-[var(--font-heading)] gradient-text-green flex items-center gap-2"><Icon name="shop" size={28} /> Tenants</h1>
        <Button variant="neon" onClick={openAdd}>+ Add Tenant</Button>
      </div>

      <Card padding="none" className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-[var(--color-primary-100)] text-[var(--color-primary-800)]">
              <th className="p-4 font-medium">Store</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Plan</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Since</th>
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id} className="border-t border-[var(--color-neutral-200)] hover:bg-[var(--color-primary-100)]/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm" style={{ backgroundColor: t.color }}>{t.store.charAt(0)}</div>
                    <div>
                      <p className="font-medium">{t.store}</p>
                      <p className="text-xs text-[var(--color-neutral-500)]">{t.name}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-[var(--color-neutral-500)]">{t.email}</td>
                <td className="p-4"><Badge variant="primary" size="sm">{t.plan}</Badge></td>
                <td className="p-4"><Badge variant={t.status === "active" ? "success" : "warning"} size="sm" dot>{t.status}</Badge></td>
                <td className="p-4 text-[var(--color-neutral-500)]">{t.since}</td>
                <td className="p-4">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>✏️ Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={<span className="flex items-center gap-2"><Icon name={editing ? "pencil" : "shop"} size={18} /> {editing ? "Edit Tenant" : "Add Tenant"}</span>} size="md">
        <div className="space-y-4 animate-scale-in">
          <Input label="Store Name" defaultValue={editing?.store} />
          <Input label="Business Name" defaultValue={editing?.name} />
          <Input label="Slug" defaultValue={editing?.slug} placeholder="my-dispensary" />
          <Input label="Contact Email" type="email" defaultValue={editing?.email} />
          <div className="flex gap-4">
            <Input label="Primary Color" defaultValue={editing?.color || "#2D6A4F"} />
            <Input label="Plan" defaultValue={editing?.plan || "Starter"} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="neon" onClick={() => setShowModal(false)} className="inline-flex items-center gap-1">{editing ? <><Icon name="pencil" size={14} /> Save</> : <><Icon name="check" size={14} /> Create Tenant</>}</Button>
        </div>
      </Modal>
    </div>
  );
}