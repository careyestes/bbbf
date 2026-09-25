import { buildParcels } from "./shipping-packages";
import type { ProductId } from "./products";

export type FulfillmentMethod = "pickup" | "shipping";

export type CartLine = {
  productId: ProductId;
  quantity: number;
};

export function totalJarCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function parcelsFromCart(lines: CartLine[]) {
  return buildParcels(lines);
}

/** First 5 digits, or null if the address is not yet a usable US ZIP. */
export function normalizeDestinationZip(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 5) return null;
  return digits.slice(0, 5);
}
