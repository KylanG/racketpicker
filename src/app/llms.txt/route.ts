import { cacheLife, cacheTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { defaultLocale, type Locale } from "@/i18n/routing";
import { CATALOG_TAG } from "@/lib/catalog/cache-tags";
import { getShopCount } from "@/lib/catalog/deals";
import { getCatalogOverview } from "@/lib/catalog/overview";
import { sportSlug } from "@/lib/catalog/taxonomy";
import { siteOrigin } from "@/lib/seo/indexing";

type Href = Parameters<typeof getPathname>[0]["href"];

/**
 * llms.txt (RP-34, GEO): a short map of the site for AI assistants, after
 * design/handoff/llms.txt. Built from the live catalog, so it only links to sports and
 * categories that have products.
 */
async function llmsText(locale: Locale): Promise<string> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("days");

  const [t, tf, tr, ta, overview, shops] = await Promise.all([
    getTranslations({ locale, namespace: "llms" }),
    getTranslations({ locale, namespace: "affiliate" }),
    getTranslations({ locale, namespace: "rackets" }),
    getTranslations({ locale, namespace: "accessories" }),
    getCatalogOverview(),
    getShopCount(locale),
  ]);
  const url = (href: Href) => siteOrigin() + getPathname({ href, locale });
  const link = (label: string, href: Href, note?: string) =>
    `- [${label}](${url(href)})${note ? `: ${note}` : ""}`;

  const listings: string[] = [];
  for (const category of overview.categories) {
    for (const sport of category.sports) {
      const params = { sport: sportSlug(sport, locale) };
      if (category.key === "rackets") {
        const name = tr(`sportTitle.${sport}`);
        listings.push(
          link(
            tr("pageTitle", { name }),
            { pathname: "/rackets/[sport]", params },
            t("listingNote"),
          ),
        );
      } else if (category.key === "accessories") {
        listings.push(
          link(ta("pageTitle"), { pathname: "/accessories/[sport]", params }, t("listingNote")),
        );
      }
    }
  }

  return [
    "# Racketpicker",
    "",
    `> ${shops > 0 ? t("intro", { shops }) : t("introNoCount")} ${tf("disclosure")}`,
    "",
    `## ${t("pagesTitle")}`,
    ...listings,
    link(t("advisor"), "/advisor", t("advisorNote")),
    link(t("blog"), "/blog", t("blogNote")),
    "",
    `## ${t("howTitle")}`,
    link(t("howWeEarn"), "/how-we-earn"),
    link(t("priceHistory"), "/price-history"),
    link(t("about"), "/about"),
    link(t("faq"), "/faq"),
    "",
    `## ${t("contactTitle")}`,
    "- hello@racketpicker.com",
    "",
  ].join("\n");
}

export async function GET() {
  return new Response(await llmsText(defaultLocale), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
