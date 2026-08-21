import type { PublicStock } from "@/lib/inventory";
import { PRODUCTS, type ProductId } from "@/lib/products";
import { ProductCard } from "./ProductCard";
import styles from "./ProductGrid.module.css";

type Props = {
  stock: Record<ProductId, PublicStock>;
};

export function ProductGrid({ stock }: Props) {
  return (
    <section id="shop" className={styles.section}>
      <div className={`container ${styles.content}`}>
        <div className={styles.header}>
          <div className={styles.eyebrow}>
            <HexIcon />
            <span>2026 HARVEST</span>
          </div>
          <h1 className={styles.title}>Order your honey</h1>
          <p>
            Pick a jar size, add to cart, and we&apos;ll ship pure raw honey
            from our hives in Shaw, Mississippi, extracted from the comb,
            gently strained, never heated.
          </p>
        </div>
        <div className={styles.grid}>
          {PRODUCTS.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              stock={stock[product.id]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function HexIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
