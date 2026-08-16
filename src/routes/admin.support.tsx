import { createFileRoute } from "@tanstack/react-router";
import { ChatInbox } from "~/components/ChatInbox";

export const Route = createFileRoute("/admin/support")({
  component: SupportInbox,
});

function SupportInbox() {
  return (
    <ChatInbox
      title="Support Inbox"
      subtitle="Platform admins can join any customer or merchant conversation as the support participant."
      demoRoles={["support", "merchant", "customer", "driver"]}
    />
  );
}
