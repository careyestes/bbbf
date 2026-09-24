"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { cartStockIssueMessage } from "@/lib/cart-stock";
import { getProduct, formatPrice, priceCentsForProduct } from "@/lib/products";
import { useCart } from "./CartProvider";
import { useCartStock } from "./useCartStock";
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
  const { stock, issues, canCheckout, refresh } = useCartStock(lines, {
    refreshOnMount: false,
  });
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    void refresh();
  }, [isOpen, refresh]);

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
      <div
        id="cart-drawer"
        ref={drawerRef}
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}
        role={isOpen ? "dialog" : undefined}
        aria-modal={isOpen || undefined}
        aria-labelledby={isOpen ? titleId : undefined}
        aria-hidden={isOpen ? undefined : true}
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
            tabIndex={isOpen ? undefined : -1}
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
          {issues.length > 0 ? (
            <div className={styles.stockAlert} role="alert">
              {issues.map((issue) => (
                <p key={issue.productId}>{cartStockIssueMessage(issue)}</p>
              ))}
              <p>Update your cart before checkout.</p>
            </div>
          ) : null}
          {lines.length === 0 ? (
            <p className={styles.empty}>
              Your cart is empty. Pick a jar size to get started.
            </p>
          ) : (
            lines.map((line) => {
              const product = getProduct(line.productId);
              if (!product) return null;
              const unit = priceCentsForProduct(product);
              const available = stock?.[line.productId]?.quantity ?? 0;
              const lineIssue = issues.find(
                (issue) => issue.productId === line.productId,
              );
              const atMax = available > 0 && line.quantity >= available;
              return (
                <div
                  key={line.productId}
                  className={`${styles.line} ${lineIssue ? styles.lineUnavailable : ""}`}
                >
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
                    {lineIssue ? (
                      <p className={styles.lineStockIssue}>
                        {cartStockIssueMessage(lineIssue)}
                      </p>
                    ) : null}
                    <div className={styles.lineControls}>
                      <div
                        className={styles.qty}
                        role="group"
                        aria-label={`Quantity of ${product.name}`}
                      >
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${product.name}`}
                          tabIndex={isOpen ? undefined : -1}
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
                          disabled={atMax}
                          tabIndex={isOpen ? undefined : -1}
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
                        tabIndex={isOpen ? undefined : -1}
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
            <button
              type="button"
              className={`${styles.checkout} ${styles.checkoutDisabled}`}
              disabled
            >
              Checkout
            </button>
          ) : !canCheckout ? (
            <button
              type="button"
              className={`${styles.checkout} ${styles.checkoutDisabled}`}
              disabled
            >
              Checkout unavailable
            </button>
          ) : (
            <Link
              href="/checkout"
              className={styles.checkout}
              onClick={closeCart}
              tabIndex={isOpen ? undefined : -1}
            >
              Checkout
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
