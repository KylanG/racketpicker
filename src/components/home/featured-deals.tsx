import { getLocale, getTranslations } from "next-intl/server";
import { ProductCard } from "@/components/catalog/product-card";
import { Reveal } from "@/components/ui/reveal";
import type { Locale } from "@/i18n/routing";
import { getFeaturedDeals } from "@/lib/catalog/deals";
import { SPORTS } from "@/lib/catalog/taxonomy";
import { DealsGrid } from "./deals-grid";

/** "Uitgelichte deals" (design/handoff/Homepagina.dc.html, #deals). */
export async function FeaturedDeals() {
  const locale = (await getLocale()) as Locale;
  const [deals, t, ts] = await Promise.all([
    getFeaturedDeals(locale),
    getTranslations("home"),
    getTranslations("sports"),
  ]);

  const header = (
    <div className="flex flex-col gap-2">
      <p className="rp-eyebrow">{t("dealsEyebrow")}</p>
      <Reveal>
        <h2 id="deals-title" className="rp-h2">
          {t("dealsTitle")}
        </h2>
      </Reveal>
    </div>
  );

  const sports = SPORTS.filter((s) => deals.some((d) => d.sport === s.key)).map((s) => ({
    key: s.key,
    label: ts(s.key),
  }));

  return (
    <section
      id="deals"
      aria-labelledby="deals-title"
      className="rp-container flex w-full flex-col gap-8 pt-24 pb-10"
    >
      {deals.length === 0 ? (
        <>
          {header}
          <p className="text-muted max-w-[var(--container-read)]">{t("dealsEmpty")}</p>
        </>
      ) : (
        <DealsGrid
          header={header}
          sports={sports}
          cards={deals.map((d) => ({
            id: d.id,
            sport: d.sport,
            node: (
              <ProductCard
                product={{
                  id: d.id,
                  href: d.href,
                  brand: d.brand,
                  sport: ts(d.sport),
                  name: d.name,
                  imageUrl: d.imageUrl,
                  tags: [],
                  price: d.price,
                  compareAt: d.compareAt,
                  shopCount: d.shopCount,
                  inStock: d.inStock,
                }}
              />
            ),
          }))}
        />
      )}
    </section>
  );
}
