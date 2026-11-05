import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { ProductGallery } from "@/components/product/gallery";
import { PriceHistory } from "@/components/product/price-history";
import { AlertForm, ProductFavToggle } from "@/components/product/product-actions";
import { ShopPrices } from "@/components/product/shop-prices";
import { CheckIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { getAlternates } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import { intlLocale, routing, type Locale } from "@/i18n/routing";
import { goHref } from "@/lib/go/redirect";
import { getPriceHistory, getProductPage, getProductPriceSummary } from "@/lib/catalog/product";
import { sportSlug } from "@/lib/catalog/taxonomy";
import { formatPrice } from "@/lib/format/price";

type Params = { locale: Locale; sport: string; product: string };

export function generateStaticParams() {
  // Cache Components needs one param at build time; real pages render on first visit.
  // "_" never matches a product (the proxy answers unknown products with a 404).
  return routing.locales.map((locale) => ({
    sport: sportSlug("padel", locale),
    product: "_",
  }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/rackets/[sport]/[product]">): Promise<Metadata> {
  const { locale, product: slug } = (await params) as Params;
  const product = await getProductPage(locale, slug);
  if (!product) return { robots: { index: false } };
  const t = await getTranslations({ locale, namespace: "product" });
  const shops = new Set(product.offers.map((o) => o.shop.slug)).size;
  return {
    title: product.seoTitle ?? t("metaTitle", { name: product.title }),
    description:
      product.seoDescription ??
      (shops > 0
        ? t("metaDescription", { name: product.title, count: shops })
        : t("metaDescriptionNoShops", { name: product.title })),
    alternates: getAlternates(
      (l) => ({
        pathname: "/rackets/[sport]/[product]",
        params: { sport: sportSlug(product.sport, l), product: product.slug },
      }),
      locale,
    ),
    // Tier C pages are thin until the editorial content is there.
    ...(product.tier === "C" ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Racket page (design/handoff/Product.dc.html): top part (RP-23), prices and history (RP-24). */
export default async function RacketPage({
  params,
}: PageProps<"/[locale]/rackets/[sport]/[product]">) {
  const { locale, product: slug } = (await params) as Params;
  setRequestLocale(locale);
  const [product, summary, history] = await Promise.all([
    getProductPage(locale, slug),
    getProductPriceSummary(locale, slug),
    getPriceHistory(locale, slug),
  ]);
  if (!product || !summary) notFound();

  const [t, tr, ts, ta] = await Promise.all([
    getTranslations({ locale, namespace: "product" }),
    getTranslations({ locale, namespace: "rackets" }),
    getTranslations({ locale, namespace: "sports" }),
    getTranslations({ locale, namespace: "affiliate" }),
  ]);
  const { best, state } = summary;
  const price = (n: number) => formatPrice(n, locale);
  const sportHref = {
    pathname: "/rackets/[sport]" as const,
    params: { sport: sportSlug(product.sport, locale) },
  };

  const [firstLevel] = product.levels;
  const lastLevel = product.levels.at(-1);
  const tags = [
    firstLevel &&
      (firstLevel === lastLevel
        ? tr(`filters.level.${firstLevel}`)
        : `${tr(`filters.level.${firstLevel}`)}–${tr(`filters.level.${lastLevel!}`)}`),
    product.style && tr(`filters.style.${product.style}`),
    product.weight && tr(`filters.weightTag.${product.weight}`),
  ].filter((x): x is string => Boolean(x));

  const available = state === "normal" || state === "single";
  let delivery: string | null = null;
  let shipping: string | null = null;
  if (best && available) {
    const { deliveryDaysMin: min, deliveryDaysMax: max } = best;
    if (min != null && max != null && max > min) delivery = t("deliveryRange", { min, max });
    else if (min != null || max != null) delivery = t("delivery", { min: (min ?? max)! });

    const free = best.shop.freeShippingFrom;
    if (
      best.shippingCost === 0 ||
      (best.shippingCost == null && free != null && best.price >= free)
    )
      shipping = t("freeShipping");
    else if (best.shippingCost != null)
      shipping = t("shippingCost", { amount: price(best.shippingCost) });
    else if (free != null) shipping = t("freeShippingFrom", { amount: price(free) });
  }
  const checkedOn =
    best?.checkedOn &&
    new Intl.DateTimeFormat(intlLocale[locale], { day: "numeric", month: "long" }).format(
      new Date(`${best.checkedOn}T12:00:00`),
    );
  const stockAlert = !available;
  const target = best ? Math.max(1, Math.floor(best.price * 0.9)) : null;

  return (
    <>
      <div className="rp-hero-sub text-white">
        <Header />
      </div>

      <section className="rp-container flex w-full flex-col gap-7 pt-7 pb-16">
        <nav aria-label={t("breadcrumb")}>
          <ol className="text-muted flex flex-wrap gap-2 text-[13px]">
            <li className="flex gap-2">
              <Link href="/" className="text-muted hover:text-green-800">
                {t("home")}
              </Link>
              <span aria-hidden="true">/</span>
            </li>
            <li className="flex gap-2">
              <Link href="/rackets" className="text-muted hover:text-green-800">
                {t("rackets")}
              </Link>
              <span aria-hidden="true">/</span>
            </li>
            <li className="flex gap-2">
              <Link href={sportHref} className="text-muted hover:text-green-800">
                {ts(product.sport)}
              </Link>
              <span aria-hidden="true">/</span>
            </li>
            <li aria-current="page" className="text-ink">
              {product.model}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-start gap-[clamp(32px,4vw,64px)]">
          <Reveal>
            <ProductGallery
              images={product.images}
              noImage={t("noImage")}
              photoLabel={product.images.map((_, i) => t("photo", { n: i + 1 }))}
              badge={summary.discount ? `-${summary.discount}%` : null}
            />
          </Reveal>

          <Reveal className="flex flex-col gap-[22px]">
            <div className="flex flex-col gap-2.5">
              <p className="text-[13px] font-semibold tracking-[1.2px] text-green-800 uppercase">
                {product.brand.name} · {ts(product.sport)}
              </p>
              <h1 className="text-[clamp(30px,3vw,42px)] leading-[1.08] font-semibold tracking-[-0.4px] text-balance">
                <span className="sr-only">{product.brand.name} </span>
                {product.model}
              </h1>
              {tags.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <li key={tag} className="bg-surface px-2.5 py-[5px] text-[13px]">
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-border flex flex-col gap-[18px] border p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  {best && available && (
                    <>
                      <p className="text-muted text-[14px]">
                        {t("priceLead")} <strong className="text-ink">{best.shop.name}</strong>
                      </p>
                      <p className="flex flex-wrap items-baseline gap-x-3">
                        <span className="text-[40px] leading-none font-bold tracking-[-0.5px]">
                          {price(best.price)}
                        </span>
                        {summary.compareAt != null && (
                          <s className="text-muted-2 text-[17px]">
                            <span className="sr-only">{t("wasPrice")}: </span>
                            {price(summary.compareAt)}
                          </s>
                        )}
                      </p>
                      {product.stats?.msrp != null && product.stats.msrp > best.price && (
                        <p className="text-muted-2 text-[13px]">
                          {t("msrp", { price: price(product.stats.msrp) })}
                        </p>
                      )}
                    </>
                  )}
                  {state === "soldOut" && best && (
                    <>
                      <p className="text-muted text-[14px]">
                        {t("lastSeen", { price: price(best.price), shop: best.shop.name })}
                      </p>
                      <p className="text-[32px] leading-tight font-bold tracking-[-0.4px]">
                        {t("soldOutTitle")}
                      </p>
                    </>
                  )}
                  {state === "noPrice" && (
                    <>
                      <p className="text-[32px] leading-tight font-bold tracking-[-0.4px]">
                        {t("noPriceTitle")}
                      </p>
                      <p className="text-muted max-w-[420px] text-[14px] leading-normal">
                        {t("noPriceText")}
                      </p>
                    </>
                  )}
                </div>
                {summary.lowestIn90Days && (
                  <span
                    className="bg-lime px-3 py-[7px] text-[13px] font-semibold text-green-950"
                    style={{ clipPath: "polygon(5px 0,100% 0,calc(100% - 5px) 100%,0 100%)" }}
                  >
                    {t("lowest90")}
                  </span>
                )}
                {state === "soldOut" && (
                  <span
                    className="bg-surface text-ink px-3 py-[7px] text-[13px] font-semibold"
                    style={{ clipPath: "polygon(5px 0,100% 0,calc(100% - 5px) 100%,0 100%)" }}
                  >
                    {t("notInStock")}
                  </span>
                )}
              </div>

              {available && (summary.saveMsrp != null || summary.saveShops != null) && (
                <div className="bg-surface flex items-center gap-3.5 px-4 py-3.5">
                  <span className="bg-lime grid size-9 shrink-0 place-items-center rounded-full">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="#033A19"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path d="M2 11l4-4 3 3 5-5M10 5h4v4" />
                    </svg>
                  </span>
                  <div className="flex flex-col gap-0.5 text-[14px] leading-[1.4]">
                    {summary.saveMsrp != null ? (
                      <>
                        <p className="text-[16px] font-semibold">
                          {t("saveMsrp", { amount: price(summary.saveMsrp) })}
                        </p>
                        {summary.saveShops != null && (
                          <p className="text-muted">
                            {t("saveShops", { amount: price(summary.saveShops) })}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-[16px] font-semibold">
                        {t("saveShopsOnly", { amount: price(summary.saveShops!) })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {state === "single" && best && (
                <p className="bg-surface text-muted px-4 py-3.5 text-[14px] leading-[1.45]">
                  {t.rich("singleShop", {
                    shop: best.shop.name,
                  })}
                </p>
              )}

              {(delivery ||
                shipping ||
                best?.stock === "preorder" ||
                best?.stock === "low_stock") &&
                available && (
                  <ul className="text-muted flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
                    {delivery && (
                      <li className="flex items-center gap-2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="#05561F"
                          strokeWidth="1.5"
                          aria-hidden="true"
                        >
                          <path d="M1 4h9v7H1zM10 6h3l2 2.5V11h-5" />
                          <circle cx="4" cy="12" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                        </svg>
                        {t("deliveryLabel", { value: delivery })}
                      </li>
                    )}
                    {shipping && (
                      <li className="flex items-center gap-2">
                        <CheckIcon size={14} className="text-green-800" />
                        {shipping}
                      </li>
                    )}
                    {best?.stock === "preorder" && <li>{t("preorder")}</li>}
                    {best?.stock === "low_stock" && <li>{t("lowStock")}</li>}
                  </ul>
                )}

              <div className="flex flex-wrap gap-2.5">
                {best && available ? (
                  <a
                    href={goHref(best.shop.slug, best.id)}
                    rel="sponsored nofollow"
                    className="bg-lime hover:bg-lime-hover ease-rp flex min-w-[200px] flex-1 items-center justify-between px-[22px] py-[17px] text-[16px] font-semibold text-green-950 transition-colors duration-300 hover:text-green-950"
                    style={{ clipPath: "polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)" }}
                  >
                    <span>{t("cta", { shop: best.shop.name })}</span>
                    <svg
                      data-arrow=""
                      width="13"
                      height="13"
                      viewBox="0 0 14 14"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 10L10 4M5 4h5v5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </a>
                ) : (
                  <a
                    href="#alert"
                    className="bg-lime hover:bg-lime-hover ease-rp flex min-w-[200px] flex-1 items-center justify-between px-[22px] py-[17px] text-[16px] font-semibold text-green-950 transition-colors duration-300 hover:text-green-950"
                    style={{ clipPath: "polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)" }}
                  >
                    <span>{t("ctaStock")}</span>
                  </a>
                )}
                <ProductFavToggle label={t("save", { name: product.title })} />
              </div>

              {summary.shopCount > 1 && (
                <a
                  href="#prijzen"
                  className="rp-underline text-ink self-start text-[14px] font-semibold"
                >
                  {t("allShops", { count: summary.shopCount })}
                </a>
              )}

              {best && available && (
                <div className="text-muted-2 flex flex-col gap-1 text-[13px] leading-normal">
                  {checkedOn && <p>{t("checked", { date: checkedOn })}</p>}
                  <p>{ta("disclosure")}</p>
                </div>
              )}
            </div>

            <div
              id="alert"
              className="bg-surface flex scroll-mt-[calc(var(--rp-hdr,0px)+24px)] flex-col gap-3.5 px-6 py-5"
            >
              <div className="flex flex-col gap-0.5">
                <h2 className="text-[16px] font-semibold">
                  {stockAlert ? t("stockAlertTitle") : t("alertTitle")}
                </h2>
                <p className="text-muted text-[14px]">
                  {stockAlert ? t("stockAlertDesc") : t("alertDesc")}
                </p>
              </div>
              <AlertForm
                defaultTarget={stockAlert ? null : target}
                stock={stockAlert}
                labels={{
                  target: t("target"),
                  email: t("email"),
                  placeholder: t("emailPlaceholder"),
                  submit: t("alertSubmit"),
                  soon: t("alertSoon"),
                }}
                consent={t.rich("alertConsent", {
                  link: (chunks) => (
                    <Link href="/privacy" className="text-ink underline">
                      {chunks}
                    </Link>
                  ),
                })}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {product.offers.length > 0 && (
        <section
          id="prijzen"
          className="rp-container flex w-full scroll-mt-[calc(var(--rp-hdr,0px)+56px)] flex-col gap-6 pt-[72px] pb-10"
        >
          <ShopPrices offers={product.offers} />
          <p className="text-muted-2 text-[13px]">
            {t("shops.updated")} {ta("disclosure")}
          </p>
        </section>
      )}

      {history && (
        <section
          id="historie"
          className="rp-container flex w-full scroll-mt-[calc(var(--rp-hdr,0px)+56px)] flex-col gap-6 py-14"
        >
          <PriceHistory
            points={history.points}
            today={history.today}
            trackedDays={history.trackedDays}
          />
        </section>
      )}
    </>
  );
}
