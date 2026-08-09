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