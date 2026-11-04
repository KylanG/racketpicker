import { useTranslations } from "next-intl";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import { getAlternates } from "@/i18n/alternates";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: getAlternates("/", locale as Locale) };
}

export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  const t = useTranslations("home");

  return (
    <main className="bg-ink text-paper flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <p className="text-lime text-sm tracking-widest uppercase">{t("eyebrow")}</p>
        <h1 className="mt-2 text-4xl font-black italic">{t("title")}</h1>
        <p className="text-paper/70 mt-3">{t("intro")}</p>
        <Link
          href="/padel-rackets"
          className="bg-lime text-ink hover:bg-lime-hover focus-visible:outline-lime mt-6 inline-block rounded-full px-5 py-2 font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {t("cta")}
        </Link>
      </div>
    </main>
  );
}
