import {
  cleanText,
  isHttpUrl,
  normalizeGtin,
  parseDeliveryDays,
  parsePrice,
  parseStock,
  pick,
} from "./normalize";
import type { AffiliateNetwork, FeedAdapter, NormalizedFeedItem, RawRow } from "./types";

/**
 * Column names per network, in order of preference. Feeds differ per advertiser,
 * so several aliases are tried. Verify against the first real feed and extend if needed.
 */
type ColumnMap = Record<
  | "id"
  | "title"
  | "brand"
  | "gtin"
  | "category"
  | "price"
  | "shipping"
  | "stock"
  | "stockQty"
  | "delivery"
  | "productUrl"
  | "affiliateUrl"
  | "image",
  readonly string[]
>;

/** Awin "Create-a-Feed" standard columns. */
export const AWIN_COLUMNS: ColumnMap = {
  id: ["aw_product_id", "merchant_product_id"],
  title: ["product_name"],
  brand: ["brand_name", "brand"],
  gtin: ["ean", "product_GTIN", "upc", "mpn_ean"],
  category: ["merchant_category", "category_name", "merchant_product_category_path"],
  price: ["search_price", "store_price", "display_price"],
  shipping: ["delivery_cost"],
  stock: ["in_stock", "is_for_sale"],
  stockQty: ["stock_quantity"],
  delivery: ["delivery_time"],
  productUrl: ["merchant_deep_link"],
  affiliateUrl: ["aw_deep_link"],
  image: ["merchant_image_url", "aw_image_url", "large_image"],
};

/** Daisycon product feed (standard fields). */
export const DAISYCON_COLUMNS: ColumnMap = {
  id: ["daisycon_unique_id", "sku", "product_id", "id"],
  title: ["title", "name", "product_name"],
  brand: ["brand", "brand_name"],
  gtin: ["ean", "gtin", "ean13"],
  category: ["category_path", "category", "sub_category"],
  price: ["price", "minimum_price"],
  shipping: ["price_shipping", "shipping_cost", "delivery_costs"],
  stock: ["in_stock", "stock", "availability"],
  stockQty: ["in_stock_amount", "stock_amount"],
  delivery: ["delivery_time", "delivery_description"],
  productUrl: ["product_url", "url"],
  affiliateUrl: ["link", "tracking_url", "deeplink"],
  image: ["image_large", "image_default", "image", "image_url"],
};

function createAdapter(network: AffiliateNetwork, columns: ColumnMap): FeedAdapter {
  return {
    network,
    toItem(row: RawRow): NormalizedFeedItem | null {
      const externalId = pick(row, columns.id);
      const title = cleanText(pick(row, columns.title));
      const price = parsePrice(pick(row, columns.price));
      const affiliateUrl = pick(row, columns.affiliateUrl);
      if (!externalId || !title || price === null || !isHttpUrl(affiliateUrl)) return null;

      const productUrl = pick(row, columns.productUrl);
      const image = pick(row, columns.image);
      const [deliveryDaysMin, deliveryDaysMax] = parseDeliveryDays(pick(row, columns.delivery));

      return {
        externalId,
        title,
        brand: cleanText(pick(row, columns.brand)),
        gtin: normalizeGtin(pick(row, columns.gtin)),
        category: cleanText(pick(row, columns.category)),
        price,
        shippingCost: parsePrice(pick(row, columns.shipping)),
        stockStatus: parseStock(pick(row, columns.stock), pick(row, columns.stockQty)),
        deliveryDaysMin,
        deliveryDaysMax,
        productUrl: isHttpUrl(productUrl) ? productUrl : null,
        affiliateUrl,
        imageUrl: isHttpUrl(image) ? image : null,
      };
    },
  };
}

export const awinAdapter = createAdapter("awin", AWIN_COLUMNS);
export const daisyconAdapter = createAdapter("daisycon", DAISYCON_COLUMNS);

export function getAdapter(network: AffiliateNetwork): FeedAdapter {
  switch (network) {
    case "awin":
      return awinAdapter;
    case "daisycon":
      return daisyconAdapter;
    default:
      throw new Error(`No feed adapter for network "${network}"`);
  }
}
