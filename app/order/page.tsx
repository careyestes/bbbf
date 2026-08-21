import type { Metadata } from "next";
import { ProductGrid } from "@/components/ProductGrid";
import { FARM } from "@/lib/config";
import { getStockMap } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Honey",
  description: `Order pure raw honey from ${FARM.name} in Shaw, Mississippi. Harvested from our hives, gently strained, never heated or pasteurized.`,
};

export default async function OrderPage() {
  const stock = await getStockMap();

  return <ProductGrid stock={stock} />;
}
