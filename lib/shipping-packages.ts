import type { ProductId } from "./products";

type PackableLine = {
  productId: ProductId;
  quantity: number;
};

export type BoxId = "small" | "large";

export type ShippingBox = {
  id: BoxId;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  tareOz: number;
  maxSlots: number;
};

export type ProductPacking = {
  boxId: BoxId;
  packedAloneOz: number;
  slots: number;
};

export type ParcelContents = {
  productId: ProductId;
  quantity: number;
};

export type ShippingParcel = {
  boxId: BoxId;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  weightOz: number;
  contents: ParcelContents[];
};

/**
 * Two ship boxes. Tare is the empty-box + packing estimate; jar-only
 * weight is packed-alone minus tare. Tune tare/slots here if packing changes.
 */
export const BOXES: Record<BoxId, ShippingBox> = {
  small: {
    id: "small",
    lengthIn: 8,
    widthIn: 5.5,
    heightIn: 5.5,
    tareOz: 3,
    maxSlots: 4,
  },
  large: {
    id: "large",
    lengthIn: 8.375,
    widthIn: 5.25,
    heightIn: 5.25,
    tareOz: 4,
    maxSlots: 2,
  },
};

/** Packed weight = one jar + its box. Slots are relative to that box’s max. */
export const PRODUCT_PACKING: Record<ProductId, ProductPacking> = {
  "quarter-pint": { boxId: "small", packedAloneOz: 12, slots: 1 },
  "half-pint": { boxId: "small", packedAloneOz: 18, slots: 1 },
  pint: { boxId: "small", packedAloneOz: 32, slots: 2 },
  quart: { boxId: "large", packedAloneOz: 51, slots: 1 },
};

export function jarOnlyOz(productId: ProductId): number {
  const spec = PRODUCT_PACKING[productId];
  return spec.packedAloneOz - BOXES[spec.boxId].tareOz;
}

function expandUnits(lines: PackableLine[]): ProductId[] {
  const units: ProductId[] = [];
  for (const line of lines) {
    for (let i = 0; i < line.quantity; i += 1) {
      units.push(line.productId);
    }
  }
  return units.sort(
    (a, b) => PRODUCT_PACKING[b].slots - PRODUCT_PACKING[a].slots,
  );
}

function packBoxType(boxId: BoxId, units: ProductId[]): ShippingParcel[] {
  const box = BOXES[boxId];
  const bins: ProductId[][] = [];

  for (const productId of units) {
    const slots = PRODUCT_PACKING[productId].slots;
    const fit = bins.find(
      (bin) =>
        bin.reduce((sum, id) => sum + PRODUCT_PACKING[id].slots, 0) + slots <=
        box.maxSlots,
    );
    if (fit) {
      fit.push(productId);
    } else {
      bins.push([productId]);
    }
  }

  return bins.map((bin) => {
    const counts = new Map<ProductId, number>();
    for (const productId of bin) {
      counts.set(productId, (counts.get(productId) ?? 0) + 1);
    }
    const contents = [...counts.entries()].map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
    const weightOz =
      box.tareOz +
      contents.reduce(
        (sum, item) => sum + jarOnlyOz(item.productId) * item.quantity,
        0,
      );
    return {
      boxId,
      lengthIn: box.lengthIn,
      widthIn: box.widthIn,
      heightIn: box.heightIn,
      weightOz,
      contents,
    };
  });
}

/** Split a cart into USPS parcels (small boxes for 4/8/16 oz, large for quarts). */
export function buildParcels(lines: PackableLine[]): ShippingParcel[] {
  const units = expandUnits(lines.filter((line) => line.quantity > 0));
  const small = units.filter((id) => PRODUCT_PACKING[id].boxId === "small");
  const large = units.filter((id) => PRODUCT_PACKING[id].boxId === "large");
  return [...packBoxType("small", small), ...packBoxType("large", large)];
}

export const parcelsFromCart = buildParcels;
