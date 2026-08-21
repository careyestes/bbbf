import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db, ensureSchema } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { sendOrderEmails } from "@/lib/email";
import { decrementInventoryForOrder } from "@/lib/inventory";
import type { ProductId } from "@/lib/products";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

type OrderItem = {
  productId: ProductId;
  quantity: number;
};

function parseOrderItems(itemsJson: string): OrderItem[] {
  try {
    const raw = JSON.parse(itemsJson) as {
      productId?: string;
      quantity?: number;
    }[];
    return raw
      .filter((i) => i.productId && typeof i.quantity === "number")
      .map((i) => ({
        productId: i.productId as ProductId,
        quantity: i.quantity as number,
      }));
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderPublicId = intent.metadata?.orderPublicId;
    if (orderPublicId) {
      await ensureSchema();
      const existing = await db
        .select()
        .from(orders)
        .where(eq(orders.publicId, orderPublicId))
        .limit(1);

      const order = existing[0];
      if (order && order.status !== "paid") {
        const paidAt = new Date().toISOString();
        await db
          .update(orders)
          .set({
            status: "paid",
            paidAt,
            stripePaymentIntentId: intent.id,
          })
          .where(eq(orders.publicId, orderPublicId));

        const lines = parseOrderItems(order.itemsJson);
        if (lines.length > 0) {
          try {
            await decrementInventoryForOrder(lines);
          } catch (err) {
            console.error("inventory decrement failed", err);
          }
        }

        try {
          await sendOrderEmails({
            ...order,
            status: "paid",
            paidAt,
            stripePaymentIntentId: intent.id,
          });
        } catch (err) {
          console.error("order emails failed", err);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
