/** Farm identity & copy — pricing lives in lib/pricing.ts */

export const FARM = {
  name: "Big Blue Barn Farm",
  shortName: "Big Blue Barn",
  email: "contact@bigbluebarn.farm",
  address: {
    line1: "573 Shaw-Skene Rd",
    city: "Shaw",
    state: "MS",
    zip: "38773",
  },
  tagline: "Pure raw honey, straight from the comb.",
} as const;

export const PICKUP_NOTE =
  "We'll email you when your order is ready for pickup at the farm.";

export function formatAddress() {
  const { line1, city, state, zip } = FARM.address;
  return `${line1}, ${city}, ${state} ${zip}`;
}

/** @deprecated Import from `@/lib/pricing` instead */
export { PRICE_PER_OZ_TIERS, SHIPPING_TIERS } from "./pricing";
