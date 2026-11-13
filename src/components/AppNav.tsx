// Navigation for the consumer half of the two-product split.
//
// GreenExpress has two products under one brand: the consumer marketplace
// ("GreenExpress App") and the merchant software ("GreenExpress SaaS"). Consumer
// pages use <ConsumerNav>, which keeps the merchant door visible ("For my
// dispensary") so the two funnels never blur; merchant pages link back with
// "I want delivery".
import { TopbarNav } from "~/components/Navigation";
import { useCart } from "~/context/CartContext";

export type ConsumerPage = "home" | "dispensaries" | "cart" | "track";

export function ConsumerNav({ active, brand }: { active?: ConsumerPage; brand?: string }) {
  const { itemCount } = useCart();
  return (
    <TopbarNav
      branding={{ title: brand ?? "GreenExpress App" }}
      items={[
        { label: "Order delivery", href: "/", active: active === "home" },
        { label: "Dispensaries", href: "/dispensaries", active: active === "dispensaries" },
        { label: itemCount > 0 ? `Cart (${itemCount})` : "Cart", href: "/cart", active: active === "cart" },
        { label: "For my dispensary →", href: "/saas" },
      ]}
    />
  );
}
