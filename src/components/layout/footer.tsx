import { cacheLife } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import { companyDetails } from "@/lib/company";
import type { Locale } from "@/i18n/routing";
import { getCatalogAvailability } from "@/lib/catalog/nav";
import { CATEGORIES, sportSlug } from "@/lib/catalog/taxonomy";
import { CookieSettingsButton } from "./cookie-settings-button";
import { LanguageSwitcher } from "./language-switcher";
import { NewsletterForm } from "./newsletter-form";
import { SPORT_ROUTE, type NavHref } from "./nav-types";

/** At most this many category links under "Vergelijken", before "Deals". */
const MAX_COMPARE_LINKS = 4;

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

type FooterLink = { label: string; href: NavHref; prefetch?: false };

const LINK_CLASS = "text-on-dark py-2.5 text-left text-[14px] hover:text-white";

/**
 * Shared footer (design/handoff/Footer.dc.html): newsletter, link columns and the bottom
 * bar with the affiliate disclosure. "Vergelijken" only lists categories with products.
 */
export async function Footer() {
  const [locale, availability, year, t, tr, th, ta] = await Promise.all([
    getLocale() as Promise<Locale>,
    getCatalogAvailability(),
    currentYear(),
    getTranslations("footer"),
    getTranslations("rackets"),
    getTranslations("header"),
    getTranslations("affiliate"),
  ]);

  const company = companyDetails();
  // Shown once set in Vercel (COMPANY_LEGAL_NAME, COMPANY_KVK, COMPANY_ADDRESS).
  const companyLine = [company.legalName, company.kvk && `KvK ${company.kvk}`, company.address]
    .filter(Boolean)
    .join(" · ");

  const compare: FooterLink[] = CATEGORIES.flatMap((category) =>
    (availability[category] ?? []).map((sport) => ({
      label:
        category === "rackets" ? tr(`sportTitle.${sport}`) : th(`sub.${category}.${sport}.name`),
      href: {
        pathname: SPORT_ROUTE[category],
        params: { sport: sportSlug(sport, locale) },
      } as NavHref,
    })),
  ).slice(0, MAX_COMPARE_LINKS);

  // Pages that do not exist yet are not prefetched, so they do not log 404s.
  const later = { prefetch: false } as const;
  const columns: { title: string; links: FooterLink[]; cookies?: boolean }[] = [
    {
      title: t("columns.compare"),
      links: [...compare, { label: t("links.deals"), href: { pathname: "/", hash: "deals" } }],
    },
    {
      title: t("columns.help"),
      links: [
        { label: t("links.advisor"), href: "/advisor", ...later },
        { label: t("links.blog"), href: "/blog", ...later },
        { label: t("links.priceHistory"), href: "/price-history" },
        { label: t("links.faq"), href: "/faq" },
      ],
    },
    {
      title: t("columns.company"),
      links: [
        { label: t("links.about"), href: "/about" },
        { label: t("links.howWeEarn"), href: "/how-we-earn" },
        { label: t("links.contact"), href: "/contact" },
        { label: t("links.privacy"), href: "/privacy" },
        { label: t("links.cookiePolicy"), href: "/cookies" },
      ],
      cookies: true,
    },
  ];

  return (
    <footer className="rp-slant-top bg-green-950 text-white">
      <div className="mx-auto grid max-w-[1440px] grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-10 border-b border-white/14 px-(--rp-gutter) pt-24 pb-14">
        <div className="flex flex-col gap-3">
          <Reveal>
            <h2 className="rp-h2-sub">{t("newsletterTitle")}</h2>
          </Reveal>
          <p className="text-on-dark max-w-[440px] text-[16px] leading-normal">
            {t("newsletterIntro")}
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3">
          <NewsletterForm />
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-9 px-(--rp-gutter) py-14">
        <div className="flex flex-col gap-4">
          <Link href="/" aria-label={th("home")} className="block w-fit">
            <Image src="/logo.svg" alt="" width={95} height={40} className="block h-10 w-auto" />
          </Link>
          <p className="text-on-dark-2 max-w-[220px] text-[14px] leading-normal">{t("tagline")}</p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="flex flex-col">
            <h2 className="text-lime mb-2 text-[14px] font-semibold">{col.title}</h2>
            {col.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                prefetch={link.prefetch}
                className={LINK_CLASS}
              >
                {link.label}
              </Link>
            ))}
            {col.cookies && (
              <CookieSettingsButton
                label={t("links.cookieSettings")}
                className={`${LINK_CLASS} cursor-pointer`}
              />
            )}
          </nav>
        ))}
      </div>

      <div className="text-on-dark-3 mx-auto flex max-w-[1440px] flex-wrap justify-between gap-4 px-(--rp-gutter) pt-5 pb-8 text-[13px]">
        <div className="flex flex-wrap items-center gap-5">
          <span>{t("copyright", { year })}</span>
          <LanguageSwitcher variant="footer" />
          {companyLine && <span>{companyLine}</span>}
        </div>
        <p>
          {t("pricesUpdated")} {ta("disclosure")}
        </p>
      </div>
    </footer>
  );
}
