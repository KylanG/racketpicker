import { useFormatter, useTranslations } from "next-intl";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { getAlternates } from "@/i18n/alternates";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/padel-rackets">): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: getAlternates("/padel-rackets", locale as Locale) };
}

// Placeholder for the search page (RP-26/27). Proves localized slugs and Intl formatting.
export default function PadelRacketsPage({ params }: PageProps<"/[locale]/padel-rackets">) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  const t = useTranslations("padelRackets");
  const format = useFormatter();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-8">
      <h1 className="text-3xl font-black italic">{t("title")}</h1>
      <p className="text-muted mt-3">{t("intro")}</p>
      <p className="mt-6">{t("examplePrice", { price: format.number(96.74, "price") })}</p>
      <p className="text-muted text-sm">
        {t("updated", { date: format.dateTime(new Date("2026-11-04T12:00:00Z"), "short") })}
      </p>
    </main>
  );
}
