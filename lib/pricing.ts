/**
 * ============================================================
 * BIG BLUE BARN FARM — PRICING (edit here)
 * ============================================================
 * Jar prices are derived from price-per-ounce × jar size, where
 * the per-ounce rate steps down as jars get bigger. Shipping is
 * flat-rate by total jar count.
 *
 * Benchmarks (Mississippi direct-to-consumer, 2026):
 *   farmers-market mid-market  $0.68–$0.97/oz
 *   local apiary pint jars     $12–$18 per 16 oz
 *   3 lb / 5 lb bulk jugs      $0.31–$0.75/oz
 * ============================================================
 */

/**
 * Per-ounce rate by jar size, cheapest rate for the biggest jar.
 * First tier whose `maxOz` covers the volume wins.
 */
export const PRICE_PER_OZ_TIERS = [
  { maxOz: 4, pricePerOz: 1.25 }, // 4 oz  → $5
  { maxOz: 8, pricePerOz: 1.0 }, // 8 oz  → $8
  { maxOz: 16, pricePerOz: 0.875 }, // 16 oz → $14
  { maxOz: Infinity, pricePerOz: 0.75 }, // 32 oz → $24
] as const;

/**
 * Optional escape hatch: setting NEXT_PUBLIC_HONEY_PRICE_PER_OZ
 * charges one flat rate at every size and ignores the tiers above.
 */
function readFlatRateOverride(): number | null {
  const fromEnv = process.env.NEXT_PUBLIC_HONEY_PRICE_PER_OZ;
  if (fromEnv == null || fromEnv === "") return null;
  const parsed = Number(fromEnv);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

const FLAT_RATE_OVERRIDE = readFlatRateOverride();

export function pricePerOzForVolume(volumeOz: number): number {
  if (FLAT_RATE_OVERRIDE != null) return FLAT_RATE_OVERRIDE;
  const tier = PRICE_PER_OZ_TIERS.find((t) => volumeOz <= t.maxOz);
  return (tier ?? PRICE_PER_OZ_TIERS[PRICE_PER_OZ_TIERS.length - 1]).pricePerOz;
}

/** Best rate on the ladder — for "from $X/oz" copy. */
export const LOWEST_PRICE_PER_OZ = Math.min(
  ...PRICE_PER_OZ_TIERS.map((t) => pricePerOzForVolume(t.maxOz)),
);

/**
 * Flat-rate shipping by total jars in the cart.
 * Edit `rateCents` (100 = $1.00) to change shipping.
 */
export const SHIPPING_TIERS = [
  { maxJars: 2, rateCents: 800 }, // 1–2 jars → $8
  { maxJars: 4, rateCents: 1200 }, // 3–4 jars → $12
  { maxJars: Infinity, rateCents: 1800 }, // 5+ jars → $18
] as const;

/** Price in cents for a given fluid-ounce volume. */
export function priceCentsForOz(volumeOz: number): number {
  return Math.round(volumeOz * pricePerOzForVolume(volumeOz) * 100);
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/** e.g. "$0.88/oz" — per-ounce rate for a jar size. */
export function formatPricePerOz(volumeOz: number): string {
  const perOz = pricePerOzForVolume(volumeOz);
  return `${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(perOz)}/oz`;
}
