import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "~/components/LegalPage";

export const Route = createFileRoute("/legal/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" effectiveDate="[Effective Date]">
      <p>
        This Privacy Policy explains how C Breeze Enterprises LLC ("GreenExpress," "we," "our,"
        or "us") collects, uses, discloses, and protects information when you use the GreenExpress
        platform (the "Platform"), including the website, mobile application, and related services.
        This policy applies to Customers, Merchants, and delivery drivers who use the Platform.
      </p>
      <p>
        By using the Platform, you consent to the collection and use of information as described in
        this Privacy Policy. Please read it carefully.
      </p>

      <h2>1. Information We Collect</h2>
      <h3>1.1 Account Information</h3>
      <p>
        When you create an account or place an order, we collect information you provide,
        including your name, email address, phone number, and password (stored as a secure hash).
        Customers may also provide a date of birth for age verification. User accounts have a role
        (customer, merchant, or admin) and may be linked to a specific dispensary (tenant).
      </p>
      <h3>1.2 Order Information</h3>
      <p>
        When you place an order, we collect order details, including the dispensary, the products
        ordered (name, quantity, and price), delivery address, delivery notes, delivery fee, tax,
        order total, and order status. We also record the delivery driver assigned to an order,
        estimated delivery time, and the date/time the order was placed, updated, and delivered.
      </p>
      <h3>1.3 Chat and Messaging</h3>
      <p>
        The Platform includes an in-app messaging feature for communication between customers,
        dispensaries (merchants), delivery drivers, and support staff. Messages are plain text and
        are stored by the Platform to facilitate the conversation and to support order fulfillment
        and customer service. Participants in a conversation can see the messages in that
        conversation.
      </p>
      <h3>1.4 Driver Application and Driver Information</h3>
      <p>
        Individuals who apply to deliver for GreenExpress provide personal information through the
        driver application process, including full name, email address, phone number, date of
        birth, home address, driver's license information, vehicle information, insurance
        information, and consent acknowledgments (including background check consent). Approved
        drivers have a driver profile that may include availability status, location coordinates,
        delivery counts, and ratings.
      </p>
      <h3>1.5 Merchant (Dispensary) Information</h3>
      <p>
        Merchants provide business information such as store name, contact details, branding
        (logo, colors), and menu data (products, categories, prices, THC/CBD content, strain
        type, and stock levels) to operate their storefront on the Platform.
      </p>
      <h3>1.6 Usage and Technical Information</h3>
      <p>
        We may collect technical information automatically, such as your IP address, browser type,
        device information, and pages visited, to operate and improve the Platform and to diagnose
        technical issues.
      </p>

      <h2>2. How We Use Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, operate, and maintain the Platform and its features;</li>
        <li>Process and fulfill orders, including coordinating delivery with drivers;</li>
        <li>Verify age and support regulatory compliance;</li>
        <li>Facilitate communication between customers, merchants, drivers, and support;</li>
        <li>Process payments through our third-party payment processor (Stripe);</li>
        <li>Provide customer support and respond to inquiries;</li>
        <li>Evaluate and manage driver applications and driver performance;</li>
        <li>Improve the Platform, analyze usage, and prevent fraud or abuse;</li>
        <li>Comply with legal obligations and enforce our Terms of Service.</li>
      </ul>

      <h2>3. Payment Processing</h2>
      <p>
        Payments are processed by Stripe, a third-party payment processor. When you check out, you
        are redirected to Stripe's hosted checkout, and your payment card details are provided
        directly to Stripe. GreenExpress does not collect or store your full card number, card
        expiration date, or CVV. Please review Stripe's own privacy policy for information about
        how Stripe handles your payment data.
      </p>

      <h2>4. How We Share Information</h2>
      <p>We share information only as described in this Privacy Policy:</p>
      <ul>
        <li>
          <strong>With Merchants (Dispensaries):</strong> When you place an order, the relevant
          dispensary receives your order details and delivery information so it can fulfill your
          order. Merchants may also see chat messages from their customers.
        </li>
        <li>
          <strong>With Delivery Drivers:</strong> The driver assigned to your order receives the
          delivery address and order details needed to complete the delivery, and may communicate
          with you through the Platform's chat feature.
        </li>
        <li>
          <strong>With Service Providers:</strong> We share information with third-party service
          providers who help us operate the Platform, including payment processing (Stripe),
          hosting, and analytics. These providers are contractually obligated to protect your
          information.
        </li>
        <li>
          <strong>For Legal Reasons:</strong> We may disclose information if required by law,
          regulation, legal process, or governmental request, or where we believe disclosure is
          necessary to protect the rights, property, or safety of GreenExpress, our users, or
          others.
        </li>
        <li>
          <strong>Business Transfers:</strong> In connection with a merger, acquisition, sale of
          assets, or similar transaction, your information may be transferred as part of the
          business assets.
        </li>
      </ul>
      <p>
        We do not sell your personal information to third parties for their own marketing
        purposes.
      </p>

      <h2>5. Storage and Security</h2>
      <p>
        Information is stored in a secure database (SQLite) operated by GreenExpress. We use
        industry-standard safeguards, including secure password hashing (bcrypt) and token-based
        authentication (JWT), to protect your information. No method of transmission or storage
        is completely secure, and we cannot guarantee absolute security.
      </p>

      <h2>6. Data Retention</h2>
      <p>
        We retain information for as long as necessary to provide the Platform, fulfill orders,
        comply with legal and regulatory obligations (including cannabis compliance requirements),
        resolve disputes, and enforce our agreements. When information is no longer needed, we
        will delete or anonymize it where feasible.
      </p>

      <h2>7. Your Rights and Choices</h2>
      <p>
        Depending on your jurisdiction, you may have rights to access, correct, delete, or restrict
        the use of your personal information, and to object to certain processing. You may also
        withdraw consent where processing is based on consent. To exercise these rights, please
        contact us using the details below. We will respond in accordance with applicable law.
      </p>

      <h2>8. Children's Privacy</h2>
      <p>
        The Platform is intended for adults aged 21 and over. We do not knowingly collect personal
        information from individuals under 21. If you believe a minor has provided us with
        personal information, please contact us and we will take steps to remove it.
      </p>

      <h2>9. Third-Party Links</h2>
      <p>
        The Platform may contain links to third-party websites or services (for example, Stripe's
        hosted checkout). We are not responsible for the privacy practices of those third parties,
        and we encourage you to review their privacy policies.
      </p>

      <h2>10. Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will post the updated policy on the
        Platform with a revised effective date. Your continued use of the Platform after changes
        take effect constitutes your acceptance of the updated policy.
      </p>

      <h2>11. Contact Us</h2>
      <p>
        If you have questions or concerns about this Privacy Policy or our privacy practices,
        please contact us through the Platform's support chat or at [Contact Email].
      </p>

      <p className="legal-note">
        This document is a template draft prepared for GreenExpress and is subject to review by
        legal counsel before launch. Bracketed placeholders ([Effective Date], [Contact Email])
        must be completed before publication.
      </p>
    </LegalPage>
  );
}
