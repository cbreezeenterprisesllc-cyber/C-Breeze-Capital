import { apiFetch } from "~/lib/api-config";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Button } from "~/components/Button";
import { Badge } from "~/components/Badge";
import { Modal } from "~/components/Modal";
import { Icon } from "~/components/Icon";

export const Route = createFileRoute("/admin/drivers")({
  component: AdminDriverApplications,
});

const statusConfig: Record<string, { variant: "warning" | "success" | "error" | "neutral"; label: string }> = {
  pending: { variant: "warning", label: "Pending" },
  approved: { variant: "success", label: "Approved" },
  rejected: { variant: "error", label: "Rejected" },
  suspended: { variant: "neutral", label: "Suspended" },
};

function AdminDriverApplications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const fetchApplications = async (status: string) => {
    try {
      const res = await apiFetch(`/api/admin/drivers/applications?status=${status}`);
      const data = await res.json();
      if (data.success) setApplications(data.data);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchApplications(filter);
  }, [filter]);

  const handleAction = async (appId: string, action: "approve" | "reject") => {
    try {
      const res = await apiFetch(`/api/admin/drivers/applications/${appId}/${action}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewedBy: "admin", notes: reviewNotes }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedApp(null);
        setReviewNotes("");
        fetchApplications(filter);
      }
    } catch (err) {
      console.error(`Failed to ${action} application:`, err);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-[var(--font-heading)] gradient-text-green"><Icon name="car" size={26} /> Driver Applications</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {["pending", "approved", "rejected", "suspended"].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all ${
              filter === s
                ? "bg-[var(--color-primary-800)] text-white shadow-md"
                : "bg-[var(--surface-primary)] border border-[var(--color-neutral-200)] text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)]"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="leaf-spinner" />
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-neutral-400)]">
          <div className="text-5xl mb-4"><Icon name="search" size={48} /></div>
          <p className="text-lg">No {filter} applications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any) => (
            <Card
              key={app.id}
              padding="md"
              hover
              onClick={() => { setSelectedApp(app); setReviewNotes(app.notes || ""); }}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-lg">
                    <Icon name="person" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold">{app.full_name}</p>
                    <p className="text-sm text-[var(--color-neutral-500)]">{app.email} · {app.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={statusConfig[app.status]?.variant || "neutral"} size="sm" dot>
                    {statusConfig[app.status]?.label || app.status}
                  </Badge>
                  <p className="text-xs text-[var(--color-neutral-400)] mt-1">
                    {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={!!selectedApp} onClose={() => setSelectedApp(null)} title="Application Details" size="lg">
        {selectedApp && (
          <div className="space-y-6 animate-scale-in">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-[var(--color-neutral-500)] uppercase tracking-wide">Personal</p>
                <p className="font-semibold">{selectedApp.full_name}</p>
                <p className="text-sm">{selectedApp.email}</p>
                <p className="text-sm">{selectedApp.phone}</p>
                <p className="text-sm">DOB: {selectedApp.date_of_birth}</p>
                <p className="text-sm">{selectedApp.address}, {selectedApp.city}, {selectedApp.state} {selectedApp.zip_code}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[var(--color-neutral-500)] uppercase tracking-wide">License</p>
                <p className="text-sm font-mono">{selectedApp.drivers_license_number}</p>
                <p className="text-sm">{selectedApp.drivers_license_state}</p>
                <p className="text-sm">Exp: {selectedApp.drivers_license_expiry}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[var(--color-neutral-500)] uppercase tracking-wide">Vehicle</p>
                <p className="text-sm">{selectedApp.vehicle_year} {selectedApp.vehicle_make} {selectedApp.vehicle_model}</p>
                <p className="text-sm">{selectedApp.vehicle_color} · Plate: {selectedApp.vehicle_plate}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[var(--color-neutral-500)] uppercase tracking-wide">Insurance</p>
                <p className="text-sm">{selectedApp.insurance_provider}</p>
                <p className="text-sm font-mono">{selectedApp.insurance_policy_number}</p>
              </div>
            </div>

            <div className="border-t border-[var(--color-neutral-200)] pt-4">
              <Badge variant={statusConfig[selectedApp.status]?.variant || "neutral"} size="md" dot>
                Status: {statusConfig[selectedApp.status]?.label || selectedApp.status}
              </Badge>
              {selectedApp.reviewed_at && (
                <p className="text-xs text-[var(--color-neutral-400)] mt-1">
                  Reviewed {new Date(selectedApp.reviewed_at).toLocaleString()} by {selectedApp.reviewed_by}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-1">Review Notes</label>
              <textarea
                className="w-full p-3 rounded-xl border border-[var(--color-neutral-200)] text-sm resize-none focus:border-[var(--color-primary-400)] focus:ring-1 transition-colors bg-[var(--surface-primary)]"
                rows={3}
                placeholder="Add notes about this application..."
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
              />
            </div>

            {selectedApp.status === "pending" && (
              <div className="flex gap-3">
                <Button
                  variant="neon"
                  className="flex-1"
                  onClick={() => handleAction(selectedApp.id, "approve")}
                >
                  <Icon name="check" size={16} /> Approve Application
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => handleAction(selectedApp.id, "reject")}
                >
                  <Icon name="cross" size={16} /> Reject Application
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}