import Link from "next/link";
import { FARM, formatAddress } from "@/lib/config";
import { CTABanner } from "./CTABanner";
import { Logo } from "./Logo";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <CTABanner />
      <div className={styles.main}>
        <div className={`container ${styles.grid}`}>
          <div className={styles.brandCol}>
            <div className={styles.brandRow}>
              <span className={styles.logoMark}>
                <Logo className={styles.logo} decorative />
              </span>
              <p className={styles.brand}>{FARM.name}</p>
            </div>
            <p className={styles.blurb}>
              Pure raw honey, straight from the comb — harvested from our
              hives, gently strained, and never heated or pasteurized. Raised
              with love by our family in the heart of the Mississippi Delta.
            </p>
          </div>
          <div>
            <p className={styles.heading}>VISIT US</p>
            <ul className={styles.list}>
              <li>{formatAddress()}</li>
              <li>We ship nationwide</li>
            </ul>
          </div>
          <div>
            <p className={styles.heading}>SAY HELLO</p>
            <ul className={styles.list}>
              <li>
                <a href={`mailto:${FARM.email}`}>{FARM.email}</a>
              </li>
              <li>
                <Link href="/about#waitlist">Honey flow alerts</Link>
              </li>
              <li>
                <Link href="/reorder">Reorder honey</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className={`container ${styles.bottom}`}>
          <p className={styles.copy}>
            © {new Date().getFullYear()} {FARM.name} · Shaw, MS
          </p>
          <p className={styles.tag}>Made with care in the Delta</p>
        </div>
      </div>
    </footer>
  );
}
