import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BrandLogo, logoSrc } from "@/components/brands/brand-logo";
import { Header } from "@/components/layout/header";
import { Reveal } from "@/components/ui/reveal";
import { getAlternates } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getBrands } from "@/lib/catalog/brand-pages";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/brands">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getTranslations({ locale, namespace: "brands" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: getAlternates("/brands", locale),
  };
}

/** All brands with products (RP-55), most products first. */
export default async function BrandsPage({ params }: PageProps<"/[locale]/brands">) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const [brands, t, tr] = await Promise.all([
    getBrands(),
    getTranslations({ locale, namespace: "brands" }),
    getTranslations({ locale, namespace: "rackets" }),
  ]);

  return (
    <>
      <div className="rp-hero-sub text-white">
        <Header active="brands" />
        <section className="rp-container flex flex-col gap-5 pt-[clamp(40px,5vw,72px)] pb-[clamp(48px,6vw,88px)]">
          <nav aria-label={tr("breadcrumb")}>
            <ol className="text-on-dark-3 flex flex-wrap gap-2 text-[13px]">
              <li className="flex gap-2">
                <Link href="/" className="text-on-dark-3 hover:text-white">
                  {tr("home")}
                </Link>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page" className="text-white">
                {t("breadcrumb")}
              </li>
            </ol>
          </nav>
          <div className="flex max-w-[680px] flex-col gap-2.5">
            <Reveal>
              <h1 className="text-[clamp(32px,3.2vw,46px)] leading-[1.05] font-semibold tracking-[-0.4px]">
                {t("title")}
              </h1>
            </Reveal>
            <p className="text-on-dark-strong text-[16px] leading-normal">
              {t("intro", { count: brands.length })}
            </p>
          </div>
        </section>
      </div>

      <section className="rp-container w-full py-[clamp(40px,5vw,72px)]">
        <ul className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {brands.map((b) => (
            <li key={b.slug}>
              <Link
                href={{ pathname: "/brands/[brand]", params: { brand: b.slug } }}
                className="bg-surface hover:shadow-card-hover flex h-full flex-col items-center justify-center gap-4 px-5 py-8 text-center text-green-950 transition-shadow duration-300 hover:text-green-950"
              >
                <span className="grid h-14 w-full place-items-center">
                  <BrandLogo
                    name={b.name}
                    logo={logoSrc(b.logoPath)}
                    className="mx-auto h-12 w-full max-w-[170px]"
                  />
                </span>
                <span className="text-muted text-[14px]">
                  {t("productCount", { count: b.productCount })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
