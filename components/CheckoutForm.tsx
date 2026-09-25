"use client";

import {
  PaymentElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
} from "react";
import { FARM } from "@/lib/config";
import {
  formatPrice,
  getProduct,
  priceCentsForProduct,
} from "@/lib/products";
import { normalizeDestinationZip } from "@/lib/shipping";
import type { ThemeName } from "@/lib/theme";
import { getStripeAppearance } from "@/lib/stripe-appearance";
import { cartStockIssueMessage, cartStockSummary, getCartStockIssues } from "@/lib/cart-stock";
import { useCart } from "./CartProvider";
import { useCartStock } from "./useCartStock";
import { useTheme } from "./ThemeProvider";
import styles from "./CheckoutForm.module.css";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

type Contact = {
  name: string;
  email: string;
  phone: string;
  marketingOptIn: boolean;
  shippingLine1: string;
  shippingLine2: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
};

const emptyContact: Contact = {
  name: "",
  email: "",
  phone: "",
  marketingOptIn: true,
  shippingLine1: "",
  shippingLine2: "",
  shippingCity: "",
  shippingState: "MS",
  shippingZip: "",
};

/** Formats as (662) 255-2884 while typing; keeps at most 10 digits. */
function formatUsPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function CheckoutForm() {
  const { lines, subtotalCents, clearCart } = useCart();
  const { issues, canCheckout, refresh } = useCartStock(lines);
  const { theme } = useTheme();
  const [contact, setContact] = useState<Contact>(emptyContact);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderPublicId, setOrderPublicId] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<{ key: string; cents: number } | null>(
    null,
  );
  const [quoteError, setQuoteError] = useState<{
    key: string;
    message: string;
  } | null>(null);

  const destinationZip = normalizeDestinationZip(contact.shippingZip);
  const quoteKey = destinationZip
    ? `${JSON.stringify(lines)}|${destinationZip}`
    : null;
  const quoteReady = Boolean(quote && quote.key === quoteKey);
  const shippingCents = quoteReady && quote ? quote.cents : null;
  const shippingStatus = !destinationZip
    ? "need-zip"
    : quoteReady
      ? "ready"
      : quoteError?.key === quoteKey
        ? "error"
        : "loading";
  const shippingError =
    shippingStatus === "error" ? quoteError?.message ?? null : null;
  const totalCents =
    shippingCents == null ? null : subtotalCents + shippingCents;
  const paymentVisible =
    Boolean(clientSecret) && quoteReady && issues.length === 0;

  const summary = useMemo(
    () =>
      lines
        .map((line) => {
          const product = getProduct(line.productId);
          if (!product) return null;
          return {
            ...line,
            name: product.name,
            unitPriceCents: priceCentsForProduct(product),
          };
        })
        .filter(Boolean),
    [lines],
  );

  useEffect(() => {
    if (lines.length === 0 || !quoteKey || !destinationZip) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/shipping-rate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lines,
            destinationZip,
          }),
          signal: controller.signal,
        });
        const data = (await res.json()) as {
          shippingCents?: number;
          error?: string;
        };
        if (!res.ok || typeof data.shippingCents !== "number") {
          throw new Error(data.error || "Could not calculate shipping.");
        }
        setQuote({ key: quoteKey, cents: data.shippingCents });
        setQuoteError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setQuoteError({
          key: quoteKey,
          message:
            err instanceof Error
              ? err.message
              : "Could not calculate shipping.",
        });
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [destinationZip, lines, quoteKey]);

  async function preparePayment() {
    setError(null);
    if (lines.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const stock = await refresh();
    const latestIssues = getCartStockIssues(lines, stock);
    if (latestIssues.length > 0) {
      setError(cartStockSummary(latestIssues));
      return;
    }

    if (!contact.name || !contact.email) {
      setError("Name and email are required.");
      return;
    }
    if (
      !contact.shippingLine1 ||
      !contact.shippingCity ||
      !contact.shippingState ||
      !destinationZip
    ) {
      setError("Please complete your shipping address.");
      return;
    }
    if (!quoteReady) {
      setError(shippingError || "Wait for shipping to calculate before paying.");
      return;
    }

    setPreparing(true);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines,
          fulfillmentMethod: "shipping",
          ...contact,
        }),
      });
      const data = (await res.json()) as {
        clientSecret?: string;
        orderPublicId?: string;
        error?: string;
      };
      if (!res.ok || !data.clientSecret || !data.orderPublicId) {
        throw new Error(data.error || "Could not start checkout");
      }
      setClientSecret(data.clientSecret);
      setOrderPublicId(data.orderPublicId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setPreparing(false);
    }
  }

  if (lines.length === 0 && !clientSecret) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <h1 className={styles.title}>Checkout</h1>
          <p className={styles.empty}>
            Your cart is empty. <Link href="/order">Choose a jar</Link> to
            continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <h1 className={styles.title}>Checkout</h1>
        <p className={styles.lede}>
          Pay securely on this page — Apple Pay, Google Pay, or card.
        </p>
        {issues.length > 0 ? (
          <div className={styles.stockAlert} role="alert">
            {issues.map((issue) => (
              <p key={issue.productId}>{cartStockIssueMessage(issue)}</p>
            ))}
            <p>
              Remove or adjust items in your{" "}
              <Link href="/order">cart</Link> before continuing.
            </p>
          </div>
        ) : null}
        <div className={styles.layout}>
          <div className={styles.panel}>
            <h2>Your details</h2>
            <form
              autoComplete="on"
              aria-describedby={error ? "checkout-error" : undefined}
              onSubmit={(e) => {
                e.preventDefault();
                if (!clientSecret) void preparePayment();
              }}
            >
            <div className={styles.grid2}>
              <Field
                label="Name"
                name="name"
                value={contact.name}
                onChange={(v) => {
                  setContact({ ...contact, name: v });
                  setClientSecret(null);
                }}
                autoComplete="name"
                full
              />
              <Field
                label="Email"
                name="email"
                type="email"
                value={contact.email}
                onChange={(v) => {
                  setContact({ ...contact, email: v });
                  setClientSecret(null);
                }}
                autoComplete="email"
              />
              <Field
                label="Phone"
                name="tel"
                type="tel"
                value={contact.phone}
                onChange={(v) => {
                  setContact({ ...contact, phone: formatUsPhone(v) });
                  setClientSecret(null);
                }}
                autoComplete="tel"
                placeholder="(662) 555-1234"
                optional
              />
            </div>

            <div className={styles.grid2} style={{ marginTop: "0.85rem" }}>
              <Field
                label="Address"
                name="address-line1"
                value={contact.shippingLine1}
                onChange={(v) => {
                  setContact({ ...contact, shippingLine1: v });
                  setClientSecret(null);
                }}
                autoComplete="shipping address-line1"
                full
              />
              <Field
                label="Apt / suite"
                name="address-line2"
                value={contact.shippingLine2}
                onChange={(v) => {
                  setContact({ ...contact, shippingLine2: v });
                  setClientSecret(null);
                }}
                autoComplete="shipping address-line2"
                full
                optional
              />
              <Field
                label="City"
                name="address-level2"
                value={contact.shippingCity}
                onChange={(v) => {
                  setContact({ ...contact, shippingCity: v });
                  setClientSecret(null);
                }}
                autoComplete="shipping address-level2"
              />
              <Field
                label="State"
                name="address-level1"
                value={contact.shippingState}
                onChange={(v) => {
                  setContact({ ...contact, shippingState: v });
                  setClientSecret(null);
                }}
                autoComplete="shipping address-level1"
              />
              <Field
                label="ZIP"
                name="postal-code"
                value={contact.shippingZip}
                onChange={(v) => {
                  setContact({ ...contact, shippingZip: v });
                  setClientSecret(null);
                }}
                autoComplete="shipping postal-code"
                inputMode="numeric"
              />
            </div>

            <label className={styles.check}>
              <input
                type="checkbox"
                name="marketing"
                className={styles.checkInput}
                checked={contact.marketingOptIn}
                onChange={(e) =>
                  setContact({
                    ...contact,
                    marketingOptIn: e.target.checked,
                  })
                }
              />
              <span className={styles.checkBox} aria-hidden="true" />
              <span className={styles.checkLabel}>
                Email me about future honey flows and reorders from{" "}
                {FARM.shortName}.
              </span>
            </label>

            {error && (
              <p className={styles.error} role="alert" id="checkout-error">
                {error}
              </p>
            )}

            {!paymentVisible ? (
              <button
                type="submit"
                className={styles.payBtn}
                disabled={preparing || !canCheckout || !quoteReady}
              >
                {preparing
                  ? "Preparing payment…"
                  : shippingStatus === "loading"
                    ? "Calculating shipping…"
                    : "Continue to payment"}
              </button>
            ) : null}
            </form>
            {paymentVisible ? (
              <div className={styles.paymentMount}>
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret: clientSecret!,
                    appearance: getStripeAppearance(),
                  }}
                >
                  <PayStep
                    orderPublicId={orderPublicId!}
                    onPaid={clearCart}
                    theme={theme}
                  />
                </Elements>
              </div>
            ) : null}
          </div>

          <section className={styles.panel} aria-labelledby="order-summary-heading">
            <h2 id="order-summary-heading">Order summary</h2>
            {summary.map((line) =>
              line ? (
                <div
                  key={line.productId}
                  className={`${styles.summaryLine} ${
                    issues.some((issue) => issue.productId === line.productId)
                      ? styles.summaryLineUnavailable
                      : ""
                  }`}
                >
                  <span>
                    {line.quantity}× {line.name}
                    {issues.some((issue) => issue.productId === line.productId)
                      ? " — unavailable"
                      : ""}
                  </span>
                  <span>
                    {formatPrice(line.unitPriceCents * line.quantity)}
                  </span>
                </div>
              ) : null,
            )}
            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>{formatPrice(subtotalCents)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>Shipping</span>
                <span
                  className={
                    quoteReady ? undefined : styles.shippingPending
                  }
                >
                  {shippingStatus === "loading"
                    ? "Calculating…"
                    : shippingStatus === "error"
                      ? "Unavailable"
                      : shippingCents != null
                        ? formatPrice(shippingCents)
                        : "Enter ZIP"}
                </span>
              </div>
              {shippingStatus === "error" && shippingError ? (
                <p className={styles.shippingError} role="alert">
                  {shippingError}
                </p>
              ) : null}
              <div className={`${styles.totalRow} ${styles.grand}`}>
                <span>Total</span>
                <span>
                  {totalCents == null ? "—" : formatPrice(totalCents)}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  autoComplete,
  full,
  placeholder,
  optional,
  inputMode,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  full?: boolean;
  placeholder?: string;
  optional?: boolean;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const id = `checkout-${name}`;
  return (
    <div className={`${styles.field} ${full ? styles.fieldFull : ""}`}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {optional ? (
          <span className={styles.optional}> (optional)</span>
        ) : (
          <span className="sr-only"> (required)</span>
        )}
      </label>
      <input
        id={id}
        name={name}
        className={styles.input}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode ?? (type === "tel" ? "tel" : undefined)}
        required={!optional}
      />
    </div>
  );
}

function PayStep({
  orderPublicId,
  onPaid,
  theme,
}: {
  orderPublicId: string;
  onPaid: () => void;
  theme: ThemeName;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = Boolean(stripe && elements);

  useEffect(() => {
    elements?.update({ appearance: getStripeAppearance() });
  }, [theme, elements]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const returnUrl = `${window.location.origin}/order/success?order=${encodeURIComponent(orderPublicId)}`;

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "Payment failed");
      setSubmitting(false);
      return;
    }

    onPaid();
    router.push(`/order/success?order=${encodeURIComponent(orderPublicId)}`);
  }

  return (
    <form onSubmit={onSubmit}>
      <PaymentElement />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        className={styles.payBtn}
        disabled={!ready || submitting}
      >
        {submitting ? "Processing…" : "Pay now"}
      </button>
    </form>
  );
}
