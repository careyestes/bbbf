"use client";

import { useState } from "react";
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

export function FAQ() {
  const [open, setOpen] = useState<Record<number, boolean>>({});

  return (
    <div className={styles.section}>
      <section className={`container ${styles.faq}`} aria-labelledby="faq-heading">
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
      </section>
    </div>
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
