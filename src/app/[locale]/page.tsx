import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { use } from "react";
import { Slant } from "@/components/ui/slant";
import { getAlternates } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { sportSlug } from "@/lib/catalog/taxonomy";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: getAlternates("/", locale as Locale) };
}

// Placeholder until the homepage is built (RP-29/30); uses the final brand tokens.
export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  const t = useTranslations("home");

  return (
    <main className="rp-hero rp-on-dark flex flex-1 items-center justify-center p-8 text-white">
      <div className="text-center">
        <Image
          src="/logo.svg"
          alt="Racketpicker"
          width={95}
          height={40}
          priority
          className="rp-logo mx-auto mb-8 h-10 w-auto"
        />
        <p className="rp-eyebrow">{t("eyebrow")}</p>
        <h1 className="rp-h1-home mt-3">{t("title")}</h1>
        <p className="text-on-dark mt-4 text-[17px]">{t("intro")}</p>
        <Slant
          as={Link}
          href={{
            pathname: "/rackets/[sport]",
            params: { sport: sportSlug("padel", locale as Locale) },
          }}
          size={8}
          className="bg-lime hover:bg-lime-hover mt-8 inline-flex min-h-11 items-center gap-2 px-6 py-3 font-semibold text-green-950 transition-colors"
        >
          {t("cta")}
          <svg data-arrow width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M3 11 11 3M5 3h6v6" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </Slant>
      </div>
    </main>
  );
}
