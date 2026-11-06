import type { PipelineStats, PreparedItem } from "./pipeline";
import type { CatalogProduct, StockStatus } from "./types";

/**
 * bol.com Marketing Catalog API (RP-72). Instead of a feed we ask the best offer for the
 * EANs in our own catalog; bol is a marketplace, so we never import its whole range here.
 * Docs: https://api.bol.com/marketing/docs/catalog-api/
 */

/** Racketpicker in the bol partner programme (not secret; part of every link). */
export const BOL_SITE_ID = "1556484";

const TOKEN_URL = "https://login.bol.com/token?grant_type=client_credentials";
export const BOL_API = "https://api.bol.com/marketing/catalog/v1";
/** bol allows 10 requests per second: one at a time, at least this many ms apart. */
export const BOL_SPACING_MS = 150;
const RETRIES = 3;

export type BolOffer = {
  ean: string;
  condition?: string;
  isPreOrder?: boolean;
  price: number;
  strikethroughPrice?: number;
  minDeliveryDate?: string;
  maxDeliveryDate?: string;
  deliveryDescription?: string;
  url: string;
  seller?: { name?: string };
};

type Fetcher = typeof fetch;

export function bolAffiliateUrl(productUrl: string): string {
  return `https://partner.bol.com/click/click?t=url&s=${BOL_SITE_ID}&url=${encodeURIComponent(productUrl)}&f=api`;
}

/** True for a valid GTIN-8/12/13/14 check digit. */
export function validGtin(gtin: string): boolean {
  if (!/^\d{8}$|^\d{12,14}$/.test(gtin)) return false;
  const digits = [...gtin].map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

export async function getBolToken(fetcher: Fetcher = fetch): Promise<string> {
  const id = process.env.BOL_CLIENT_ID;
  const secret = process.env.BOL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Missing BOL_CLIENT_ID or BOL_CLIENT_SECRET");
  const res = await fetcher(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`bol token request failed: HTTP ${res.status}`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("bol token response had no access_token");
  return data.access_token;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Best offer for one EAN in NL, or null when bol has no orderable offer (404). */
export async function getBestOffer(
  ean: string,
  token: string,
  fetcher: Fetcher = fetch,
  wait: (ms: number) => Promise<unknown> = sleep,
): Promise<BolOffer | null> {
  const url = `${BOL_API}/products/${ean}/offers/best?country-code=NL&include-seller=true`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetcher(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Accept-Language": "nl",
      },
    });
    if (res.status === 404) return null;
    if ((res.status === 429 || res.status >= 500) && attempt < RETRIES) {
      await wait(1000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`bol offers/best failed for ${ean}: HTTP ${res.status}`);
    return (await res.json()) as BolOffer;
  }
}

export type BolMedia = {
  ean?: string;
  images?: {
    order?: number;
    mimeType?: string;
    renditions?: { width: number; height: number; url: string }[];
  }[];
};

/** Preferred photo width: sharp on the product page, small enough for the image sync. */
const IMAGE_WIDTH = 1200;

/**
 * URL of the main product photo: the first image by `order`, in the largest rendition
 * up to 1200px wide (else the smallest larger one). Null without a usable https image.
 */
export function pickBolImage(media: BolMedia | null): string | null {
  const image = [...(media?.images ?? [])]
    .filter((i) => i.renditions?.length)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
  if (!image) return null;
  const renditions = image.renditions!.filter((r) => r.url?.startsWith("https://") && r.width > 0);
  const fitting = renditions
    .filter((r) => r.width <= IMAGE_WIDTH)
    .sort((a, b) => b.width - a.width);
  const larger = renditions.filter((r) => r.width > IMAGE_WIDTH).sort((a, b) => a.width - b.width);
  return (fitting[0] ?? larger[0])?.url ?? null;
}

/**
 * Product photos for one EAN (RP-75). Never throws: a missing photo must not stop the
 * price import, so errors return null after the same retries as offers.
 */
export async function getMedia(
  ean: string,
  token: string,
  fetcher: Fetcher = fetch,
  wait: (ms: number) => Promise<unknown> = sleep,
): Promise<BolMedia | null> {
  // The media endpoint only takes 13-digit EANs; a 12-digit UPC gets a leading zero.
  const ean13 = ean.padStart(13, "0");
  if (!/^\d{13}$/.test(ean13)) return null;
  const url = `${BOL_API}/products/${ean13}/media`;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetcher(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Accept-Language": "nl",
        },
      });
      if (res.status === 404) return null;
      if ((res.status === 429 || res.status >= 500) && attempt < RETRIES) {
        await wait(1000 * (attempt + 1));
        continue;
      }
      if (!res.ok) {
        console.warn(`[feeds] bol media failed for ${ean}: HTTP ${res.status}`);
        return null;
      }
      return (await res.json()) as BolMedia;
    } catch (error) {
      console.warn(
        `[feeds] bol media failed for ${ean}:`,
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  }
}

/** One specification as bol returns it; `values` is a string or a list of strings. */
export type BolSpecification = { key?: string; name?: string; values?: string | string[] };
export type BolSpecificationGroup = { title?: string; specifications?: BolSpecification[] };

/**
 * Specifications of one product (RP-83), from /products/{ean}?include-specifications=true.
 * Null when bol does not know the EAN or the request fails; the caller tries again later.
 */
export async function getSpecifications(
  ean: string,
  token: string,
  fetcher: Fetcher = fetch,
  wait: (ms: number) => Promise<unknown> = sleep,
): Promise<BolSpecificationGroup[] | null> {
  // Like the media endpoint, bol expects a 13-digit EAN; a 12-digit UPC gets a leading zero.
  const ean13 = ean.padStart(13, "0");
  if (!/^\d{13}$/.test(ean13)) return null;
  const url = `${BOL_API}/products/${ean13}?country-code=NL&include-specifications=true`;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetcher(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Accept-Language": "nl",
        },
      });
      if (res.status === 404) return null;
      if ((res.status === 429 || res.status >= 500) && attempt < RETRIES) {
        await wait(1000 * (attempt + 1));
        continue;
      }
      if (!res.ok) {
        console.warn(`[feeds] bol specifications failed for ${ean}: HTTP ${res.status}`);
        return null;
      }
      const data = (await res.json()) as { specificationGroups?: BolSpecificationGroup[] };
      return data.specificationGroups ?? [];
    } catch (error) {
      console.warn(
        `[feeds] bol specifications failed for ${ean}:`,
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  }
}

function daysUntil(date: string | undefined, today: Date): number | null {
  if (!date) return null;
  const ms =
    Date.parse(`${date}T00:00:00Z`) -
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Number.isFinite(ms) ? Math.max(0, Math.round(ms / 86_400_000)) : null;
}

/** Our item for a bol offer, or null when it is not a new product with a usable price. */
export function offerToItem(
  offer: BolOffer,
  product: CatalogProduct,
  ean: string,
  today = new Date(),
): PreparedItem | null {
  if (offer.condition && offer.condition.toUpperCase() !== "NEW") return null;
  if (!(offer.price > 0 && offer.price < 10_000) || !offer.url?.startsWith("https://")) return null;
  const stockStatus: StockStatus = offer.isPreOrder ? "preorder" : "in_stock";
  const title = [product.brand, product.model, product.modelYear].filter(Boolean).join(" ");
  return {
    externalId: `bol:${ean}`,
    title,
    brand: product.brand,
    gtin: ean,
    category: product.category === "accessories" ? "padel accessories" : "padel rackets",
    price: Math.round(offer.price * 100) / 100,
    // bol shows shipping in the basket; unknown per offer here.
    shippingCost: null,
    stockStatus,
    deliveryDaysMin: daysUntil(offer.minDeliveryDate, today),
    deliveryDaysMax: daysUntil(offer.maxDeliveryDate, today),
    productUrl: offer.url,
    affiliateUrl: bolAffiliateUrl(offer.url),
    imageUrl: null,
    match: { status: "matched", method: "gtin", productId: product.id, score: 1 },
  };
}

/**
 * Asks bol for every catalog product with an EAN. The first EAN of a product with an
 * offer wins; for that EAN we also ask the photo. Any API error other than "no offer" aborts the run, so a bol outage never
 * turns our bol offers off.
 */
export async function fetchBolItems(
  catalog: CatalogProduct[],
  options: {
    fetcher?: Fetcher;
    today?: Date;
    wait?: (ms: number) => Promise<unknown>;
    /** Products that already have a photo: no media request for them. */
    withImage?: Set<string>;
  } = {},
): Promise<{ items: PreparedItem[]; stats: PipelineStats }> {
  const fetcher = options.fetcher ?? fetch;
  const withEan = catalog.filter((p) => p.gtins.some(validGtin));
  const stats: PipelineStats = {
    rows: withEan.length,
    invalid: 0,
    filteredOut: 0,
    duplicates: 0,
    kept: 0,
    matchedByGtin: 0,
    matchedByName: 0,
    pendingWithSuggestion: 0,
    pendingWithoutSuggestion: 0,
  };
  if (withEan.length === 0) return { items: [], stats };

  const token = await getBolToken(fetcher);
  const wait = options.wait ?? sleep;
  const items: PreparedItem[] = [];

  for (const product of withEan) {
    let item: PreparedItem | null = null;
    for (const ean of product.gtins.filter(validGtin)) {
      const offer = await getBestOffer(ean, token, fetcher, wait);
      await wait(BOL_SPACING_MS);
      if (!offer) continue;
      item = offerToItem(offer, product, ean, options.today);
      if (item) {
        // The photo for the image sync, which copies it to our storage once (RP-75).
        if (!options.withImage?.has(product.id)) {
          item.imageUrl = pickBolImage(await getMedia(ean, token, fetcher, wait));
          await wait(BOL_SPACING_MS);
        }
        break;
      }
      stats.invalid++;
    }
    if (item) items.push(item);
    else stats.filteredOut++;
  }

  items.sort((a, b) => a.externalId.localeCompare(b.externalId));
  stats.kept = stats.matchedByGtin = items.length;
  return { items, stats };
}
