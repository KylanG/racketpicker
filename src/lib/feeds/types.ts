import type { Database } from "@/lib/supabase/database.types";

export type StockStatus = Database["public"]["Enums"]["stock_status"];
export type AffiliateNetwork = Database["public"]["Enums"]["affiliate_network"];

/** One feed row after parsing, independent of the network it came from. */
export type NormalizedFeedItem = {
  externalId: string;
  title: string;
  brand: string | null;
  gtin: string | null;
  category: string | null;
  price: number;
  shippingCost: number | null;
  stockStatus: StockStatus;
  deliveryDaysMin: number | null;
  deliveryDaysMax: number | null;
  productUrl: string | null;
  affiliateUrl: string;
  imageUrl: string | null;
};

export type RawRow = Record<string, string>;

export type FeedAdapter = {
  network: AffiliateNetwork;
  /** Returns null when the row lacks the minimum fields (id, title, price, link). */
  toItem(row: RawRow): NormalizedFeedItem | null;
};

/** A catalog product the importer can match feed items against. */
export type CatalogProduct = {
  id: string;
  brand: string;
  model: string;
  modelYear: number | null;
  gtins: string[];
  /** Category key; set for the bol import, which covers accessories too (RP-77). */
  category?: string;
};

export type MatchResult =
  | { status: "matched"; method: "gtin" | "name"; productId: string; score: number }
  | { status: "pending"; suggestedProductId: string | null; score: number | null };
