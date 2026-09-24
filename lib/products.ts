import {
  LOWEST_PRICE_PER_OZ,
  priceCentsForOz,
  formatPrice,
  formatPricePerOz,
} from "./pricing";

export type ProductId = "quarter-pint" | "half-pint" | "pint" | "quart";

export type Product = {
  id: ProductId;
  name: string;
  volumeOz: number;
  description: string;
  image: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "quarter-pint",
    name: "Quarter Pint",
    volumeOz: 4,
    description: "A little taste of gold—perfect for gifting or sampling.",
    image: "/images/products/quarter-pint.png",
  },
  {
    id: "half-pint",
    name: "Half Pint",
    volumeOz: 8,
    description: "The pantry starter for toast, tea, and warm biscuits.",
    image: "/images/products/half-pint.png",
  },
  {
    id: "pint",
    name: "Pint",
    volumeOz: 16,
    description: "One pound of honey—just right for daily drizzling, baking, and sweet tea.",
    image: "/images/products/pint.png",
  },
  {
    id: "quart",
    name: "Quart",
    volumeOz: 32,
    description: "Two pounds of honey—the big jar for true honey lovers, bakers, and canning.",
    image: "/images/products/quart.png",
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

const PRODUCT_ALIASES: Record<string, ProductId> = {
  "quarter-pint": "quarter-pint",
  quarter: "quarter-pint",
  "4oz": "quarter-pint",
  "half-pint": "half-pint",
  half: "half-pint",
  "8oz": "half-pint",
  pint: "pint",
  "16oz": "pint",
  quart: "quart",
  "32oz": "quart",
};

/** Resolve a QR / query-string size (`pint`, `16oz`, `quarter-pint`) to a catalog id. */
export function parseProductId(value: string | undefined): ProductId | undefined {
  if (!value) return undefined;
  return PRODUCT_ALIASES[value.trim().toLowerCase()];
}

export function priceCentsForProduct(product: Product): number {
  return priceCentsForOz(product.volumeOz);
}

export function pricePerOzLabel(product: Product): string {
  return formatPricePerOz(product.volumeOz);
}

export { LOWEST_PRICE_PER_OZ, formatPrice };
