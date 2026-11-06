import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { AdvisorQuiz } from "@/components/advisor/advisor-quiz";
import { Header } from "@/components/layout/header";
import { Reveal } from "@/components/ui/reveal";
import { getAlternates } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { activeSteps } from "@/lib/advisor/questions";
import { getCatalogAvailability } from "@/lib/catalog/nav";
import { getRacketListing } from "@/lib/catalog/rackets";
import { SPORTS } from "@/lib/catalog/taxonomy";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/advisor">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getTranslations({ locale, namespace: "advisor" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: getAlternates("/advisor", locale),
  };
}

/** Advisor (design/handoff/Keuzehulp.dc.html): five questions, one per screen (RP-49). */
export default async function AdvisorPage({ params }: PageProps<"/[locale]/advisor">) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const [t, availability, listing] = await Promise.all([
    getTranslations({ locale, namespace: "advisor" }),
    getCatalogAvailability(),
    getRacketListing(locale),
  ]);
  // Only sports with rackets are offered, in taxonomy order.
  const available = availability.rackets ?? [];
  const sports = SPORTS.map((s) => s.key).filter((k) => available.includes(k));
  const steps = activeSteps(sports).length;
  const count = listing.length;

  return (
    <div className="rp-hero-sub text-white">
      <Header active="rackets" />
      <section
        id="main"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-[1040px] flex-col gap-8 px-(--rp-gutter) pt-[clamp(32px,5vw,64px)] pb-[clamp(56px,7vw,96px)] outline-none"
      >
        <nav aria-label={t("breadcrumb")}>
          <ol className="flex gap-2 text-[13px] text-[#B7CBBC]">
            <li className="flex gap-2">
              <Link href="/" className="text-[#D3E3D7] hover:text-white">
                {t("home")}
              </Link>
              <span aria-hidden="true">/</span>
            </li>
            <li aria-current="page" className="text-white">
              {t("title")}
            </li>
          </ol>
        </nav>
        <div className="flex max-w-[720px] flex-col gap-3.5">
          <Reveal>
            <h1 className="text-[clamp(34px,3.6vw,52px)] leading-[1.04] font-semibold tracking-[-0.5px] text-balance">
              {t("h1")}
            </h1>
          </Reveal>
          <p className="text-[18px] leading-normal text-[#E2EDE5]">
            {count > 0
              ? t("intro", { steps: String(steps), count })
              : t("introNoCount", { steps: String(steps) })}
          </p>
        </div>
        <Reveal>
          {sports.length > 0 && (
            // useSearchParams needs a Suspense boundary; the fallback keeps the card's height.
            <Suspense fallback={<div className="min-h-[480px] bg-white" />}>
              <AdvisorQuiz sports={sports} />
            </Suspense>
          )}
        </Reveal>
      </section>
    </div>
  );
}
