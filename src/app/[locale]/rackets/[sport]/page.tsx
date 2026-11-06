import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { RacketsOverview } from "@/components/rackets/rackets-overview";
import { routing, type Locale } from "@/i18n/routing";
import { listingBrand, listingSeo } from "@/lib/catalog/listing-metadata";
import { SPORTS, sportFromSlug, sportSlug } from "@/lib/catalog/taxonomy";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    SPORTS.map(({ key }) => ({ locale, sport: sportSlug(key, locale) })),
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[locale]/rackets/[sport]">): Promise<Metadata> {
  const { locale, sport: slug } = (await params) as { locale: Locale; sport: string };
  const sport = sportFromSlug(slug, locale);
  if (!sport) return {};
  const query = await searchParams;
  const [t, brand] = await Promise.all([
    getTranslations({ locale, namespace: "rackets" }),
    listingBrand(locale, "rackets", query),
  ]);
  const name = t(`sportNoun.${sport}`);
  return brand
    ? {
        title: t("brandPageTitle", { brand, name }),
        description: t("brandMetaDescription", { brand, name }),
        ...listingSeo(locale, sport, query),
      }
    : {
        title: t("pageTitle", { name: t(`sportTitle.${sport}`) }),
        description: t("metaDescription", { name }),
        ...listingSeo(locale, sport, query),
      };
}

/** Overview per sport, e.g. /nl/rackets/padel?merk=adidas. Unknown sports 404 in the proxy. */
export default async function SportRacketsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/rackets/[sport]">) {
  const { locale, sport: slug } = (await params) as { locale: Locale; sport: string };
  setRequestLocale(locale);
  const sport = sportFromSlug(slug, locale);
  if (!sport) notFound();
  return <RacketsOverview locale={locale} sport={sport} searchParams={searchParams} />;
}
