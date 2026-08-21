import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAllStock,
  setInventoryLevels,
} from "@/lib/inventory";
import type { ProductId } from "@/lib/products";

export async function GET() {
  try {
    const stock = await getAllStock();
    return NextResponse.json({ stock });
  } catch (err) {
    console.error("inventory GET error", err);
    return NextResponse.json(
      { error: "Could not load inventory" },
      { status: 500 },
    );
  }
}

const updateSchema = z.object({
  updates: z
    .array(
      z.object({
        productId: z.enum(["quarter-pint", "half-pint", "pint", "quart"]),
        quantity: z.number().int().min(0).optional(),
        lowStockAt: z.number().int().min(0).optional(),
      }),
    )
    .min(1),
});

/** Restock / adjust thresholds. Requires INVENTORY_ADMIN_SECRET header. */
export async function POST(request: Request) {
  const secret = process.env.INVENTORY_ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INVENTORY_ADMIN_SECRET is not configured" },
      { status: 503 },
    );
  }

  const provided = request.headers.get("x-inventory-secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = updateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid inventory update" },
        { status: 400 },
      );
    }

    const stock = await setInventoryLevels(
      parsed.data.updates.map((u) => ({
        productId: u.productId as ProductId,
        quantity: u.quantity,
        lowStockAt: u.lowStockAt,
      })),
    );

    return NextResponse.json({ stock });
  } catch (err) {
    console.error("inventory POST error", err);
    return NextResponse.json(
      { error: "Could not update inventory" },
      { status: 500 },
    );
  }
}
