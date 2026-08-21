import { FAQ } from "@/components/FAQ";
import { Hero } from "@/components/Hero";
import { getStockMap } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stock = await getStockMap();

  return (
    <>
      <Hero stock={stock} />
      <FAQ stock={stock} />
    </>
  );
}
