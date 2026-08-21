import { Resend } from "resend";
import { FARM, formatAddress, PICKUP_NOTE } from "./config";
import { formatPrice, getProduct } from "./products";
import type { Order } from "./db/schema";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const fromAddress =
  process.env.RESEND_FROM_EMAIL ??
  `${FARM.name} <orders@bigbluebarn.farm>`;

/** Where new-order alerts go — override with ORDER_NOTIFY_EMAIL if needed. */
function orderNotifyTo(): string {
  return process.env.ORDER_NOTIFY_EMAIL?.trim() || FARM.email;
}

type OrderItem = {
  name: string;
  quantity: number;
  unitPriceCents: number;
};

function parseItems(itemsJson: string): OrderItem[] {
  try {
    return JSON.parse(itemsJson) as OrderItem[];
  } catch {
    return [];
  }
}

function orderSummaryHtml(order: Order): string {
  const items = parseItems(order.itemsJson);
  const lines = items
    .map(
      (i) =>
        `<li>${i.quantity}× ${i.name} — ${formatPrice(i.unitPriceCents * i.quantity)}</li>`,
    )
    .join("");

  const fulfillment =
    order.fulfillmentMethod === "pickup"
      ? `<p><strong>Pickup</strong> at ${formatAddress()}<br/>${PICKUP_NOTE}</p>`
      : `<p><strong>Ship to</strong><br/>${order.name}<br/>${order.shippingLine1}${
          order.shippingLine2 ? `<br/>${order.shippingLine2}` : ""
        }<br/>${order.shippingCity}, ${order.shippingState} ${order.shippingZip}</p>`;

  return `
    <h2>Order ${order.publicId}</h2>
    <p>Hi ${order.name},</p>
    <p>Thanks for supporting ${FARM.name}.</p>
    <ul>${lines}</ul>
    <p>Subtotal: ${formatPrice(order.subtotalCents)}<br/>
    Shipping: ${formatPrice(order.shippingCents)}<br/>
    <strong>Total: ${formatPrice(order.totalCents)}</strong></p>
    ${fulfillment}
    <p>Questions? Email <a href="mailto:${FARM.email}">${FARM.email}</a>.</p>
  `;
}

async function sendOne(
  resend: Resend,
  payload: {
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
  },
) {
  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    replyTo: payload.replyTo,
  });

  if (error) {
    console.error("Resend send failed", {
      to: payload.to,
      subject: payload.subject,
      error,
    });
    throw new Error(
      `Resend failed for ${payload.to}: ${error.message ?? JSON.stringify(error)}`,
    );
  }

  console.info("Resend send ok", {
    to: payload.to,
    subject: payload.subject,
    id: data?.id,
  });
}

export async function sendOrderEmails(order: Order) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping order emails");
    return;
  }

  const html = orderSummaryHtml(order);
  const notifyTo = orderNotifyTo();

  const results = await Promise.allSettled([
    sendOne(resend, {
      to: order.email,
      subject: `Your honey order ${order.publicId} — ${FARM.name}`,
      html,
      replyTo: FARM.email,
    }),
    sendOne(resend, {
      to: notifyTo,
      subject: `New order ${order.publicId} — ${formatPrice(order.totalCents)}`,
      html: `
      <p>New paid order from ${order.name} (${order.email}${order.phone ? `, ${order.phone}` : ""}).</p>
      ${html}
    `,
      replyTo: order.email,
    }),
  ]);

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    for (const f of failures) {
      if (f.status === "rejected") console.error(f.reason);
    }
    throw new Error(
      `Order email(s) failed (${failures.length}/${results.length})`,
    );
  }
}

export async function sendWaitlistSignupEmail(entry: {
  name: string;
  email: string;
  alreadyJoined?: boolean;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping waitlist email");
    return;
  }

  const already = Boolean(entry.alreadyJoined);

  await sendOne(resend, {
    to: orderNotifyTo(),
    subject: already
      ? `Honey Alerts signup (already on list) — ${entry.name}`
      : `Honey Alerts signup — ${entry.name}`,
    html: `
      <p>${already ? "Someone submitted Honey Alerts again (already on the list):" : "Someone joined Honey Alerts:"}</p>
      <p><strong>Name:</strong> ${entry.name}<br/>
      <strong>Email:</strong> <a href="mailto:${entry.email}">${entry.email}</a></p>
    `,
    replyTo: entry.email,
  });
}

export async function sendLowStockEmail(
  items: { productId: string; quantity: number; lowStockAt: number }[],
) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping low-stock email");
    return;
  }

  const lines = items
    .map((item) => {
      const product = getProduct(item.productId);
      const name = product?.name ?? item.productId;
      if (item.quantity <= 0) {
        return `<li><strong>${name}</strong> — SOLD OUT</li>`;
      }
      return `<li><strong>${name}</strong> — ${item.quantity} left (alert at ${item.lowStockAt})</li>`;
    })
    .join("");

  await sendOne(resend, {
    to: orderNotifyTo(),
    subject: `Low honey stock alert — ${FARM.name}`,
    html: `
      <p>Inventory is running low after a recent sale:</p>
      <ul>${lines}</ul>
      <p>Update counts with <code>POST /api/inventory</code> (inventory secret)
      or adjust starting seeds in <code>lib/inventory-config.ts</code>.</p>
    `,
  });
}
