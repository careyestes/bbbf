"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Header.module.css";

export function Header() {
  const { itemCount, isOpen, openCart, justAdded } = useCart();

  return (
    <header className={styles.siteHeader}>
      <div className={styles.inner}>
        <Link
          href="/"
          className={styles.brand}
          aria-label="Big Blue Barn Farm home"
        >
          <span className={styles.logoMark}>
            <Logo className={styles.logo} decorative />
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <Link
            href="/order"
            className={styles.orderBtn}
            aria-label="Order Your Honey"
          >
            <BasketIcon className={styles.icon} />
            <span aria-hidden="true">
              Order<span className={styles.orderRest}> Your Honey</span>
            </span>
          </Link>
          <ThemeToggle />
          <button
            type="button"
            className={styles.cartBtn}
            onClick={openCart}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-controls="cart-drawer"
            aria-label={
              itemCount === 1
                ? "Open cart, 1 item"
                : `Open cart, ${itemCount} items`
            }
          >
            <CartIcon className={styles.icon} />
            {itemCount > 0 && (
              <span
                className={`${styles.badge} ${justAdded ? styles.badgePulse : ""}`}
              >
                {itemCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}

function BasketIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
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

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 6h15l-1.5 9h-12L6 6Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M6 6 5 3H2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="9.5" cy="20" r="1.25" fill="currentColor" />
      <circle cx="17.5" cy="20" r="1.25" fill="currentColor" />
    </svg>
  );
}
