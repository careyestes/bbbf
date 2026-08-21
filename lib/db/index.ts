import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL ?? "file:./data/honey.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  const client = createClient(
    authToken ? { url, authToken } : { url },
  );

  return drizzle(client, { schema });
}

declare global {
  var __bbbfDb: ReturnType<typeof createDb> | undefined;
}

export const db = globalThis.__bbbfDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalThis.__bbbfDb = db;
}

export async function ensureSchema() {
  const url = process.env.DATABASE_URL ?? "file:./data/honey.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  const client = createClient(
    authToken ? { url, authToken } : { url },
  );

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      marketing_opt_in INTEGER NOT NULL DEFAULT 0,
      stripe_customer_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT NOT NULL UNIQUE,
      customer_id INTEGER REFERENCES customers(id),
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      fulfillment_method TEXT NOT NULL,
      shipping_line1 TEXT,
      shipping_line2 TEXT,
      shipping_city TEXT,
      shipping_state TEXT,
      shipping_zip TEXT,
      items_json TEXT NOT NULL,
      subtotal_cents INTEGER NOT NULL,
      shipping_cents INTEGER NOT NULL DEFAULT 0,
      total_cents INTEGER NOT NULL,
      marketing_opt_in INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      stripe_payment_intent_id TEXT,
      created_at TEXT NOT NULL,
      paid_at TEXT
    );

    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      product_id TEXT PRIMARY KEY,
      quantity INTEGER NOT NULL DEFAULT 0,
      low_stock_at INTEGER NOT NULL DEFAULT 5,
      low_notified INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
  `);
}
