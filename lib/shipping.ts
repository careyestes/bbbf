import { SHIPPING_TIERS } from "./pricing";
import type { ProductId } from "./products";

export type FulfillmentMethod = "pickup" | "shipping";

export type CartLine = {
  productId: ProductId;
  quantity: number;
};

export function totalJarCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function shippingCentsForJarCount(jarCount: number): number {
  if (jarCount <= 0) return 0;
  for (const tier of SHIPPING_TIERS) {
    if (jarCount <= tier.maxJars) return tier.rateCents;
  }
  return SHIPPING_TIERS[SHIPPING_TIERS.length - 1].rateCents;
}

export function fulfillmentShippingCents(
  method: FulfillmentMethod,
  lines: CartLine[],
): number {
  if (method === "pickup") return 0;
  return shippingCentsForJarCount(totalJarCount(lines));
}
