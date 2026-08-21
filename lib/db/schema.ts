import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  marketingOptIn: integer("marketing_opt_in", { mode: "boolean" })
    .notNull()
    .default(false),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  publicId: text("public_id").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  email: text("email").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  fulfillmentMethod: text("fulfillment_method").notNull(), // pickup | shipping
  shippingLine1: text("shipping_line1"),
  shippingLine2: text("shipping_line2"),
  shippingCity: text("shipping_city"),
  shippingState: text("shipping_state"),
  shippingZip: text("shipping_zip"),
  itemsJson: text("items_json").notNull(),
  subtotalCents: integer("subtotal_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  marketingOptIn: integer("marketing_opt_in", { mode: "boolean" })
    .notNull()
    .default(false),
  status: text("status").notNull().default("pending"), // pending | paid | fulfilled | cancelled
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  paidAt: text("paid_at"),
});

export const waitlist = sqliteTable("waitlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const inventory = sqliteTable("inventory", {
  productId: text("product_id").primaryKey(),
  quantity: integer("quantity").notNull().default(0),
  lowStockAt: integer("low_stock_at").notNull().default(5),
  /** 1 once a low-stock email has been sent; cleared on restock above threshold */
  lowNotified: integer("low_notified", { mode: "boolean" })
    .notNull()
    .default(false),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type Customer = typeof customers.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type WaitlistEntry = typeof waitlist.$inferSelect;
export type InventoryRow = typeof inventory.$inferSelect;
