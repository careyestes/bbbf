import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeDestinationZip } from "@/lib/shipping";
import { quoteShippingCents, UspsQuoteError } from "@/lib/usps";

const bodySchema = z.object({
  lines: z
    .array(
      z.object({
        productId: z.enum(["quarter-pint", "half-pint", "pint", "quart"]),
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .min(1),
  destinationZip: z.string().min(5).max(20),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid cart and ZIP code." },
        { status: 400 },
      );
    }

    const destinationZip = normalizeDestinationZip(parsed.data.destinationZip);
    if (!destinationZip) {
      return NextResponse.json(
        { error: "Enter a 5-digit ZIP code." },
        { status: 400 },
      );
    }

    const { shippingCents, parcels } = await quoteShippingCents(
      parsed.data.lines,
      destinationZip,
    );

    return NextResponse.json({
      shippingCents,
      parcels: parcels.map((parcel) => ({
        boxId: parcel.boxId,
        weightOz: parcel.weightOz,
        lengthIn: parcel.lengthIn,
        widthIn: parcel.widthIn,
        heightIn: parcel.heightIn,
      })),
    });
  } catch (err) {
    console.error("shipping-rate error", err);
    if (err instanceof UspsQuoteError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Could not calculate shipping." },
      { status: 502 },
    );
  }
}
