/**
 * Cache tags for catalog data. Catalog queries tag their cached results with these
 * (`cacheTag(CATALOG_TAG)` inside a 'use cache' function); the daily import revalidates
 * them so pages pick up new prices without a redeploy.
 */
export const CATALOG_TAG = "catalog";

export const productTag = (productId: string) => `product:${productId}`;

/** Blog articles (RP-51). Cached for hours, so a new article appears without a deploy. */
export const BLOG_TAG = "blog";
