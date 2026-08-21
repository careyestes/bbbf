/**
 * ============================================================
 * BIG BLUE BARN FARM — INVENTORY (edit jar counts here)
 * ============================================================
 * Starting counts seed the database the first time the app runs.
 * After that, sales decrement live stock in the DB.
 *
 * To restock later:
 *   - POST /api/inventory with header x-inventory-secret
 *   - or update rows in the `inventory` table (Turso / local DB)
 *
 * lowStockAt: email alert when quantity reaches this level or below.
 * ============================================================
 */

import type { ProductId } from "./products";

export type InventorySeed = {
  /** Jars currently on hand */
  quantity: number;
  /** Notify farm when at or below this count */
  lowStockAt: number;
};

export const INVENTORY_SEED: Record<ProductId, InventorySeed> = {
  "quarter-pint": { quantity: 24, lowStockAt: 5 },
  "half-pint": { quantity: 24, lowStockAt: 5 },
  pint: { quantity: 18, lowStockAt: 4 },
  quart: { quantity: 12, lowStockAt: 3 },
};

/** Default low-stock threshold if a size is missing from seed */
export const DEFAULT_LOW_STOCK_AT = 5;
