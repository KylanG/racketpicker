import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InfoPage } from "@/components/info/info-page";
import { getAlternates } from "@/i18n/alternates";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/faq">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getTranslations({ locale, namespace: "info.pages.faq" });
  return {
    title: t("title"),
    description: t("intro"),
    alternates: getAlternates("/faq", locale),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/faq">) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  return <InfoPage page="faq" />;
}
