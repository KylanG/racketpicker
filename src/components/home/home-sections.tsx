import { ADVISOR_LIVE } from "@/lib/features";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { SPORT_ROUTE, type NavHref } from "@/components/layout/nav-types";
import { ArrowIcon, BellIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { Slant } from "@/components/ui/slant";
import { Link } from "@/i18n/navigation";
import { intlLocale, type Locale } from "@/i18n/routing";
import { ArticleCard } from "@/components/blog/article-card";
import { getLatestArticles } from "@/lib/blog/articles";
import { getCatalogOverview } from "@/lib/catalog/overview";
import { sportSlug, type CategoryKey, type SportKey } from "@/lib/catalog/taxonomy";
import { formatPrice } from "@/lib/format/price";
import { BrandWall } from "./brand-wall";
import { ShopTabs } from "./shop-tabs";

/** The merkenblok only appears from this many brands; with fewer it looks empty. */
const MIN_WALL_BRANDS = 8;

const sportHref = (sport: SportKey, locale: Locale, category: CategoryKey = "rackets"): NavHref =>
  ({ pathname: SPORT_ROUTE[category], params: { sport: sportSlug(sport, locale) } }) as NavHref;

/* ---------------------------------------------------------------------------------- */

/** Two CTA blocks with a 32px slant: advisor (lime) and all deals (dark). */
export async function CtaBlocks({ shopCount, eyebrow }: { shopCount: number; eyebrow: string }) {
  const t = await getTranslations("home");
  const block =
    "flex min-h-80 flex-col gap-4 px-[clamp(48px,5vw,72px)] py-[clamp(32px,4vw,56px)] transition-colors duration-300";
  const clip = { clipPath: "polygon(32px 0,100% 0,calc(100% - 32px) 100%,0 100%)" };
  const title =
    "max-w-[460px] text-[clamp(30px,3vw,44px)] leading-[1.05] font-semibold tracking-[-0.4px]";

  return (
    <section className="rp-container w-full pt-6 pb-[88px]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
        {ADVISOR_LIVE && (
          <Link
            href="/advisor"
            prefetch={false}
            style={clip}
            className={`${block} bg-lime hover:bg-lime-soft text-green-950 hover:text-green-950`}
          >
            <p className="text-[13px] font-semibold tracking-[1.4px] uppercase">
              {t("ctaAdvisorEyebrow")}
            </p>
            <h2 className={title}>{t("ctaAdvisorTitle")}</h2>
            <p className="max-w-[420px] text-[17px] leading-normal">{t("ctaAdvisorText")}</p>
            <Slant
              as="span"
              size={8}
              className="[&_[data-arrow]]:text-lime mt-auto flex items-center gap-2.5 self-start bg-green-950 px-6 py-[15px] text-[15px] font-semibold text-white"
            >
              {t("ctaAdvisorButton")}
              <ArrowIcon />
            </Slant>
          </Link>
        )}
        <Link
          href="/deals"
          style={clip}
          className={`${block} bg-green-950 text-white hover:bg-green-900 hover:text-white`}
        >
          <p className="text-lime text-[13px] font-semibold tracking-[1.4px] uppercase">
            {eyebrow}
          </p>
          <h2 className={title}>{t("ctaDealsTitle")}</h2>
          <p className="text-on-dark max-w-[420px] text-[17px] leading-normal">
            {shopCount > 0 ? t("ctaDealsText", { count: shopCount }) : t("ctaDealsTextNoCount")}
          </p>
          <Slant
            as="span"
            size={8}
            className="bg-lime mt-auto flex items-center gap-2.5 self-start px-6 py-[15px] text-[15px] font-semibold text-green-950"
          >
            {t("ctaDealsButton")}
            <ArrowIcon />
          </Slant>
        </Link>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------------- */

function CardArrow({ dark }: { dark: boolean }) {
  return (
    <span
      className={`grid size-[34px] shrink-0 place-items-center rounded-full ${
        dark ? "bg-lime text-green-950" : "text-lime bg-green-950"
      }`}
    >
      <ArrowIcon />
    </span>
  );
}

/** "Waar wil je beginnen?": per sport (4:5 cards) or per category. Only what has products. */
export async function ShopBlock() {
  const locale = (await getLocale()) as Locale;
  const [overview, t, ts, tc, th] = await Promise.all([
    getCatalogOverview(),
    getTranslations("home"),
    getTranslations("sports"),
    getTranslations("categories"),
    getTranslations("header"),
  ]);
  if (overview.sports.length === 0) return null;
  const list = new Intl.ListFormat(intlLocale[locale], { type: "conjunction" });

  const bySport = (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
      {overview.sports.map((s) => (
        <li key={s.key}>
          <Link
            href={sportHref(s.key, locale)}
            className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden bg-green-900 p-5 text-white hover:bg-green-800 hover:text-white"
          >
            {/* Sport photo follows; until then the striped placeholder from the prototype. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.04)_0_12px,transparent_12px_24px)]"
            />
            <span className="relative flex items-end justify-between gap-2">
              <span className="flex flex-col gap-0.5">
                <h3 className="text-[22px] font-semibold">{ts(s.key)}</h3>
                <span className="text-lime text-[13px]">
                  {t("productCount", { count: s.count })}
                </span>
              </span>
              <CardArrow dark />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );

  const byCategory =
    overview.categories.length > 0 ? (
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        {overview.categories.map((c) => (
          <li key={c.key}>
            <Link
              href={c.key === "rackets" ? "/rackets" : sportHref(c.sports[0]!, locale, c.key)}
              className="bg-surface hover:bg-surface-hover text-ink hover:text-ink relative flex aspect-[4/5] flex-col justify-end overflow-hidden p-5"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-[repeating-linear-gradient(135deg,#edf2e7_0_12px,transparent_12px_24px)]"
              />
              <span className="relative flex items-end justify-between gap-2">
                <span className="flex flex-col gap-0.5">
                  <h3 className="text-[22px] font-semibold">{tc(c.key)}</h3>
                  <span className="text-muted text-[13px]">
                    {list.format(
                      c.sports.map((s) =>
                        c.key === "rackets" ? ts(s) : th(`sub.${c.key}.${s}.name`),
                      ),
                    )}
                  </span>
                </span>
                <CardArrow dark={false} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <section className="rp-container flex w-full flex-col gap-7 py-[72px]">
      <ShopTabs
        title={
          <Reveal>
            <h2 className="rp-h2">{t("shopTitle")}</h2>
          </Reveal>
        }
        bySport={bySport}
        byCategory={byCategory}
      />
    </section>
  );
}

/* ---------------------------------------------------------------------------------- */

/** "Zo werkt Racketpicker": three steps with lime badges 01–03. */
export async function HowItWorks({ shopCount }: { shopCount: number }) {
  const t = await getTranslations("home");
  const steps = [
    [
      t("howStep1Title"),
      shopCount > 0
        ? t(ADVISOR_LIVE ? "howStep1Text" : "howStep1TextSearch", { count: shopCount })
        : t(ADVISOR_LIVE ? "howStep1TextNoCount" : "howStep1TextNoCountSearch"),
    ],
    [t("howStep2Title"), t("howStep2Text")],
    [t("howStep3Title"), t("howStep3Text")],
  ] as const;

  return (
    <section className="rp-container flex w-full flex-col gap-8 pt-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex max-w-[640px] flex-col gap-2">
          <p className="rp-eyebrow">{t("howEyebrow")}</p>
          <Reveal>
            <h2 className="rp-h2">{t("howTitle")}</h2>
          </Reveal>
        </div>
        <Link href="/how-we-earn" className="rp-underline text-[15px] font-semibold">
          {t("howEarn")}
        </Link>
      </div>
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4">
        {steps.map(([title, text], i) => (
          <li key={title} className="bg-surface flex flex-col gap-3.5 p-7">
            <Slant
              as="span"
              size={5}
              aria-hidden="true"
              className="bg-lime self-start px-3.5 py-1.5 text-[15px] font-bold text-green-950"
            >
              {String(i + 1).padStart(2, "0")}
            </Slant>
            <h3 className="text-[20px] font-semibold">{title}</h3>
            <p className="text-muted text-[16px] leading-[1.55]">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------------------------------------------------------------------------------- */

/** Merkenblok on green-950 with 24px slanted top and bottom. Hidden with few brands. */
export async function BrandBlock() {
  const locale = (await getLocale()) as Locale;
  const [overview, t] = await Promise.all([getCatalogOverview(), getTranslations("home")]);
  if (overview.brands.length < MIN_WALL_BRANDS) return null;

  return (
    <section
      aria-labelledby="brands-title"
      className="rp-slant-block text-white"
      style={{
        background:
          "radial-gradient(ellipse 80% 70% at 30% 0%, var(--color-green-900) 0%, var(--color-green-950) 55%, var(--color-green-1000) 100%)",
      }}
    >
      <div className="rp-container flex flex-col gap-12 py-24">
        <h2 id="brands-title" className="sr-only">
          {t("brandsTitle")}
        </h2>
        <BrandWall
          brands={overview.brands.map((b) => ({
            slug: b.slug,
            name: b.name,
            logo: b.logoPath ? `/${b.logoPath.replace(/^\//, "")}` : null,
            href: {
              pathname: SPORT_ROUTE.rackets,
              params: { sport: sportSlug(b.sport, locale) },
              query: { merk: b.slug },
            } as NavHref,
          }))}
        />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------------- */

/** Price alert promo with an example card (clearly labelled as an example). */
/**
 * "Prijsalert" block. `copy` replaces the texts (the Black Friday version, RP-87) and
 * `first` gives it the spacing of the first block under the hero.
 */
export async function PriceAlertPromo({
  copy,
  first = false,
}: {
  copy?: { eyebrow: string; title: string; text: string };
  first?: boolean;
} = {}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("home");
  const now = 199;
  const target = 179;
  const text = copy ?? {
    eyebrow: t("alertEyebrow"),
    title: t("alertTitle"),
    text: t("alertText"),
  };

  return (
    <section className={`rp-container w-full ${first ? "pt-24 pb-10" : "pt-[136px]"}`}>
      <div className="bg-surface grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-center gap-12 p-[clamp(32px,4.5vw,64px)]">
        <div className="flex flex-col gap-4">
          <p className="rp-eyebrow">{text.eyebrow}</p>
          <Reveal>
            <h2 className="rp-h2">{text.title}</h2>
          </Reveal>
          <p className="text-muted max-w-[480px] text-[17px] leading-[1.55]">{text.text}</p>
          <Slant
            as={Link}
            href={sportHref("padel", locale)}
            size={8}
            className="[&_[data-arrow]]:text-lime mt-2 flex items-center gap-2.5 self-start bg-green-950 py-[15px] pr-[22px] pl-6 text-[15px] font-semibold text-white hover:bg-green-800 hover:text-white"
          >
            <span>{t("alertButton")}</span>
            <ArrowIcon />
          </Slant>
        </div>
        <Reveal className="w-full max-w-[460px] justify-self-center">
          <div className="shadow-card-hover relative flex flex-col gap-[18px] bg-white p-6">
            <span className="text-muted absolute top-3 right-3 text-[12px] font-medium tracking-[0.8px] uppercase">
              {t("alertExample")}
            </span>
            <div className="flex items-center gap-4">
              <div className="bg-surface-2 relative size-[72px] shrink-0">
                <Image
                  src="/home/alert-example.png"
                  alt=""
                  fill
                  sizes="72px"
                  className="object-contain p-[8%] mix-blend-multiply"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-2 text-[13px] font-medium tracking-[0.8px] uppercase">
                  {t("alertExampleBrand")}
                </span>
                <span className="text-[17px] font-semibold">{t("alertExampleName")}</span>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-2.5">
              <div className="bg-surface flex flex-col gap-0.5 px-4 py-3.5">
                <dt className="text-muted text-[13px]">{t("alertNow")}</dt>
                <dd className="text-[22px] font-bold">{formatPrice(now, locale)}</dd>
              </div>
              <div className="flex flex-col gap-0.5 bg-green-950 px-4 py-3.5 text-white">
                <dt className="text-lime text-[13px]">{t("alertTarget")}</dt>
                <dd className="text-[22px] font-bold">{formatPrice(target, locale)}</dd>
              </div>
            </dl>
            <Slant
              size={8}
              className="flex items-center gap-3 bg-[rgb(200_230_58/0.25)] px-3.5 py-3 text-[14px] font-medium"
            >
              <BellIcon size={18} className="shrink-0 text-green-950" />
              {t("alertNotice", { price: formatPrice(target, locale) })}
            </Slant>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------------- */

/** "Blogs & tips": three article cards; hidden until there are published articles. */
export async function LatestArticles() {
  const locale = (await getLocale()) as Locale;
  const [t, tb, ts] = await Promise.all([
    getTranslations("home"),
    getTranslations("blog"),
    getTranslations("sports"),
  ]);
  const articles = await getLatestArticles(locale, (sport) => (sport ? ts(sport) : tb("general")));
  if (articles.length === 0) return null;

  return (
    <section className="rp-container flex w-full flex-col gap-7 pt-[136px] pb-[120px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Reveal>
          <h2 className="rp-h2">{t("blogTitle")}</h2>
        </Reveal>
        <Link href="/blog" className="rp-underline text-[15px] font-semibold">
          {t("blogAll")}
        </Link>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6">
        {articles.map((a) => (
          <li key={a.slug}>
            <ArticleCard
              article={a}
              headingLevel="h3"
              minutesLabel={t("blogMinutes", { minutes: a.readingMinutes })}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
