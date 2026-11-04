import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RacketsOverview } from "@/components/rackets/rackets-overview";
import type { Locale } from "@/i18n/routing";
import { listingSeo } from "@/lib/catalog/listing-metadata";

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[locale]/rackets">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getTranslations({ locale, namespace: "rackets" });
  return { title: t("allTitle"), ...listingSeo(locale, null, await searchParams) };
}

/** All rackets across sports, with the same filters as a sport page. */
export default async function RacketsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/rackets">) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  return <RacketsOverview locale={locale} sport={null} searchParams={searchParams} />;
}
