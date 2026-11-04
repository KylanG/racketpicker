import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { use } from "react";
import { getAlternates } from "@/i18n/alternates";
import { routing, type Locale } from "@/i18n/routing";
import { SPORTS, sportFromSlug, sportSlug } from "@/lib/catalog/taxonomy";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    SPORTS.map(({ key }) => ({ locale, sport: sportSlug(key, locale) })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/rackets/[sport]">): Promise<Metadata> {
  const { locale, sport: slug } = await params;
  const sport = sportFromSlug(slug, locale as Locale);
  if (!sport) return {};
  const t = await getTranslations({ locale: locale as Locale, namespace: "rackets" });
  return {
    title: t(`sportTitle.${sport}`),
    // Sport slugs differ per market (tafeltennis / tenis-de-mesa).
    alternates: getAlternates(
      (l) => ({ pathname: "/rackets/[sport]", params: { sport: sportSlug(sport, l) } }),
      locale as Locale,
    ),
  };
}

// Placeholder until the overview with filters is built (RP-26/27).
export default function SportRacketsPage({ params }: PageProps<"/[locale]/rackets/[sport]">) {
  const { locale, sport: slug } = use(params);
  setRequestLocale(locale as Locale);
  const sport = sportFromSlug(slug, locale as Locale);
  if (!sport) notFound();
  const t = useTranslations("rackets");

  return (
    <main className="rp-container flex-1 py-16">
      <h1 className="rp-h1">{t(`sportTitle.${sport}`)}</h1>
      <p className="text-muted mt-3">{t("sportIntro")}</p>
    </main>
  );
}
