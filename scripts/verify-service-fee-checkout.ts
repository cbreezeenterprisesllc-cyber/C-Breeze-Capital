// One-off verification: create a real Checkout Session for the $7 consumer
// service fee on the account behind STRIPE_SECRET_KEY, then print what Stripe
// returned. Creates the session only — never completes or confirms payment.
//
//   bun run scripts/verify-service-fee-checkout.ts
import { createServiceFeeCheckoutSession, stripe, CONSUMER_SERVICE_FEE } from "../src/lib/stripe";

const siteBase = process.env.SITE_URL || "https://ef5d2c4ae9113753571b85ddf95ab4dd.cto.site";
const orderId = process.argv[2] || "verify-order-service-fee";

if (!stripe) {
  console.error("STRIPE_SECRET_KEY not set");
  process.exit(1);
}

const session = await createServiceFeeCheckoutSession({
  orderId,
  successUrl: `${siteBase}/orders/${orderId}/track?fee=paid`,
  cancelUrl: `${siteBase}/orders/${orderId}/track?fee=cancelled`,
});

const full = await stripe.checkout.sessions.retrieve(session.id, { expand: ["line_items.data.price"] });
console.log(
  JSON.stringify(
    {
      sessionId: full.id,
      mode: full.mode,
      status: full.status,
      url: full.url,
      amount_total: full.amount_total,
      expected_fee: CONSUMER_SERVICE_FEE.unitAmount,
      lookup_key: CONSUMER_SERVICE_FEE.lookupKey,
      line_items: full.line_items?.data.map((li) => ({
        description: li.description,
        amount: li.amount_total,
        price_id: typeof li.price === "string" ? li.price : li.price?.id,
        lookup_key: typeof li.price === "string" ? null : li.price?.lookup_key,
        recurring: typeof li.price === "string" ? null : li.price?.recurring,
      })),
      success_url: full.success_url,
      cancel_url: full.cancel_url,
      metadata: full.metadata,
    },
    null,
    2,
  ),
);
