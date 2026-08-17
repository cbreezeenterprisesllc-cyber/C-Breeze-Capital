import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "~/components/LegalPage";

export const Route = createFileRoute("/legal/refunds")({
  component: RefundsPage,
});

function RefundsPage() {
  return (
    <LegalPage title="Refund & Cancellation Policy" effectiveDate="[Effective Date]">
      <p>
        This Refund &amp; Cancellation Policy explains how orders placed through the GreenExpress
        platform (the "Platform"), operated by C Breeze Enterprises LLC ("GreenExpress," "we,"
        "our," or "us"), may be cancelled or refunded. This policy applies to orders placed by
        Customers with participating dispensaries ("Merchants").
      </p>

      <h2>1. Order Cancellation</h2>
      <h3>1.1 Before Preparation Begins</h3>
      <p>
        Orders may be cancelled while they are in an early status (for example, "pending" or
        "confirmed") before the Merchant has begun preparing the order. To request a cancellation,
        contact the Merchant directly through the Platform's in-app chat or contact GreenExpress
        support through the Platform. The Merchant will confirm whether the order can still be
        cancelled.
      </p>
      <h3>1.2 After Preparation or Dispatch</h3>
      <p>
        Once a Merchant has begun preparing an order or a driver has been dispatched, the order
        generally cannot be cancelled. If you no longer need the order at that point, you may
        decline delivery, and the Merchant will determine whether any refund applies under
        Section 2 below.
      </p>
      <h3>1.3 Failed Age or Identity Verification</h3>
      <p>
        Because cannabis products are age-restricted, delivery drivers are required to verify that
        the recipient is 21 or older and, in some cases, verify identity. If you (or the intended
        recipient) cannot provide valid proof of age or identity at delivery, the driver may refuse
        the delivery and the order may be treated as cancelled. The Merchant will determine whether
        any refund applies.
      </p>

      <h2>2. Refunds</h2>
      <h3>2.1 Who Handles Refunds</h3>
      <p>
        Refunds for order issues — including wrong, missing, or damaged items, incorrect orders, or
        other fulfillment problems — are handled by the Merchant (the dispensary that fulfilled the
        order). GreenExpress is a technology platform that facilitates the connection between you
        and the Merchant; GreenExpress does not itself process order refunds. The Platform
        currently does not offer an automated, in-app refund mechanism.
      </p>
      <h3>2.2 How to Request a Refund</h3>
      <p>
        If there is an issue with your order, please contact the Merchant through the Platform's
        in-app chat (the order conversation includes the Merchant, and support is available if you
        need assistance). Provide your order number, a description of the issue, and any supporting
        information. The Merchant will review your request and respond in accordance with its own
        policies and applicable law.
      </p>
      <h3>2.3 Refund Amount and Method</h3>
      <p>
        If a refund is approved by the Merchant, the refund will be issued back to the original
        payment method used at checkout (payments are processed by Stripe, our payment processor).
        Refunds are subject to the Merchant's discretion and applicable law. GreenExpress does not
        guarantee that any particular refund will be approved; refund decisions rest with the
        Merchant.
      </p>
      <h3>2.4 Non-Refundable Items and Fees</h3>
      <p>
        Unless required by applicable law or determined otherwise by the Merchant, delivery fees
        may not be refundable once a delivery attempt has been made, and items that are
        age-restricted may not be returnable for hygiene or regulatory reasons. Any refund decision
        regarding fees is made by the Merchant.
      </p>

      <h2>3. Delivery Failures</h2>
      <p>
        If a delivery cannot be completed due to an incorrect or incomplete delivery address
        provided by you, repeated failed delivery attempts, or your unavailability at the delivery
        location, the Merchant may cancel the order and determine whether any refund (and any
        applicable fee) applies.
      </p>

      <h2>4. Processing Time</h2>
      <p>
        Where a refund is approved, it may take several business days for the refund to appear on
        your payment method, depending on your bank or card issuer. GreenExpress will not issue
        refunds itself but will facilitate communication between you and the Merchant where
        needed.
      </p>

      <h2>5. Contacting Support</h2>
      <p>
        If you have difficulty reaching the Merchant about an order issue, you can contact
        GreenExpress support through the Platform's in-app support chat. We will help connect you
        with the Merchant and may assist in escalating the issue, but final refund decisions rest
        with the Merchant in accordance with applicable law.
      </p>

      <h2>6. Changes to This Policy</h2>
      <p>
        We may update this Refund &amp; Cancellation Policy from time to time. We will post the
        updated policy on the Platform with a revised effective date. Your continued use of the
        Platform after changes take effect constitutes your acceptance of the updated policy.
      </p>

      <p className="legal-note">
        This document is a template draft prepared for GreenExpress and is subject to review by
        legal counsel before launch. Bracketed placeholders ([Effective Date], [Contact Email])
        must be completed before publication. The Platform currently has no automated refund
        mechanism; refunds are handled by the Merchant (dispensary) on a case-by-case basis.
      </p>
    </LegalPage>
  );
}
