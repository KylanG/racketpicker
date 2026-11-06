import { getTranslations } from "next-intl/server";
import { ArrowIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ADVISOR_STYLES } from "@/lib/advisor/questions";
import { sportSlug, type SportKey } from "@/lib/catalog/taxonomy";

const ROWS = ["weight", "balance", "sweetspot", "material", "for"] as const;
const COLUMNS = { controle: "control", allround: "allround", power: "power" } as const;
const FAQ = ["free", "match", "beginner", "prices", "later"] as const;
const LINKS = [
  ["beginner", { niveau: "beginner" }],
  ["power", { stijl: "power" }],
  ["controle", { stijl: "controle" }],
] as const;

/**
 * SEO content below the advisor and its outcome pages (Keuzehulp.dc.html): the
 * control/allround/power table, FAQ and links to the overviews of sports with rackets.
 */
export async function AdvisorInfo({ locale, sports }: { locale: Locale; sports: SportKey[] }) {
  const [t, to, ts] = await Promise.all([
    getTranslations({ locale, namespace: "advisor.info" }),
    getTranslations({ locale, namespace: "advisor.options.stijl" }),
    getTranslations({ locale, namespace: "sports" }),
  ]);
  const h2 = "text-[clamp(28px,2.6vw,38px)] font-semibold tracking-[-0.3px]";

  return (
    <>
      <section className="rp-container flex w-full flex-col gap-7 pt-24 pb-12">
        <div className="flex max-w-[720px] flex-col gap-2.5">
          <Reveal>
            <h2 className={h2}>{t("tableTitle")}</h2>
          </Reveal>
          <p className="text-muted text-[17px] leading-[1.55]">{t("tableIntro")}</p>
        </div>
        <Reveal className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-[15px]">
            <caption className="sr-only">{t("tableCaption")}</caption>
            <thead>
              <tr className="bg-green-950 text-white">
                <td className="px-5 py-4" />
                {ADVISOR_STYLES.map((s) => (
                  <th
                    key={s}
                    scope="col"
                    className={`px-5 py-4 font-semibold ${s === "power" ? "text-lime" : ""}`}
                  >
                    {to(`${s}.label`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r} className="border-border border-b">
                  <th scope="row" className="bg-surface px-5 py-4 font-semibold whitespace-nowrap">
                    {t(`rows.${r}.label`)}
                  </th>
                  {ADVISOR_STYLES.map((s) => (
                    <td key={s} className="text-muted px-5 py-4">
                      {t(`rows.${r}.${COLUMNS[s]}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </section>

      <section className="rp-container grid w-full grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-start gap-12 py-14">
        <div className="flex flex-col gap-2.5">
          <Reveal>
            <h2 className={h2}>{t("faqTitle")}</h2>
          </Reveal>
          <p className="text-muted max-w-[360px] text-[16px] leading-normal">{t("faqIntro")}</p>
        </div>
        <div className="flex flex-col border-t border-[#DCE6D6]">
          {FAQ.map((f, i) => (
            <details key={f} open={i === 0} className="group border-b border-[#DCE6D6]">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-5 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
                {t(`faq.${f}.q`)}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-[22px] font-normal transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="text-muted mb-5 max-w-[620px] text-[16px] leading-[1.55]">
                {t(`faq.${f}.a`)}
              </p>
            </details>
          ))}
        </div>
      </section>

      {sports.length > 0 && (
        <section className="rp-container flex w-full flex-col gap-7 pt-14 pb-24">
          <Reveal>
            <h2 className={h2}>{t("linksTitle")}</h2>
          </Reveal>
          <Reveal stagger className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
            {sports.map((sport) => {
              const href = (query?: Record<string, string>) => ({
                pathname: "/rackets/[sport]" as const,
                params: { sport: sportSlug(sport, locale) },
                query,
              });
              return (
                <div key={sport} className="bg-surface flex flex-col gap-2.5 p-[22px]">
                  <h3>
                    <Link
                      href={href()}
                      className="flex items-center justify-between text-[18px] font-semibold"
                    >
                      {t("sportRackets", { sport: ts(sport) })}
                      <ArrowIcon />
                    </Link>
                  </h3>
                  {LINKS.map(([key, query]) => (
                    <Link
                      key={key}
                      href={href(query)}
                      className="text-muted text-[14px] hover:text-green-950"
                    >
                      {t(`links.${key}`)}
                    </Link>
                  ))}
                </div>
              );
            })}
          </Reveal>
        </section>
      )}
    </>
  );
}
