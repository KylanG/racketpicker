"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { Slant } from "@/components/ui/slant";
import type { Locale } from "@/i18n/routing";
import type { ProductOffer } from "@/lib/catalog/product";
import { shopRows } from "@/lib/catalog/shop-prices";
import { formatPrice } from "@/lib/format/price";
import { goHref } from "@/lib/go/redirect";

/** "Prijzen bij X winkels" with the shipping toggle (Product.dc.html #prijzen; RP-24). */
export function ShopPrices({ offers }: { offers: ProductOffer[] }) {
  const t = useTranslations("product.shops");
  const tp = useTranslations("product");
  const locale = useLocale() as Locale;
  const [withShipping, setWithShipping] = useState(true);
  const rows = shopRows(offers, withShipping);
  const price = (n: number) => formatPrice(n, locale);

  const delivery = (o: ProductOffer) => {
    const { deliveryDaysMin: min, deliveryDaysMax: max } = o;
    if (min != null && max != null && max > min) return tp("deliveryRange", { min, max });
    if (min != null || max != null) return tp("delivery", { min: (min ?? max)! });
    return t("unknown");
  };

  const available = rows.filter((r) => r.available);
  const spread =
    available.length > 1
      ? Math.round((available.at(-1)!.total - available[0].total) * 100) / 100
      : 0;
  const shopCount = new Set(offers.map((o) => o.shop.slug)).size;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Reveal>
            <h2 className="text-[clamp(26px,2.4vw,34px)] font-semibold tracking-[-0.3px]">
              {t("title", { count: shopCount })}
            </h2>
          </Reveal>
          {spread > 0 && (
            <p className="text-muted text-[15px]">
              {t.rich("spread", {
                amount: price(spread),
                strong: (chunks) => <strong className="text-green-800">{chunks}</strong>,
              })}
            </p>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={withShipping}
          onClick={() => setWithShipping(!withShipping)}
          className="text-ink flex min-h-11 cursor-pointer items-center gap-2.5 text-[14px] font-medium"
        >
          <span
            aria-hidden="true"
            className={`flex h-5 w-9 p-0.5 transition-colors duration-200 ${
              withShipping ? "justify-end bg-green-950" : "justify-start bg-[#C9D6C4]"
            }`}
          >
            <span className="block size-4 bg-white" />
          </span>
          {t("withShipping")}
        </button>
      </div>

      <Reveal stagger className="border-border flex flex-col border-t" role="list">
        {rows.map((r, i) => (
          <div
            key={r.offer.id}
            role="listitem"
            className={`border-border grid grid-cols-[repeat(auto-fit,minmax(min(100%,130px),1fr))] items-center gap-x-4 gap-y-3 border-b p-4 ${
              i === 0 && r.available ? "bg-[#F8FBF0]" : ""
            }`}
          >
            <div className="flex flex-col gap-[3px]">
              <span className="text-[16px] font-semibold">{r.offer.shop.name}</span>
              {r.isBest && (
                <span className="text-[13px] font-semibold text-green-800">{t("best")}</span>
              )}
              {r.diff != null && (
                <span className="text-muted-2 text-[13px]">
                  {r.diff > 0 ? t("dearer", { amount: price(r.diff) }) : t("samePrice")}
                </span>
              )}
              {!r.available && (
                <span className="text-[13px] font-semibold text-[#8A4B1F]">{t("outOfStock")}</span>
              )}
            </div>
            <div className={`flex flex-col gap-0.5 ${r.available ? "" : "opacity-50"}`}>
              <span className="text-muted-2 text-[13px]">
                {!r.available
                  ? t("lastPrice")
                  : withShipping && r.shipping != null
                    ? t("priceInclShipping")
                    : t("price")}
              </span>
              <span className="text-[16px] font-semibold">{price(r.total)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-2 text-[13px]">{t("shipping")}</span>
              <span className="text-[15px]">
                {r.shipping === 0
                  ? t("free")
                  : r.shipping != null
                    ? price(r.shipping)
                    : r.offer.shop.freeShippingFrom != null
                      ? t("freeFrom", { amount: price(r.offer.shop.freeShippingFrom) })
                      : t("unknown")}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-2 text-[13px]">{t("delivery")}</span>
              <span className="text-[15px]">{r.available ? delivery(r.offer) : "–"}</span>
            </div>
            {r.available ? (
              <Slant
                as="a"
                href={goHref(r.offer.shop.slug, r.offer.id)}
                rel="sponsored nofollow"
                aria-label={tp("cta", { shop: r.offer.shop.name })}
                className={`flex items-center justify-center gap-2.5 px-[18px] py-3 text-[14px] font-semibold whitespace-nowrap hover:opacity-[.88] ${
                  i === 0
                    ? "bg-lime text-green-950 hover:text-green-950"
                    : "bg-green-950 text-white hover:text-white"
                }`}
              >
                {t("cta")}
                <svg data-arrow="" width="11" height="11" viewBox="0 0 14 14" aria-hidden="true">
                  <path
                    d="M4 10L10 4M5 4h5v5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
              </Slant>
            ) : (
              <Slant
                as="span"
                className="text-muted-2 bg-[#EEF1EC] px-[18px] py-3 text-center text-[14px] font-semibold whitespace-nowrap"
              >
                {t("soldOut")}
              </Slant>
            )}
          </div>
        ))}
      </Reveal>
    </>
  );
}
