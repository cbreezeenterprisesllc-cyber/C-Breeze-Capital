import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "~/components/LegalPage";

export const Route = createFileRoute("/legal/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage title="Terms of Service" effectiveDate="[Effective Date]">
      <p>
        Welcome to GreenExpress, operated by C Breeze Enterprises LLC ("GreenExpress," "we,"
        "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the
        GreenExpress platform, including the website, mobile application, and related services
        (collectively, the "Platform").
      </p>
      <p>
        The Platform is a white-label marketplace that connects licensed cannabis dispensaries
        ("Merchants" or "Dispensaries") with customers ("Customers" or "you") for the on-demand
        delivery of cannabis products, subject to applicable law. GreenExpress provides the
        technology that enables browsing, ordering, payment processing, delivery coordination,
        and order tracking. By using the Platform, you agree to these Terms. If you do not agree,
        please do not use the Platform.
      </p>

      <h2>1. Eligibility and Age Requirement</h2>
      <p>
        You must be at least 21 years of age to use the Platform, browse product listings, place
        orders, or receive deliveries. By creating an account or placing an order, you represent
        and warrant that you are at least 21 years old and that you are legally permitted to
        purchase and possess cannabis products in your jurisdiction.
      </p>
      <p>
        GreenExpress verifies age at checkout and Merchants (and their delivery drivers) may
        verify your age and identity again at the time of delivery. You may be required to present
        a valid, government-issued photo ID. If you cannot verify your age or identity, the order
        may be refused or cancelled.
      </p>

      <h2>2. Accounts</h2>
      <p>
        To place orders you may provide an email address and other required information. You agree
        to provide accurate, current, and complete information and to keep it updated. You are
        responsible for maintaining the confidentiality of your account credentials and for all
        activity that occurs under your account. Notify us promptly if you suspect unauthorized
        use of your account.
      </p>

      <h2>3. Orders, Payment, and Delivery</h2>
      <h3>3.1 Placing Orders</h3>
      <p>
        When you place an order, you are making an offer to purchase products from a Merchant.
        Each Merchant is solely responsible for accepting, preparing, and fulfilling orders placed
        through the Platform, including confirming product availability, pricing, and compliance
        with applicable law.
      </p>
      <h3>3.2 Payment</h3>
      <p>
        Payments are processed through Stripe, a third-party payment processor. When you check out,
        you are redirected to Stripe's hosted checkout to complete payment using a credit or debit
        card. GreenExpress does not collect or store your full card number; card details are
        handled by Stripe in accordance with its own privacy and security practices.
      </p>
      <h3>3.3 Order Status and Tracking</h3>
      <p>
        After an order is placed, you can track its status on the Platform. Orders move through
        statuses that may include pending, confirmed, preparing, in transit, delivered, and
        cancelled. Estimated delivery times are estimates only and are not guaranteed.
      </p>
      <h3>3.4 Cancellations and Refunds</h3>
      <p>
        Cancellations and refunds are governed by our{" "}
        <a href="/legal/refunds">Refund &amp; Cancellation Policy</a>. In general, order issues
        (including wrong, missing, or damaged items) are handled by the Merchant. Refunds, where
        applicable, are issued at the Merchant's discretion in accordance with applicable law.
      </p>

      <h2>4. Age Verification and Compliance</h2>
      <p>
        The Platform is designed to support compliance with applicable state and local cannabis
        regulations, including 21+ age verification at checkout and at delivery. You agree to
        comply with all applicable laws in your jurisdiction. GreenExpress does not provide legal
        advice, and compliance requirements vary by state. It is your responsibility to ensure your
        use of the Platform is lawful where you are located.
      </p>

      <h2>5. In-Platform Chat and Communications</h2>
      <p>
        The Platform includes a messaging feature that allows Customers to communicate with
        Merchants, delivery drivers, and support staff. Messages are plain text and are stored on
        the Platform to provide and improve the service. You agree not to use the chat feature to
        send abusive, harassing, or unlawful messages. Messages exchanged through the Platform do
        not constitute medical advice.
      </p>

      <h2>6. Marketplace Role and Disclaimers</h2>
      <p>
        GreenExpress is a venue that provides technology services to connect Customers with
        Merchants. GreenExpress is not a party to the transaction between you and any Merchant
        other than as a technology provider, and does not own, manufacture, package, or guarantee
        any products sold by Merchants.
      </p>
      <p>
        WITHOUT LIMITING THE GENERALITY OF THE FOLLOWING DISCLAIMERS, PRODUCTS SOLD THROUGH THE
        PLATFORM ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER
        EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
        PARTICULAR PURPOSE, OR NON-INFRINGEMENT. GreenExpress does not warrant the quality, safety,
        potency, or legality of any product sold by a Merchant. The Platform does not provide
        medical advice; any product descriptions, strain information, or effects stated by
        Merchants are provided by the Merchants and are not endorsed by GreenExpress.
      </p>

      <h2>7. Prohibited Conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Platform in violation of any applicable law or regulation;</li>
        <li>Misrepresent your age, identity, or eligibility to purchase cannabis products;</li>
        <li>Resell products purchased through the Platform without authorization;</li>
        <li>Interfere with or disrupt the Platform, its servers, or connected networks;</li>
        <li>Attempt to gain unauthorized access to any part of the Platform or other users' accounts;</li>
        <li>Use the Platform to harass, abuse, or harm any person.</li>
      </ul>

      <h2>8. Intellectual Property</h2>
      <p>
        The Platform, including its design, text, graphics, logos, and software, is owned by or
        licensed to GreenExpress and is protected by intellectual property laws. You may not copy,
        modify, distribute, or create derivative works from the Platform without our prior written
        consent. Merchant names, logos, and product images are the property of their respective
        owners.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, GREENEXPRESS SHALL NOT BE LIABLE FOR
        ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF
        PROFITS, REVENUE, DATA, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE PLATFORM
        OR ANY PRODUCTS ORDERED THROUGH IT, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        GREENEXPRESS'S TOTAL LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THE PLATFORM
        SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO GREENEXPRESS DIRECTLY IN THE
        SIX (6) MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED DOLLARS ($100). SOME JURISDICTIONS
        DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES, SO SOME OF THE ABOVE
        LIMITATIONS MAY NOT APPLY TO YOU.
      </p>

      <h2>10. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. We will post the updated Terms on the
        Platform with a revised effective date. Your continued use of the Platform after changes
        take effect constitutes your acceptance of the updated Terms. Material changes will be
        communicated through the Platform where reasonably practicable.
      </p>

      <h2>11. Termination</h2>
      <p>
        We may suspend or terminate your access to the Platform at any time for any reason,
        including if we reasonably believe you have violated these Terms or applicable law. You
        may stop using the Platform at any time. Provisions of these Terms that by their nature
        should survive termination will survive, including disclaimers, limitations of liability,
        and governing law.
      </p>

      <h2>12. Governing Law and Disputes</h2>
      <p>
        These Terms are governed by the laws of the State of [State], without regard to its
        conflict-of-law principles. Any dispute arising out of or related to these Terms or the
        Platform will be resolved in the state or federal courts located in [County], [State],
        and you consent to the exclusive jurisdiction of those courts. [To be reviewed by legal
        counsel before launch.]
      </p>

      <h2>13. Contact Us</h2>
      <p>
        If you have questions about these Terms, please contact us through the Platform's support
        chat or at [Contact Email]. For refund questions, see our{" "}
        <a href="/legal/refunds">Refund &amp; Cancellation Policy</a>.
      </p>

      <p className="legal-note">
        This document is a template draft prepared for GreenExpress and is subject to review by
        legal counsel before launch. Bracketed placeholders ([Effective Date], [State], [County],
        [Contact Email]) must be completed before publication.
      </p>
    </LegalPage>
  );
}
