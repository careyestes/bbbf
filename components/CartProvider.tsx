"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { ProductId } from "@/lib/products";
import { getProduct, priceCentsForProduct } from "@/lib/products";
import type { CartLine } from "@/lib/shipping";

const STORAGE_KEY = "bbbf-cart-v1";
const CART_EVENT = "bbbf-cart-change";
const EMPTY_CART: CartLine[] = [];

/** Cached so useSyncExternalStore getSnapshot returns a stable reference. */
let cachedRaw: string | null = null;
let cachedLines: CartLine[] = EMPTY_CART;

function normalize(lines: CartLine[]): CartLine[] {
  return lines.filter((l) => l.quantity > 0 && getProduct(l.productId));
}

function linesEqual(a: CartLine[], b: CartLine[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every(
    (line, i) =>
      line.productId === b[i].productId && line.quantity === b[i].quantity,
  );
}

function readCart(): CartLine[] {
  if (typeof window === "undefined") return EMPTY_CART;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedLines;
    cachedRaw = raw;
    if (!raw) {
      cachedLines = EMPTY_CART;
      return cachedLines;
    }
    const next = normalize(JSON.parse(raw) as CartLine[]);
    cachedLines = linesEqual(cachedLines, next) ? cachedLines : next;
    return cachedLines;
  } catch {
    cachedRaw = null;
    cachedLines = EMPTY_CART;
    return EMPTY_CART;
  }
}

function getServerSnapshot(): CartLine[] {
  return EMPTY_CART;
}

function writeCart(lines: CartLine[]) {
  const normalized = normalize(lines);
  const raw = JSON.stringify(normalized);
  localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedLines = linesEqual(cachedLines, normalized) ? cachedLines : normalized;
  window.dispatchEvent(new Event(CART_EVENT));
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(CART_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CART_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  addItem: (productId: ProductId, quantity?: number) => void;
  setQuantity: (productId: ProductId, quantity: number) => void;
  removeItem: (productId: ProductId) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  justAdded: ProductId | null;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(subscribe, readCart, getServerSnapshot);
  const [isOpen, setIsOpen] = useState(false);
  const [justAdded, setJustAdded] = useState<ProductId | null>(null);

  const addItem = useCallback((productId: ProductId, quantity = 1) => {
    const prev = readCart();
    const existing = prev.find((l) => l.productId === productId);
    const next = existing
      ? prev.map((l) =>
          l.productId === productId
            ? { ...l, quantity: l.quantity + quantity }
            : l,
        )
      : [...prev, { productId, quantity }];
    writeCart(next);
    setJustAdded(productId);
    setIsOpen(true);
    window.setTimeout(() => setJustAdded(null), 1200);
  }, []);

  const setQuantity = useCallback((productId: ProductId, quantity: number) => {
    writeCart(
      readCart().map((l) =>
        l.productId === productId ? { ...l, quantity } : l,
      ),
    );
  }, []);

  const removeItem = useCallback((productId: ProductId) => {
    writeCart(readCart().filter((l) => l.productId !== productId));
  }, []);

  const clearCart = useCallback(() => writeCart([]), []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
    const subtotalCents = lines.reduce((s, l) => {
      const product = getProduct(l.productId);
      if (!product) return s;
      return s + priceCentsForProduct(product) * l.quantity;
    }, 0);

    return {
      lines,
      itemCount,
      subtotalCents,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      justAdded,
    };
  }, [lines, addItem, setQuantity, removeItem, clearCart, isOpen, justAdded]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
