"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCartStockIssues,
  type CartStockIssue,
} from "@/lib/cart-stock";
import type { PublicStock } from "@/lib/inventory";
import type { ProductId } from "@/lib/products";
import type { CartLine } from "@/lib/shipping";

type StockMap = Record<ProductId, PublicStock>;

export function useCartStock(
  lines: CartLine[],
  { refreshOnMount = true }: { refreshOnMount?: boolean } = {},
) {
  const [stock, setStock] = useState<StockMap | null>(null);
  const [loading, setLoading] = useState(refreshOnMount);

  const refresh = useCallback(async (): Promise<StockMap | null> => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory", { cache: "no-store" });
      if (!res.ok) return null;
      const data = (await res.json()) as { stock?: PublicStock[] };
      if (!data.stock) return null;
      const map = Object.fromEntries(
        data.stock.map((row) => [row.productId, row]),
      ) as StockMap;
      setStock(map);
      return map;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (refreshOnMount) void refresh();
  }, [refresh, refreshOnMount]);

  const issues = useMemo<CartStockIssue[]>(
    () => getCartStockIssues(lines, stock),
    [lines, stock],
  );

  return {
    stock,
    loading,
    issues,
    canCheckout: lines.length > 0 && issues.length === 0 && !loading,
    refresh,
  };
}
