import { getAdapter } from "./adapters";
import { decodeFeed, parseCsv } from "./csv";
import { classifyItem, isPadelRacket, RACKET_KIND } from "./filter";
import { buildGtinIndex, matchItem } from "./match";
import type {
  AffiliateNetwork,
  CatalogProduct,
  FeedItemKind,
  MatchResult,
  NormalizedFeedItem,
} from "./types";

/**
 * 'all': every row (padel-only shop). 'padel_rackets': padel rackets only.
 * 'padel_rackets_bags': padel rackets and bags, each matched within its own kind (RP-91).
 */
export type FeedFilter = "all" | "padel_rackets" | "padel_rackets_bags";

/** kind: what the item is, when the filter decided it; null for filter 'all'. */
export type PreparedItem = NormalizedFeedItem & { match: MatchResult; kind?: FeedItemKind | null };

export type PipelineStats = {
  rows: number;
  invalid: number;
  filteredOut: number;
  duplicates: number;
  kept: number;
  matchedByGtin: number;
  matchedByName: number;
  pendingWithSuggestion: number;
  pendingWithoutSuggestion: number;
};

/**
 * Pure part of an import: bytes → parsed rows → normalized items → filtered → matched.
 * No network or database access, so it is fully unit-testable and usable for dry runs.
 */
export function prepareFeed(
  bytes: Uint8Array,
  network: AffiliateNetwork,
  filter: FeedFilter,
  catalog: CatalogProduct[],
): { items: PreparedItem[]; stats: PipelineStats } {
  const adapter = getAdapter(network);
  const rows = parseCsv(decodeFeed(bytes));
  const gtinIndex = buildGtinIndex(catalog);
  const seen = new Set<string>();
  const items: PreparedItem[] = [];
  const stats: PipelineStats = {
    rows: rows.length,
    invalid: 0,
    filteredOut: 0,
    duplicates: 0,
    kept: 0,
    matchedByGtin: 0,
    matchedByName: 0,
    pendingWithSuggestion: 0,
    pendingWithoutSuggestion: 0,
  };

  for (const row of rows) {
    const item = adapter.toItem(row);
    if (!item) {
      stats.invalid++;
      continue;
    }
    let kind: FeedItemKind | null = null;
    if (filter === "padel_rackets") {
      if (!isPadelRacket(item)) {
        stats.filteredOut++;
        continue;
      }
      kind = RACKET_KIND;
    } else if (filter === "padel_rackets_bags") {
      kind = classifyItem(item);
      if (!kind) {
        stats.filteredOut++;
        continue;
      }
    }
    if (seen.has(item.externalId)) {
      stats.duplicates++;
      continue;
    }
    seen.add(item.externalId);

    const match = matchItem(item, catalog, gtinIndex, kind);
    if (match.status === "matched") {
      if (match.method === "gtin") stats.matchedByGtin++;
      else stats.matchedByName++;
    } else if (match.suggestedProductId) {
      stats.pendingWithSuggestion++;
    } else {
      stats.pendingWithoutSuggestion++;
    }
    items.push({ ...item, match, kind });
  }

  stats.kept = items.length;
  return { items, stats };
}

/** Shape expected by the ingest_feed_items() database function. */
export function toIngestRow(item: PreparedItem) {
  const { match } = item;
  return {
    external_id: item.externalId,
    title: item.title,
    brand: item.brand,
    gtin: item.gtin,
    category: item.category,
    price: item.price,
    shipping_cost: item.shippingCost,
    stock_status: item.stockStatus,
    delivery_days_min: item.deliveryDaysMin,
    delivery_days_max: item.deliveryDaysMax,
    product_url: item.productUrl,
    affiliate_url: item.affiliateUrl,
    image_url: item.imageUrl,
    match_status: match.status,
    match_method: match.status === "matched" ? match.method : null,
    matched_product_id: match.status === "matched" ? match.productId : null,
    suggested_product_id: match.status === "pending" ? match.suggestedProductId : null,
    match_score: match.score,
  };
}

/**
 * Guards against a broken or truncated feed wiping a shop's offers:
 * refuse when the feed shrinks to less than half of what was active before.
 */
export function looksTruncated(previousActive: number, incoming: number): boolean {
  return previousActive >= 20 && incoming < previousActive * 0.5;
}
