import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.warn("STRIPE_SECRET_KEY not set — payments will be disabled");
}

export const stripe = secretKey
  ? new Stripe(secretKey)
  : null;

export async function createCheckoutSession(params: {
  orderId: string;
  amount: number; // in cents
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  if (!stripe) throw new Error("Stripe not configured");

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: params.customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `GreenExpress Order #${params.orderId.slice(0, 8)}`,
            description: "Cannabis delivery order",
          },
          unit_amount: params.amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      order_id: params.orderId,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
  return session;
}

// ── SaaS subscription plans (merchant pricing page) ─────────────────────────
// Prices are never hardcoded by ID: on first use we idempotently ensure the
// Product/Price exist on the Stripe account (looked up by lookup_key), then
// cache the price ID for the life of the process.
export const SUBSCRIPTION_PLANS = {
  pilot: { lookupKey: "pilot-monthly", name: "GreenExpress Pilot", unitAmount: 22425 },
  growth: { lookupKey: "growth-monthly", name: "GreenExpress Growth", unitAmount: 29900 },
} as const;
export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

const subscriptionPriceCache = new Map<SubscriptionPlan, string>();

async function ensureSubscriptionPrice(plan: SubscriptionPlan): Promise<string> {
  if (!stripe) throw new Error("Stripe not configured");
  const cached = subscriptionPriceCache.get(plan);
  if (cached) return cached;
  const cfg = SUBSCRIPTION_PLANS[plan];

  const existing = await stripe.prices.list({ lookup_keys: [cfg.lookupKey] });
  if (existing.data.length > 0) {
    const priceId = existing.data[0].id;
    subscriptionPriceCache.set(plan, priceId);
    return priceId;
  }

  try {
    const product = await stripe.products.create({
      name: cfg.name,
      description: `${cfg.name} — monthly SaaS subscription for licensed dispensaries`,
    });
    const price = await stripe.prices.create({
      currency: "usd",
      unit_amount: cfg.unitAmount,
      recurring: { interval: "month" },
      product: product.id,
      lookup_key: cfg.lookupKey,
    });
    subscriptionPriceCache.set(plan, price.id);
    return price.id;
  } catch (err) {
    // Race: another request may have created the lookup key first — re-list once.
    const retry = await stripe.prices.list({ lookup_keys: [cfg.lookupKey] });
    if (retry.data.length > 0) {
      subscriptionPriceCache.set(plan, retry.data[0].id);
      return retry.data[0].id;
    }
    throw err;
  }
}

export async function createSubscriptionCheckoutSession(params: {
  plan: SubscriptionPlan;
  successUrl: string;
  cancelUrl: string;
}) {
  if (!stripe) throw new Error("Stripe not configured");
  const priceId = await ensureSubscriptionPrice(params.plan);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { metadata: { plan: params.plan } },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
  return session;
}

// ── Consumer service fee ($7 flat, per order) ────────────────────────────────
// The ONLY GreenExpress-side consumer payment. It is a software/service fee for
// using the ordering platform — never the price of cannabis. The dispensary
// remains the seller of record and collects for product on its own rail, so this
// session carries the $7 fee and nothing else (mode: "payment", one-time price).
export const CONSUMER_SERVICE_FEE = {
  lookupKey: "consumer-fee-7",
  name: "GreenExpress Service Fee",
  description: "Flat $7 service fee for ordering through GreenExpress",
  unitAmount: 700, // cents
} as const;

let consumerFeePriceCache: string | null = null;

// Same idempotency pattern as the subscription plans: look the Price up by
// lookup_key first and only create Product/Price when it doesn't exist yet, so
// repeated deploys/requests never mint duplicate prices.
async function ensureConsumerFeePrice(): Promise<string> {
  if (!stripe) throw new Error("Stripe not configured");
  if (consumerFeePriceCache) return consumerFeePriceCache;

  const existing = await stripe.prices.list({
    lookup_keys: [CONSUMER_SERVICE_FEE.lookupKey],
    active: true,
    limit: 1,
  });
  if (existing.data.length > 0) {
    consumerFeePriceCache = existing.data[0].id;
    return consumerFeePriceCache;
  }

  try {
    const product = await stripe.products.create({
      name: CONSUMER_SERVICE_FEE.name,
      description: CONSUMER_SERVICE_FEE.description,
    });
    const price = await stripe.prices.create({
      currency: "usd",
      unit_amount: CONSUMER_SERVICE_FEE.unitAmount,
      product: product.id,
      lookup_key: CONSUMER_SERVICE_FEE.lookupKey,
      // No `recurring` block: this is a one-time charge, not a subscription.
    });
    consumerFeePriceCache = price.id;
    return price.id;
  } catch (err) {
    // Race: another request may have created the lookup key first — re-list once.
    const retry = await stripe.prices.list({
      lookup_keys: [CONSUMER_SERVICE_FEE.lookupKey],
      active: true,
      limit: 1,
    });
    if (retry.data.length > 0) {
      consumerFeePriceCache = retry.data[0].id;
      return retry.data[0].id;
    }
    throw err;
  }
}

export async function createServiceFeeCheckoutSession(params: {
  orderId: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  if (!stripe) throw new Error("Stripe not configured");
  const priceId = await ensureConsumerFeePrice();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: params.customerEmail || undefined,
    metadata: {
      order_id: params.orderId,
      fee_type: "consumer_service_fee",
    },
    payment_intent_data: {
      description: CONSUMER_SERVICE_FEE.name,
      metadata: {
        order_id: params.orderId,
        fee_type: "consumer_service_fee",
      },
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
  return session;
}