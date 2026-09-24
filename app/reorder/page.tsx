import type { Metadata } from "next";
import Image from "next/image";
import { ProductCard } from "@/components/ProductCard";
import { WaitlistForm } from "@/components/WaitlistForm";
import { FARM } from "@/lib/config";
import { getStockMap } from "@/lib/inventory";
import { PRODUCTS, getProduct, parseProductId } from "@/lib/products";
import styles from "./reorder.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ size?: string }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { size } = await searchParams;
  const featured = parseProductId(size);
  const product = featured ? getProduct(featured) : undefined;

  if (product) {
    return {
      title: `Reorder ${product.name}`,
      description: `Jar empty? Reorder a ${product.name.toLowerCase()} of pure raw honey from ${FARM.name}.`,
    };
  }

  return {
    title: "Reorder Honey",
    description: `Jar empty? Reorder pure raw honey from ${FARM.name}. Harvested from our hives, gently strained, never heated or pasteurized.`,
  };
}

export default async function ReorderPage({ searchParams }: Props) {
  const { size } = await searchParams;
  const featuredId = parseProductId(size);
  const featured = featuredId ? getProduct(featuredId) : undefined;
  const stock = await getStockMap();
  const others = featured
    ? PRODUCTS.filter((p) => p.id !== featured.id)
    : PRODUCTS;

  return (
    <section className={styles.page}>
      <div className={`container ${styles.content}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            Oh, honey.
            <span>Run it back!</span>
          </h1>
          <p className={styles.lede}>
            {featured
              ? `Looks like you finished a ${featured.name.toLowerCase()}. Add another, or pick a different size. We will ship pure raw honey from our Shaw hives.`
              : "Jar empty? Pick a size and we will ship more pure raw honey from our farm in Shaw, Mississippi, extracted from the comb, gently strained, never heated."}
          </p>
        </header>

        {featured && (
          <div className={styles.featured}>
            <ProductCard
              product={featured}
              stock={stock[featured.id]}
              highlight
            />
          </div>
        )}

        <div className={styles.shop}>
          {featured && (
            <h2 className={styles.shopTitle}>Or pick another size</h2>
          )}
          <div className={featured ? styles.gridOthers : styles.grid}>
            {others.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                stock={stock[product.id]}
                compact={Boolean(featured)}
              />
            ))}
          </div>
        </div>

        <div className={styles.waitlistRow}>
          <div className={styles.waitlistPhoto}>
            <Image
              src="/images/reorder-waitlist-placeholder.png"
              alt="Honeycomb dripping with raw honey"
              fill
              className={styles.waitlistPhotoImg}
              sizes="(max-width: 860px) 100vw, 50vw"
            />
          </div>
          <section className={styles.waitlist} aria-labelledby="reorder-waitlist-heading">
            <h2 id="reorder-waitlist-heading">Honey flow alerts</h2>
            <p>
              Sold out, or want a heads-up next harvest? We will email you when
              jars are ready.
            </p>
            <WaitlistForm />
          </section>
        </div>
      </div>
    </section>
  );
}
