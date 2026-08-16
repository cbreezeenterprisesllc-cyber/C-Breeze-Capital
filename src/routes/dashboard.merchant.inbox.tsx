import { createFileRoute } from "@tanstack/react-router";
import { ChatInbox } from "~/components/ChatInbox";

export const Route = createFileRoute("/dashboard/merchant/inbox")({
  component: MerchantInbox,
});

function MerchantInbox() {
  return (
    <ChatInbox
      title="Inbox"
      subtitle="Customer, driver, and support messages for your dispensary — in one place."
      demoRoles={["merchant", "customer", "driver", "support"]}
    />
  );
}
