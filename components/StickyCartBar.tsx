"use client";

import { formatPrice } from "@/lib/products";
import { useCart } from "./CartProvider";
import styles from "./StickyCartBar.module.css";

export function StickyCartBar() {
  const { itemCount, subtotalCents, openCart } = useCart();
  if (itemCount === 0) return null;

  return (
    <div className={`${styles.bar} ${styles.barVisible}`}>
      <div className={styles.inner}>
        <div role="status" aria-live="polite" aria-atomic="true">
          <p className={styles.meta}>
            {itemCount} item{itemCount === 1 ? "" : "s"} in cart
          </p>
          <p className={styles.total}>{formatPrice(subtotalCents)}</p>
        </div>
        <button type="button" className={styles.btn} onClick={openCart}>
          View cart
        </button>
      </div>
    </div>
  );
}
