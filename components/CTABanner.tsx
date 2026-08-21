import Link from "next/link";
import styles from "./CTABanner.module.css";

export function CTABanner() {
  return (
    <section className={styles.banner} aria-labelledby="cta-heading">
      <div className={`container ${styles.inner}`}>
        <div className={styles.text}>
          <h2 id="cta-heading">Ready for a jar of gold?</h2>
          <p>
            Order online and we&apos;ll ship your jars, or say hello at the
            Saturday farmers market.
          </p>
        </div>
        <Link href="/order" className={styles.btn}>
          <BasketIcon />
          Order Your Honey
        </Link>
      </div>
    </section>
  );
}

function BasketIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m5 11 1.5-5h11L19 11M5 11v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M5 11h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 3v3M8.5 5.5 10 8M15.5 5.5 14 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
