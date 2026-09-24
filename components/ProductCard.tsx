"use client";

import Image from "next/image";
import type { PublicStock } from "@/lib/inventory";
import {
  formatPrice,
  priceCentsForProduct,
  type Product,
  type ProductId,
} from "@/lib/products";
import { useCart } from "./CartProvider";
import styles from "./ProductCard.module.css";

type Props = {
  product: Product;
  stock?: PublicStock;
  compact?: boolean;
  highlight?: boolean;
};

export function ProductCard({
  product,
  stock,
  compact = false,
  highlight = false,
}: Props) {
  const { addItem, justAdded } = useCart();
  const available = stock?.quantity ?? 0;
  const status = stock?.status ?? (available > 0 ? "ok" : "out");
  const price = priceCentsForProduct(product);
  const canBuy = available > 0;

  return (
    <article
      className={`${styles.card} ${compact ? styles.compact : ""} ${highlight ? styles.highlight : ""}`}
    >
      <div className={styles.media}>
        <Image
          src={product.image}
          alt={`${product.name} jar of honey`}
          fill
          sizes="(max-width: 799px) 92vw, (max-width: 1099px) 45vw, (max-width: 1400px) 22vw, 280px"
          className={styles.mediaImg}
        />
        {status === "out" && (
          <span className={`${styles.stockBadge} ${styles.stockOut}`}>
            Sold out
          </span>
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.info}>
          <span className={styles.volume}>{product.volumeOz} oz</span>
          <h2 className={styles.name}>{product.name}</h2>
          <p
            className={`${styles.stockCount} ${status === "low" ? styles.stockCountLow : ""} ${status === "out" ? styles.stockCountOut : ""}`}
          >
            {canBuy
              ? `${available} left`
              : "Sold out"}
          </p>
        </div>
        <button
          type="button"
          className={`${styles.add} ${justAdded === product.id ? styles.added : ""}`}
          disabled={!canBuy}
          onClick={() => {
            if (canBuy) addItem(product.id as ProductId, 1);
          }}
          aria-label={
            canBuy
              ? `Add ${product.name} for ${formatPrice(price)}`
              : `${product.name} sold out`
          }
        >
          <span className={styles.price}>{formatPrice(price)}</span>
          <span className={styles.addLabel}>{canBuy ? "+ Add" : "Sold out"}</span>
        </button>
      </div>
    </article>
  );
}
