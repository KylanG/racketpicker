import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { getAlternates } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { SPORTS, sportSlug } from "@/lib/catalog/taxonomy";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/rackets">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "rackets" });
  return { title: t("title"), alternates: getAlternates("/rackets", locale as Locale) };
}

// Placeholder index until the overview is built (RP-26/27).
export default function RacketsPage({ params }: PageProps<"/[locale]/rackets">) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  const t = useTranslations("rackets");

  return (
    <main className="rp-container flex-1 py-16">
      <h1 className="rp-h1">{t("title")}</h1>
      <p className="text-muted mt-3">{t("intro")}</p>
      <ul className="mt-8 flex flex-wrap gap-3">
        {SPORTS.map(({ key }) => (
          <li key={key}>
            <Link
              href={{
                pathname: "/rackets/[sport]",
                params: { sport: sportSlug(key, locale as Locale) },
              }}
              className="rp-underline font-medium"
            >
              {t(`sportTitle.${key}`)}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
