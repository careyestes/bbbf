import type { PublicStock } from "@/lib/inventory";
import { PRODUCTS, type ProductId } from "@/lib/products";
import { HeroHeading } from "./HeroHeading";
import { HeroVideos } from "./HeroVideos";
import { ProductCard } from "./ProductCard";
import styles from "./Hero.module.css";

type Props = {
  stock: Record<ProductId, PublicStock>;
};

export function Hero({ stock }: Props) {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <HeroVideos />

      <div className={styles.shell}>
        <div className={styles.main}>
          <HeroHeading />

          <section
            id="shop"
            className={`${styles.shop} fade-up-delay`}
            aria-label="Order honey"
          >
            {PRODUCTS.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                stock={stock[product.id]}
                compact
              />
            ))}
          </section>
        </div>
      </div>
    </section>
  );
}
