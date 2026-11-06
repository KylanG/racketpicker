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
  // As for rackets: one placeholder at build time; real pages render on first visit and
  // unknown products get a 404 from the proxy.
  return routing.locales.map((locale) => ({ sport: sportSlug("padel", locale), product: "_" }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/accessories/[sport]/[product]">): Promise<Metadata> {
  const { locale, product: slug } = (await params) as Params;
  const product = await getProductPage(locale, slug);
  if (!product || product.category !== "accessories") return { robots: { index: false } };
  const [t, tf] = await Promise.all([
    getTranslations({ locale, namespace: "product" }),
    getTranslations({ locale, namespace: "rackets.filters" }),
  ]);
  const name = product.kind
    ? `${product.title} ${tf(`kindSingular.${product.kind}`).toLowerCase()}`
    : product.title;
  const shops = new Set(product.offers.map((o) => o.shop.slug)).size;
  return {
    // A hand-written SEO title is complete (it already names Racketpicker).
    title: product.seoTitle ? { absolute: product.seoTitle } : t("metaTitle", { name }),
    description:
      product.seoDescription ??
      (shops > 0
        ? t("metaDescriptionAccessory", { name, count: shops })
        : t("metaDescriptionNoShops", { name })),
    alternates: getAlternates(
      (l) => ({
        pathname: "/accessories/[sport]/[product]",
        params: { sport: sportSlug(product.sport, l), product: product.slug },
      }),
      locale,
    ),
    ...(product.tier === "C" ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Accessory page (RP-78): the racket page layout without racket specs. */
export default async function AccessoryPage({
  params,
}: PageProps<"/[locale]/accessories/[sport]/[product]">) {
  const { locale, product: slug } = (await params) as Params;
  setRequestLocale(locale);
  const [product, summary, history] = await Promise.all([
    getProductPage(locale, slug),
    getProductPriceSummary(locale, slug),
    getPriceHistory(locale, slug),
  ]);
  if (!product || !summary || product.category !== "accessories") notFound();

  const [tf, ts, ta] = await Promise.all([
    getTranslations({ locale, namespace: "rackets.filters" }),
    getTranslations({ locale, namespace: "sports" }),
    getTranslations({ locale, namespace: "accessories" }),
  ]);
  const kind = product.kind ? tf(`kind.${product.kind}`) : null;
  const overview = (soort?: string) => ({
    pathname: "/accessories/[sport]" as const,
    params: { sport: sportSlug(product.sport, locale) },
    ...(soort ? { query: { soort } } : {}),
  });

  return (
    <ProductView
      locale={locale}
      product={product}
      summary={summary}
      history={history}
      crumbs={[
        { label: ta("title"), href: overview() },
        ...(kind && product.kind ? [{ label: kind, href: overview(product.kind) }] : []),
      ]}
      eyebrow={[product.brand.name, ts(product.sport), kind].filter(Boolean).join(" · ")}
      tags={product.kind ? [tf(`kindSingular.${product.kind}`)] : []}
    />
  );
}
