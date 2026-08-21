import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { FARM, formatAddress, PICKUP_NOTE } from "@/lib/config";
import { db, ensureSchema } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { formatPrice } from "@/lib/products";
import styles from "./success.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order confirmed",
};

type Props = {
  searchParams: Promise<{ order?: string }>;
};

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { order: orderId } = await searchParams;
  let order = null;

  if (orderId) {
    try {
      await ensureSchema();
      const rows = await db
        .select()
        .from(orders)
        .where(eq(orders.publicId, orderId))
        .limit(1);
      order = rows[0] ?? null;
    } catch {
      order = null;
    }
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.card}>
          <h1 className={styles.title}>Thank you</h1>
          <p className={styles.lede}>
            Your honey order is in. A confirmation email is on the way
            {order ? ` to ${order.email}` : ""}.
          </p>

          {order ? (
            <div className={styles.meta}>
              <p>
                Order <strong>{order.publicId}</strong>
              </p>
              <p>Total {formatPrice(order.totalCents)}</p>
              {order.fulfillmentMethod === "pickup" ? (
                <p>
                  Pickup at {formatAddress()}. {PICKUP_NOTE}
                </p>
              ) : (
                <p>
                  Shipping to {order.shippingCity}, {order.shippingState}. We
                  will email tracking when your box leaves the farm.
                </p>
              )}
            </div>
          ) : (
            <p className={styles.lede}>
              If you just paid, your receipt will also appear in your email from{" "}
              {FARM.name}.
            </p>
          )}

          <div className={styles.actions}>
            <Link href="/order" className={styles.btn}>
              Shop again
            </Link>
            <Link href="/about#waitlist" className={styles.btnGhost}>
              Get honey flow alerts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
