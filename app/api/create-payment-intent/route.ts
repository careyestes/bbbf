import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, ensureSchema } from "@/lib/db";
import { customers, orders } from "@/lib/db/schema";
import { assertCartAvailable } from "@/lib/inventory";
import {
  getProduct,
  priceCentsForProduct,
  type ProductId,
} from "@/lib/products";
import { shippingCentsForJarCount, totalJarCount } from "@/lib/shipping";
import { getStripe } from "@/lib/stripe";

const bodySchema = z.object({
  lines: z
    .array(
      z.object({
        productId: z.enum(["quarter-pint", "half-pint", "pint", "quart"]),
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .min(1),
  fulfillmentMethod: z.literal("shipping"),
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().default(""),
  marketingOptIn: z.boolean().optional().default(false),
  shippingLine1: z.string().min(1).max(200),
  shippingLine2: z.string().max(200).optional().default(""),
  shippingCity: z.string().min(1).max(100),
  shippingState: z.string().min(1).max(40),
  shippingZip: z.string().min(1).max(20),
});

function publicOrderId() {
  return `BBBF-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          error:
            "Payments are not configured yet. Add STRIPE_SECRET_KEY to your environment.",
        },
        { status: 503 },
      );
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid checkout data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    await ensureSchema();
    await assertCartAvailable(data.lines);

    const items = data.lines.map((line) => {
      const product = getProduct(line.productId);
      if (!product) {
        throw new Error(`Unavailable product: ${line.productId}`);
      }
      const unitPriceCents = priceCentsForProduct(product);
      return {
        productId: line.productId as ProductId,
        name: product.name,
        quantity: line.quantity,
        unitPriceCents,
        volumeOz: product.volumeOz,
      };
    });

    const subtotalCents = items.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0,
    );
    const shippingCents = shippingCentsForJarCount(
      totalJarCount(data.lines),
    );
    const totalCents = subtotalCents + shippingCents;
    const orderPublicId = publicOrderId();

    const existing = await db
      .select()
      .from(customers)
      .where(eq(customers.email, data.email.toLowerCase()))
      .limit(1);

    let customerId: number;
    let stripeCustomerId: string | null = existing[0]?.stripeCustomerId ?? null;

    const stripe = getStripe();

    if (existing[0]) {
      customerId = existing[0].id;
      await db
        .update(customers)
        .set({
          name: data.name,
          phone: data.phone || null,
          marketingOptIn:
            data.marketingOptIn || existing[0].marketingOptIn,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(customers.id, customerId));
    } else {
      const inserted = await db
        .insert(customers)
        .values({
          email: data.email.toLowerCase(),
          name: data.name,
          phone: data.phone || null,
          marketingOptIn: data.marketingOptIn,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning({ id: customers.id });
      customerId = inserted[0].id;
    }

    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: data.email.toLowerCase(),
        name: data.name,
        phone: data.phone || undefined,
        metadata: { farmCustomerId: String(customerId) },
      });
      stripeCustomerId = stripeCustomer.id;
      await db
        .update(customers)
        .set({ stripeCustomerId })
        .where(eq(customers.id, customerId));
    }

    const now = new Date().toISOString();
    await db.insert(orders).values({
      publicId: orderPublicId,
      customerId,
      email: data.email.toLowerCase(),
      name: data.name,
      phone: data.phone || null,
      fulfillmentMethod: "shipping",
      shippingLine1: data.shippingLine1,
      shippingLine2: data.shippingLine2 || null,
      shippingCity: data.shippingCity,
      shippingState: data.shippingState,
      shippingZip: data.shippingZip,
      itemsJson: JSON.stringify(items),
      subtotalCents,
      shippingCents,
      totalCents,
      marketingOptIn: data.marketingOptIn,
      status: "pending",
      createdAt: now,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      customer: stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      receipt_email: data.email.toLowerCase(),
      metadata: {
        orderPublicId,
        fulfillmentMethod: "shipping",
        customerEmail: data.email.toLowerCase(),
        customerName: data.name,
        items: JSON.stringify(
          items.map((i) => ({
            id: i.productId,
            qty: i.quantity,
          })),
        ),
      },
    });

    await db
      .update(orders)
      .set({ stripePaymentIntentId: paymentIntent.id })
      .where(eq(orders.publicId, orderPublicId));

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderPublicId,
    });
  } catch (err) {
    console.error("create-payment-intent error", err);
    const message =
      err instanceof Error ? err.message : "Unable to create payment";
    const isStock =
      /sold out|jar/i.test(message) || message.startsWith("Only ");
    return NextResponse.json(
      { error: message },
      { status: isStock ? 409 : 500 },
    );
  }
}
