import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import type { ReactNode } from "react";
import { FeaturedDeals } from "@/components/home/featured-deals";
import {
  BrandBlock,
  CtaBlocks,
  HowItWorks,
  LatestArticles,
  PriceAlertPromo,
  ShopBlock,
} from "@/components/home/home-sections";
import { TrustpilotReviews } from "@/components/home/trustpilot-reviews";
import { HeroSearch } from "@/components/home/hero-search";
import { Header } from "@/components/layout/header";
import { ArrowIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { getAlternates } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getShopCount } from "@/lib/catalog/deals";
import { getSearchIndex } from "@/lib/catalog/search";
import { ACTIVE_SEASON, SEASONS, type HomeBlock } from "@/lib/home/season";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: getAlternates("/", locale as Locale) };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const season = SEASONS[ACTIVE_SEASON];
  const [t, shopCount, searchIndex] = await Promise.all([
    getTranslations("home"),
    getShopCount(locale),
    getSearchIndex(locale),
  ]);

  return (
    <>
      <div className="rp-hero relative text-white">
        <Header active="home" />
        <section
          id="main"
          tabIndex={-1}
          className="mx-auto grid max-w-[1440px] grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] items-center gap-12 px-(--rp-gutter) pt-[clamp(40px,7vw,100px)] pb-[clamp(60px,9vw,140px)]"
        >
          <div className="flex flex-col gap-7">
            <Reveal>
              <h1 className="rp-h1-home">{t(`season.${ACTIVE_SEASON}.title`)}</h1>
            </Reveal>
            <p className="max-w-[500px] text-[18px] leading-normal">
              {shopCount > 0
                ? t.rich("intro", {
                    count: shopCount,
                    strong: (chunks) => <strong className="text-lime">{chunks}</strong>,
                  })
                : t("introNoCount")}
            </p>
            <HeroSearch index={searchIndex} />
            <Link
              href="/advisor"
              prefetch={false}
              className="hover:text-lime -mt-2.5 flex items-center gap-2.5 self-start text-[15px] font-medium text-white"
            >
              <span>
                {t("advisorDoubt")} <span className="font-semibold">{t("advisorLink")}</span>
              </span>
              <ArrowIcon size={12} className="text-lime" />
            </Link>
          </div>
          {season.image && (
            <Image
              src={season.image.src}
              alt={t(`season.${ACTIVE_SEASON}.imageAlt`)}
              width={season.image.width}
              height={season.image.height}
              priority
              fetchPriority="high"
              // Column is at most 580px wide; full width below the 2-column breakpoint.
              sizes="(min-width: 1040px) 580px, calc(100vw - 40px)"
              className="w-full max-w-[580px] justify-self-end drop-shadow-[0_24px_40px_rgb(0_0_0/0.35)]"
            />
          )}
        </section>
      </div>

      <div className="flex flex-col">
        {/* Order of the first three blocks depends on the season (src/lib/home/season.ts). */}
        {season.blocks.map((block) => {
          const blocks: Record<HomeBlock, ReactNode> = {
            deals: <FeaturedDeals key="deals" />,
            ctas: (
              <CtaBlocks
                key="ctas"
                shopCount={shopCount}
                eyebrow={t(`season.${ACTIVE_SEASON}.ctaEyebrow`)}
              />
            ),
            shop: <ShopBlock key="shop" />,
          };
          return blocks[block];
        })}
        <HowItWorks shopCount={shopCount} />
        <BrandBlock />
        <PriceAlertPromo />
        <TrustpilotReviews />
        <LatestArticles />
      </div>
    </>
  );
}
