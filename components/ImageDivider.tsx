import Image from "next/image";
import styles from "./ImageDivider.module.css";

export function ImageDivider() {
  return (
    <section className={styles.divider} aria-label="Honey jars">
      <Image
        src="/images/jars-table.jpg"
        alt="Rows of small square corked honey jars on a wooden table, with a gold bee charm on the jar in front"
        fill
        className={styles.image}
        sizes="100vw"
        priority={false}
      />
    </section>
  );
}
