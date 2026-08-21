import { eq } from "drizzle-orm";
import { INVENTORY_SEED } from "./inventory-config";
import { db, ensureSchema } from "./db";
import { inventory } from "./db/schema";
import { sendLowStockEmail } from "./email";
import { PRODUCTS, getProduct, type ProductId } from "./products";

export type StockStatus = "ok" | "low" | "out";

export type PublicStock = {
  productId: ProductId;
  quantity: number;
  lowStockAt: number;
  status: StockStatus;
};

function statusFor(quantity: number, lowStockAt: number): StockStatus {
  if (quantity <= 0) return "out";
  if (quantity <= lowStockAt) return "low";
  return "ok";
}

export async function seedInventoryIfNeeded() {
  await ensureSchema();
  const existing = await db.select().from(inventory);
  const have = new Set(existing.map((r) => r.productId));
  const now = new Date().toISOString();

  for (const product of PRODUCTS) {
    if (have.has(product.id)) continue;
    const seed = INVENTORY_SEED[product.id];
    await db.insert(inventory).values({
      productId: product.id,
      quantity: seed.quantity,
      lowStockAt: seed.lowStockAt,
      lowNotified: false,
      updatedAt: now,
    });
  }
}

export async function getAllStock(): Promise<PublicStock[]> {
  await seedInventoryIfNeeded();
  const rows = await db.select().from(inventory);
  const byId = new Map(rows.map((r) => [r.productId, r]));

  return PRODUCTS.map((product) => {
    const row = byId.get(product.id);
    const quantity = row?.quantity ?? 0;
    const lowStockAt =
      row?.lowStockAt ?? INVENTORY_SEED[product.id].lowStockAt;
    return {
      productId: product.id,
      quantity,
      lowStockAt,
      status: statusFor(quantity, lowStockAt),
    };
  });
}

export async function getStockMap(): Promise<Record<ProductId, PublicStock>> {
  const all = await getAllStock();
  return Object.fromEntries(all.map((s) => [s.productId, s])) as Record<
    ProductId,
    PublicStock
  >;
}

export async function assertCartAvailable(
  lines: { productId: ProductId; quantity: number }[],
) {
  const stock = await getStockMap();
  for (const line of lines) {
    const available = stock[line.productId]?.quantity ?? 0;
    const product = getProduct(line.productId);
    if (available < line.quantity) {
      throw new Error(
        available <= 0
          ? `${product?.name ?? line.productId} is sold out`
          : `Only ${available} ${product?.name ?? line.productId} jar${available === 1 ? "" : "s"} left`,
      );
    }
  }
}

type OrderLine = { productId: ProductId; quantity: number };

/**
 * Decrement on-hand counts after a paid order. Emails the farm once per size
 * when stock first drops to the low threshold (or to zero).
 */
export async function decrementInventoryForOrder(lines: OrderLine[]) {
  await seedInventoryIfNeeded();
  const alerts: PublicStock[] = [];

  for (const line of lines) {
    const rows = await db
      .select()
      .from(inventory)
      .where(eq(inventory.productId, line.productId))
      .limit(1);
    const row = rows[0];
    if (!row) continue;

    const previousQty = row.quantity;
    const nextQty = Math.max(0, previousQty - line.quantity);
    const isLow = nextQty <= row.lowStockAt;
    const shouldNotify = isLow && !row.lowNotified;

    await db
      .update(inventory)
      .set({
        quantity: nextQty,
        lowNotified: isLow ? true : false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(inventory.productId, line.productId));

    if (shouldNotify) {
      alerts.push({
        productId: line.productId,
        quantity: nextQty,
        lowStockAt: row.lowStockAt,
        status: statusFor(nextQty, row.lowStockAt),
      });
    }
  }

  if (alerts.length > 0) {
    await sendLowStockEmail(alerts);
  }

  return alerts;
}

export async function setInventoryLevels(
  updates: {
    productId: ProductId;
    quantity?: number;
    lowStockAt?: number;
  }[],
) {
  await seedInventoryIfNeeded();
  const now = new Date().toISOString();

  for (const update of updates) {
    const rows = await db
      .select()
      .from(inventory)
      .where(eq(inventory.productId, update.productId))
      .limit(1);
    const row = rows[0];
    if (!row) continue;

    const quantity = update.quantity ?? row.quantity;
    const lowStockAt = update.lowStockAt ?? row.lowStockAt;
    const lowNotified =
      quantity <= lowStockAt ? row.lowNotified : false;

    await db
      .update(inventory)
      .set({
        quantity,
        lowStockAt,
        lowNotified,
        updatedAt: now,
      })
      .where(eq(inventory.productId, update.productId));
  }

  return getAllStock();
}
