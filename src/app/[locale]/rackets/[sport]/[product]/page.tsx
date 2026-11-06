import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/product/product-view";
import { getAlternates } from "@/i18n/alternates";
import { routing, type Locale } from "@/i18n/routing";
import { getPriceHistory, getProductPage, getProductPriceSummary } from "@/lib/catalog/product";
import { sportSlug } from "@/lib/catalog/taxonomy";

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
  if (!product || !summary || product.category !== "rackets") notFound();

  const [tr, ts, tc] = await Promise.all([
    getTranslations({ locale, namespace: "rackets" }),
    getTranslations({ locale, namespace: "sports" }),
    getTranslations({ locale, namespace: "categories" }),
  ]);
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

  return (
    <ProductView
      locale={locale}
      product={product}
      summary={summary}
      history={history}
      crumbs={[
        { label: tc("rackets"), href: "/rackets" },
        {
          label: ts(product.sport),
          href: {
            pathname: "/rackets/[sport]",
            params: { sport: sportSlug(product.sport, locale) },
          },
        },
      ]}
      eyebrow={`${product.brand.name} · ${ts(product.sport)}`}
      tags={tags}
    />
  );
}
