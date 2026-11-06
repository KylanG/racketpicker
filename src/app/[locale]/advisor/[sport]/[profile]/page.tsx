import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdvisorInfo } from "@/components/advisor/advisor-info";
import { AdvisorResult } from "@/components/advisor/advisor-result";
import { Header } from "@/components/layout/header";
import { Reveal } from "@/components/ui/reveal";
import { getAlternates } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { ADVISOR_LEVELS, ADVISOR_STYLES, parseProfile, profileSlug } from "@/lib/advisor/questions";
import { getCatalogAvailability } from "@/lib/catalog/nav";
import { SPORTS, sportFromSlug, sportSlug } from "@/lib/catalog/taxonomy";

type Params = { locale: Locale; sport: string; profile: string };

/** Every level × style for every sport: nine indexable outcome pages per sport. */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    SPORTS.flatMap(({ key }) =>
      ADVISOR_LEVELS.flatMap((niveau) =>
        ADVISOR_STYLES.map((stijl) => ({
          locale,
          sport: sportSlug(key, locale),
          profile: profileSlug({ niveau, stijl }),
        })),
      ),
    ),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/advisor/[sport]/[profile]">): Promise<Metadata> {
  const { locale, sport: slug, profile: raw } = (await params) as Params;
  const sport = sportFromSlug(slug, locale);
  const profile = parseProfile(raw);
  if (!sport || !profile) return {};
  const t = await getTranslations({ locale, namespace: "advisor.outcome" });
  const values = {
    racket: t(`racket.${sport}`),
    level: t(`level.${profile.niveau}`),
    style: t(`style.${profile.stijl}`),
  };
  return {
    title: t("metaTitle", values),
    description: t("metaDescription", values),
    // Canonical without frequency and budget: the personal variants point to this page.
    alternates: getAlternates(
      (l) => ({
        pathname: "/advisor/[sport]/[profile]",
        params: { sport: sportSlug(sport, l), profile: raw },
      }),
      locale,
    ),
  };
}

/**
 * Advisor outcome, e.g. /nl/keuzehulp/padel/beginner-controle?frequentie=wekelijks&budget=75-150
 * (Keuzehulp.dc.html, result state; RP-50). Unknown sports and profiles 404 in the proxy.
 */
export default async function AdvisorOutcomePage({
  params,
  searchParams,
}: PageProps<"/[locale]/advisor/[sport]/[profile]">) {
  const { locale, sport: slug, profile: raw } = (await params) as Params;
  setRequestLocale(locale);
  const sport = sportFromSlug(slug, locale);
  const profile = parseProfile(raw);
  if (!sport || !profile) notFound();

  const [t, tp, availability] = await Promise.all([
    getTranslations({ locale, namespace: "advisor" }),
    getTranslations({ locale, namespace: "advisor.outcome" }),
    getCatalogAvailability(),
  ]);
  const available = availability.rackets ?? [];
  const sports = SPORTS.map((s) => s.key).filter((k) => available.includes(k));
  const values = {
    racket: tp(`racket.${sport}`),
    level: tp(`level.${profile.niveau}`),
    style: tp(`style.${profile.stijl}`),
  };

  return (
    <>
      <div className="rp-hero-sub text-white">
        <Header active="rackets" />
        <section
          id="main"
          tabIndex={-1}
          className="mx-auto flex w-full max-w-[1040px] flex-col gap-8 px-(--rp-gutter) pt-[clamp(32px,5vw,64px)] pb-[clamp(56px,7vw,96px)] outline-none"
        >
          <nav aria-label={t("breadcrumb")}>
            <ol className="flex flex-wrap gap-2 text-[13px] text-[#B7CBBC]">
              <li className="flex gap-2">
                <Link href="/" className="text-[#D3E3D7] hover:text-white">
                  {t("home")}
                </Link>
                <span aria-hidden="true">/</span>
              </li>
              <li className="flex gap-2">
                <Link href="/advisor" className="text-[#D3E3D7] hover:text-white">
                  {t("title")}
                </Link>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page" className="text-white">
                {t(`options.niveau.${profile.niveau}.label`)} ·{" "}
                {t(`options.stijl.${profile.stijl}.label`)}
              </li>
            </ol>
          </nav>
          <div className="flex max-w-[720px] flex-col gap-3.5">
            <Reveal>
              <h1 className="text-[clamp(34px,3.6vw,52px)] leading-[1.04] font-semibold tracking-[-0.5px] text-balance">
                {tp("h1", values)}
              </h1>
            </Reveal>
            <p className="text-[18px] leading-normal text-[#E2EDE5]">{tp("intro")}</p>
          </div>
          <Reveal>
            <Suspense fallback={<div className="min-h-[480px] bg-white" />}>
              <AdvisorResult
                locale={locale}
                sport={sport}
                sports={sports}
                niveau={profile.niveau}
                stijl={profile.stijl}
                searchParams={searchParams}
              />
            </Suspense>
          </Reveal>
        </section>
      </div>
      <AdvisorInfo locale={locale} sports={sports} />
    </>
  );
}
