import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FavoritesGrid } from "@/components/catalog/favorites-grid";
import { Header } from "@/components/layout/header";
import { Reveal } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { ProductCardData } from "@/lib/catalog/product-card";
import { getCatalogListing } from "@/lib/catalog/rackets";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/favorites">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getTranslations({ locale, namespace: "favorites" });
  // Personal page: never in search results.
  return { title: t("metaTitle"), robots: { index: false, follow: true } };
}

/** Favourites (design/handoff/Favorieten.dc.html; RP-53). Saved on this device only. */
export default async function FavoritesPage({ params }: PageProps<"/[locale]/favorites">) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const [rackets, accessories, t, ts, tf] = await Promise.all([
    getCatalogListing(locale, "rackets"),
    getCatalogListing(locale, "accessories"),
    getTranslations({ locale, namespace: "favorites" }),
    getTranslations({ locale, namespace: "sports" }),
    getTranslations({ locale, namespace: "rackets.filters" }),
  ]);
  const products: ProductCardData[] = [...rackets, ...accessories].map((i) => ({
    id: i.id,
    href: i.href,
    brand: i.brand.name,
    sport: ts(i.sport),
    name: i.name,
    imageUrl: i.imageUrl,
    tags: [
      i.kind ? tf(`kindSingular.${i.kind}`) : null,
      i.style ? tf(`style.${i.style}`) : null,
    ].filter((x): x is string => Boolean(x)),
    price: i.price,
    compareAt: i.compareAt,
    shopCount: i.shopCount,
    inStock: i.inStock,
  }));

  return (
    <>
      <div className="rp-hero-sub text-white">
        <Header />
        <section className="rp-container flex flex-col gap-[18px] pt-[clamp(40px,5vw,72px)] pb-[clamp(48px,6vw,88px)]">
          <nav aria-label={t("breadcrumb")}>
            <ol className="text-on-dark flex gap-2 text-[13px]">
              <li className="flex gap-2">
                <Link href="/" className="text-on-dark hover:text-white">
                  {t("home")}
                </Link>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page" className="text-white">
                {t("title")}
              </li>
            </ol>
          </nav>
          <Reveal>
            <h1 className="text-[clamp(32px,3.2vw,46px)] leading-[1.05] font-semibold tracking-[-0.4px]">
              {t("title")}
            </h1>
          </Reveal>
          <p className="text-on-dark-strong max-w-[640px] text-[17px] leading-normal">
            {t("intro")}
          </p>
        </section>
      </div>
      <section
        id="main"
        tabIndex={-1}
        className="rp-container flex w-full flex-col gap-6 pt-12 pb-24 outline-none"
      >
        <FavoritesGrid products={products} />
      </section>
    </>
  );
}
