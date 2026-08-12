import { apiFetch } from "~/lib/api-config";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TopbarNav } from "~/components/Navigation";
import { Button } from "~/components/Button";
import { Card, CardHeader, CardBody } from "~/components/Card";
import { Input } from "~/components/Input";
import { Badge } from "~/components/Badge";
import { Icon } from "~/components/Icon";

export const Route = createFileRoute("/drivers/status")({
  component: DriverStatusPage,
});

function DriverStatusPage() {
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const [app, setApp] = useState<any>(null);
  const [error, setError] = useState("");

  const checkStatus = async () => {
    if (!email) return;
    setChecking(true);
    setError("");
    try {
      const res = await apiFetch(`/api/drivers/status?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) {
        setApp(data.data);
      } else {
        setError(data.error || "Failed to check status");
      }
    } catch {
      setError("Network error");
    } finally {
      setChecking(false);
    }
  };

  const statusIconMap: Record<string, React.ReactNode> = {
    pending: <Icon name="clock" size={14} />,
    approved: <Icon name="check" size={14} />,
    rejected: <Icon name="cross" size={14} />,
    suspended: <Icon name="clock" size={14} />,
    none: <Icon name="search" size={14} />,
  };
  const statusConfig: Record<string, { variant: "primary" | "success" | "warning" | "error" | "neutral"; label: string }> = {
    pending: { variant: "warning", label: "Under Review" },
    approved: { variant: "success", label: "Approved" },
    rejected: { variant: "error", label: "Not Approved" },
    suspended: { variant: "neutral", label: "Suspended" },
    none: { variant: "neutral", label: "Not Found" },
  };

  return (
    <div className="min-h-dvh bg-[var(--surface-secondary)]">
      <TopbarNav
        branding={{ title: "GreenExpress" }}
        items={[
          { label: "Home", href: "/" },
          { label: "Drive With Us", href: "/drivers/apply" },
          { label: "Application Status", active: true },
        ]}
      />

      <main className="max-w-lg mx-auto px-6 py-12 animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4"><Icon name="clipboard" size={48} /></div>
          <h1 className="text-3xl font-[var(--font-heading)] gradient-text-green mb-2">
            Check Application Status
          </h1>
          <p className="text-[var(--color-neutral-500)] text-sm">
            Enter the email you used to apply to check your application status.
          </p>
        </div>

        <Card padding="lg" className="mb-6">
          <CardBody className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Button fullWidth onClick={checkStatus} loading={checking} disabled={!email}>
              <Icon name="search" size={16} /> Check Status
            </Button>
          </CardBody>
        </Card>

        {error && (
          <p className="text-sm text-[var(--color-error)] text-center mb-4">{error}</p>
        )}

        {app && (
          <Card padding="lg" className="animate-scale-in">
            <CardHeader>
              <h2 className="text-lg font-[var(--font-heading)]">
                {app.status === "none" ? <><Icon name="search" size={16} /> No Application Found</> : <><Icon name="clipboard" size={16} /> Application Status</>}
              </h2>
            </CardHeader>
            <CardBody>
              {app.status === "none" ? (
                <div className="text-center py-4">
                  <p className="text-[var(--color-neutral-500)] mb-4">No application found for this email.</p>
                  <Link to="/drivers/apply"><Button>Apply Now →</Button></Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-primary-100)]">
                    <div>
                      <p className="text-sm text-[var(--color-neutral-500)]">Status</p>
                      <p className="font-bold text-lg">{app.fullName}</p>
                    </div>
                    <Badge variant={statusConfig[app.status]?.variant || "neutral"} size="md" dot>
                      {statusIconMap[app.status]} {statusConfig[app.status]?.label || app.status}
                    </Badge>
                  </div>

                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-neutral-500)]">Email</span>
                      <span>{app.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-neutral-500)]">Submitted</span>
                      <span>{new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                    {app.notes && (
                      <div className="flex justify-between">
                        <span className="text-[var(--color-neutral-500)]">Notes</span>
                        <span className="text-right max-w-[60%]">{app.notes}</span>
                      </div>
                    )}
                  </div>

                  {app.status === "approved" && (
                    <div className="p-4 rounded-xl bg-[var(--color-success)]/5 border border-[var(--color-success)]/20 text-center">
                      <p className="text-[var(--color-success)] font-semibold"><Icon name="celebration" size={16} /> Welcome! Your application is approved!</p>
                      <p className="text-xs text-[var(--color-neutral-500)] mt-1">Check your email for next steps to start delivering.</p>
                    </div>
                  )}

                  {app.status === "rejected" && (
                    <div className="text-center">
                      <Link to="/drivers/apply"><Button variant="outline">Submit New Application</Button></Link>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </main>
    </div>
  );
}