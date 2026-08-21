"use client";

import { useState } from "react";
import type { PublicStock } from "@/lib/inventory";
import { PRODUCTS, type ProductId } from "@/lib/products";
import { ProductCard } from "./ProductCard";
import styles from "./FAQ.module.css";

const FAQS = [
  {
    q: "How should I store the honey?",
    a: "Keep jars at room temperature, sealed tight, out of direct sun. No need to refrigerate.",
  },
  {
    q: "Is your honey raw?",
    a: "Yes. Harvested from our hives, extracted from the comb, and gently strained. Never heated or pasteurized.",
  },
  {
    q: "Why did my honey crystallize?",
    a: "Crystallization is natural for raw honey. Warm the jar gently in a bowl of warm water and it will return to liquid.",
  },
  {
    q: "Do you ship?",
    a: "Yes. Flat-rate shipping is calculated by how many jars you order. You'll see the exact amount before you pay.",
  },
  {
    q: "When is honey flow?",
    a: "Flow depends on the Mississippi bloom each season. Join our waitlist on the About page and we'll reach out when jars are ready.",
  },
];

export function FAQ({ stock }: { stock: Record<ProductId, PublicStock> }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});

  return (
    <section className={styles.section} aria-labelledby="faq-heading">
      <div className={styles.rings} aria-hidden />
      <div className={styles.drip} aria-hidden />
      <div className={styles.medallionScene}>
        <div className={styles.medallion}>
          <div className={styles.medallionInner}>
            <p className={styles.sub}>Get the 2026 Honey Run before it&apos;s gone!</p>
          </div>
        </div>
      </div>
      <section className={`container ${styles.shop}`} aria-label="Honey jars">
        {PRODUCTS.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            stock={stock[product.id]}
          />
        ))}
      </section>
      <div className="container">
        <div className={styles.header}>
          <h2 id="faq-heading">FAQ</h2>
          <p>Quick answers about ordering and keeping honey fresh.</p>
        </div>
        <div className={styles.list}>
          {FAQS.map((item, index) => {
            const isOpen = !!open[index];
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;

            return (
              <div
                key={item.q}
                className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}
              >
                <button
                  id={buttonId}
                  type="button"
                  className={styles.trigger}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() =>
                    setOpen((prev) => ({ ...prev, [index]: !prev[index] }))
                  }
                >
                  <span className={styles.question}>{item.q}</span>
                  <span className={styles.icon} aria-hidden>
                    <ChevronIcon />
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={styles.panel}
                  hidden={!isOpen}
                >
                  <div className={styles.panelInner}>
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
