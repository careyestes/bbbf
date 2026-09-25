import { FARM } from "./config";
import type { CartLine } from "./shipping";
import {
  buildParcels,
  type ShippingParcel,
} from "./shipping-packages";

const DEFAULT_API_BASE = "https://apis.usps.com";
const TOKEN_REFRESH_BUFFER_MS = 60_000;

export class UspsQuoteError extends Error {
  constructor(
    message: string,
    readonly status: number = 502,
  ) {
    super(message);
    this.name = "UspsQuoteError";
  }
}

type TokenCache = {
  token: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

function apiBase(): string {
  return (process.env.USPS_API_BASE || DEFAULT_API_BASE).replace(/\/$/, "");
}

function todayInFarmTz(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
  }).format(new Date());
}

function uspsErrorMessage(json: unknown, fallback: string): string {
  if (!json || typeof json !== "object") return fallback;
  const root = json as {
    error?: { message?: string; errors?: { title?: string; detail?: string }[] };
    message?: string;
  };
  const nested = root.error?.errors?.[0];
  return (
    root.error?.message ||
    nested?.detail ||
    nested?.title ||
    root.message ||
    fallback
  );
}

function dollarsToCents(value: number): number {
  return Math.round(value * 100);
}

function positivePrice(...values: unknown[]): number[] {
  return values
    .map((value) => Number(value))
    .filter((price) => Number.isFinite(price) && price > 0);
}

function extractTotalPrice(json: unknown): number {
  if (!json || typeof json !== "object") {
    throw new UspsQuoteError("USPS returned an empty rate response.");
  }

  const root = json as {
    rateOptions?: {
      totalPrice?: number;
      totalBasePrice?: number;
      rates?: { totalPrice?: number; price?: number }[];
    }[];
    rates?: { totalPrice?: number; price?: number }[];
    totalPrice?: number;
    totalBasePrice?: number;
  };

  const candidates: number[] = [];

  for (const option of root.rateOptions ?? []) {
    candidates.push(
      ...positivePrice(option.totalPrice, option.totalBasePrice),
    );
    for (const rate of option.rates ?? []) {
      candidates.push(...positivePrice(rate.totalPrice, rate.price));
    }
  }

  for (const rate of root.rates ?? []) {
    candidates.push(...positivePrice(rate.totalPrice, rate.price));
  }

  candidates.push(...positivePrice(root.totalPrice, root.totalBasePrice));

  if (candidates.length === 0) {
    throw new UspsQuoteError("USPS did not return a Ground Advantage price.");
  }

  return Math.min(...candidates);
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.USPS_CLIENT_ID;
  const clientSecret = process.env.USPS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("USPS_CLIENT_ID or USPS_CLIENT_SECRET is not set");
    throw new UspsQuoteError(
      "Shipping rates are unavailable right now. Please try again shortly.",
      503,
    );
  }

  if (tokenCache && tokenCache.expiresAt - TOKEN_REFRESH_BUFFER_MS > Date.now()) {
    return tokenCache.token;
  }

  const res = await fetch(`${apiBase()}/oauth2/v3/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  const json = (await res.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: string | number;
  } | null;

  if (!res.ok || !json?.access_token) {
    throw new UspsQuoteError(
      uspsErrorMessage(json, "Could not authenticate with USPS."),
      res.status === 401 || res.status === 403 ? 503 : 502,
    );
  }

  const expiresInSec = Number(json.expires_in);
  tokenCache = {
    token: json.access_token,
    expiresAt:
      Date.now() +
      (Number.isFinite(expiresInSec) ? expiresInSec * 1000 : 50 * 60 * 1000),
  };
  return tokenCache.token;
}

function parcelDims(parcel: ShippingParcel) {
  const [lengthIn, widthIn, heightIn] = [
    parcel.lengthIn,
    parcel.widthIn,
    parcel.heightIn,
  ].sort((a, b) => b - a);
  return { lengthIn, widthIn, heightIn };
}

export async function quoteGroundAdvantage(
  parcel: ShippingParcel,
  destinationZip: string,
): Promise<number> {
  const token = await getAccessToken();
  const { lengthIn, widthIn, heightIn } = parcelDims(parcel);
  const weightLb = Math.round((parcel.weightOz / 16) * 1000) / 1000;

  const res = await fetch(`${apiBase()}/prices/v3/total-rates/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      originZIPCode: FARM.address.zip,
      destinationZIPCode: destinationZip,
      weight: weightLb,
      length: lengthIn,
      width: widthIn,
      height: heightIn,
      mailClass: "USPS_GROUND_ADVANTAGE",
      processingCategory: "MACHINABLE",
      destinationEntryFacilityType: "NONE",
      rateIndicator: "SP",
      priceType: "RETAIL",
      mailingDate: todayInFarmTz(),
    }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) {
      tokenCache = null;
    }
    throw new UspsQuoteError(
      uspsErrorMessage(json, "USPS could not calculate shipping for this address."),
      res.status >= 400 && res.status < 500 ? 400 : 502,
    );
  }

  return dollarsToCents(extractTotalPrice(json));
}

export async function quoteShippingCents(
  lines: CartLine[],
  destinationZip: string,
): Promise<{ shippingCents: number; parcels: ShippingParcel[] }> {
  const parcels = buildParcels(lines);
  if (parcels.length === 0) {
    return { shippingCents: 0, parcels };
  }

  let shippingCents = 0;
  for (const parcel of parcels) {
    shippingCents += await quoteGroundAdvantage(parcel, destinationZip);
  }
  return { shippingCents, parcels };
}
