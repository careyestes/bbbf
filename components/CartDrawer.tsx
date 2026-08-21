"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { getProduct, formatPrice, priceCentsForProduct } from "@/lib/products";
import { useCart } from "./CartProvider";
import styles from "./CartDrawer.module.css";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

export function CartDrawer() {
  const {
    lines,
    subtotalCents,
    isOpen,
    closeCart,
    setQuantity,
    removeItem,
  } = useCart();
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    lastFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previouslyFocused = lastFocusRef.current;
    const drawer = drawerRef.current;
    closeRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeCart();
        return;
      }
      if (event.key !== "Tab" || !drawer) return;

      const list = [...drawer.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1,
      );
      if (list.length === 0) return;

      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, closeCart]);

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`}
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        ref={drawerRef}
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}
        role="dialog"
        aria-modal={isOpen}
        aria-labelledby={titleId}
        inert={!isOpen || undefined}
      >
        <div className={styles.head}>
          <h2 id={titleId}>Your cart</h2>
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            onClick={closeCart}
            aria-label="Close cart"
          >
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M2 2l8 8M10 2L2 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className={styles.body}>
          {lines.length === 0 ? (
            <p className={styles.empty}>
              Your cart is empty. Pick a jar size to get started.
            </p>
          ) : (
            lines.map((line) => {
              const product = getProduct(line.productId);
              if (!product) return null;
              const unit = priceCentsForProduct(product);
              return (
                <div key={line.productId} className={styles.line}>
                  <Image
                    src={product.image}
                    alt=""
                    width={72}
                    height={86}
                    className={styles.thumb}
                  />
                  <div>
                    <p className={styles.lineName}>{product.name}</p>
                    <p className={styles.lineMeta}>
                      {formatPrice(unit)} · {product.volumeOz} fl oz
                    </p>
                    <div className={styles.lineControls}>
                      <div
                        className={styles.qty}
                        role="group"
                        aria-label={`Quantity of ${product.name}`}
                      >
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${product.name}`}
                          onClick={() =>
                            setQuantity(line.productId, line.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <span aria-live="polite" aria-atomic="true">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${product.name}`}
                          onClick={() =>
                            setQuantity(line.productId, line.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className={styles.remove}
                        onClick={() => removeItem(line.productId)}
                        aria-label={`Remove ${product.name} from cart`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className={styles.foot}>
          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <span>{formatPrice(subtotalCents)}</span>
          </div>
          {lines.length === 0 ? (
            <span
              className={`${styles.checkout} ${styles.checkoutDisabled}`}
              aria-disabled="true"
            >
              Checkout
            </span>
          ) : (
            <Link
              href="/checkout"
              className={styles.checkout}
              onClick={closeCart}
            >
              Checkout
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
