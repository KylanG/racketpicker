import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Slant } from "@/components/ui/slant";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  activeSteps,
  BUDGETS,
  FREQUENCIES,
  quizQuery,
  type Answers,
  type AdvisorLevel,
  type AdvisorStyle,
  type Budget,
  type Frequency,
} from "@/lib/advisor/questions";
import { profileSlug } from "@/lib/advisor/questions";
import { rankRackets, type Match } from "@/lib/advisor/scoring";
import { getRacketListing } from "@/lib/catalog/rackets";
import { sportSlug, type SportKey } from "@/lib/catalog/taxonomy";
import { formatPrice } from "@/lib/format/price";
import { ShareLink } from "./share-link";

type Props = {
  locale: Locale;
  sport: SportKey;
  sports: SportKey[];
  niveau: AdvisorLevel;
  stijl: AdvisorStyle;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SITE_HOST = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://racketpicker.com")
  .replace(/^https?:\/\/(www\.)?/, "")
  .replace(/\/$/, "");

const MAX_RESULTS = 10;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Result card of an outcome page (Keuzehulp.dc.html, isResult): answers as labels that
 * reopen the question, a share link and the ranked rackets with match % (RP-50).
 * Frequency and budget come from the query; without them the ranking uses level and style.
 */
export async function AdvisorResult({ locale, sport, sports, niveau, stijl, searchParams }: Props) {
  const query = await searchParams;
  const f = one(query.frequentie);
  const b = one(query.budget);
  const frequentie = FREQUENCIES.includes(f as Frequency) ? (f as Frequency) : undefined;
  const budget = BUDGETS.includes(b as Budget) ? (b as Budget) : undefined;

  const [t, to, tq, tf, items] = await Promise.all([
    getTranslations({ locale, namespace: "advisor.result" }),
    getTranslations({ locale, namespace: "advisor.options" }),
    getTranslations({ locale, namespace: "advisor.question" }),
    getTranslations({ locale, namespace: "rackets.filters" }),
    getRacketListing(locale),
  ]);
  const tOutcome = await getTranslations({ locale, namespace: "advisor.outcome" });
  // The ten best; the rest of the list adds little and is one click away in the overview.
  const matches = rankRackets(items, { sport, niveau, stijl, frequentie, budget }).slice(
    0,
    MAX_RESULTS,
  );
  const answers: Answers = { sport, niveau, stijl, frequentie, budget };
  const steps = activeSteps(sports);
  const firstOpen = steps.findIndex((k) => answers[k] == null);

  const why = (m: Match) => {
    const parts = m.reasons.map((r) =>
      t(`why.${r}`, {
        level: tOutcome(`level.${niveau}`),
        style: to(`stijl.${stijl}.label`).toLowerCase(),
      }),
    );
    const text = parts.length ? parts.join(", ") : t("why.fallback");
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
  };

  return (
    <div className="flex flex-col bg-white text-[#0B2A17] shadow-[0_30px_60px_rgba(0,20,8,.35)]">
      <div className="border-border flex flex-col gap-3.5 border-b px-[clamp(20px,3.5vw,40px)] py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-[clamp(24px,2.4vw,30px)] font-semibold tracking-[-0.3px]">
            {t("count", { count: matches.length })}
          </h2>
          <Link
            href="/advisor"
            className="rp-underline text-[14px] font-semibold text-[#0B2A17] hover:text-[#0B2A17]"
          >
            {t("restart")}
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {steps.map((key, i) => {
            const value = answers[key];
            if (!value) return null;
            const label = to(`${key}.${value}.label` as "niveau.beginner.label");
            return (
              <Link
                key={key}
                href={{ pathname: "/advisor", query: quizQuery(answers, steps, i) }}
                aria-label={`${t("edit", { question: tq(key).toLowerCase() })}: ${label}`}
                className="bg-surface flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#0B2A17] hover:bg-[#E6EFDA] hover:text-[#0B2A17]"
              >
                <span className="text-muted">{tq(key)}:</span>
                {label}
                <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2 10l1-3 6-6 2 2-6 6z" fill="none" stroke="#3C5A47" strokeWidth="1.4" />
                </svg>
              </Link>
            );
          })}
          {firstOpen !== -1 && (
            <Link
              href={{ pathname: "/advisor", query: quizQuery(answers, steps, firstOpen) }}
              className="bg-lime hover:bg-lime-hover px-3 py-2 text-[13px] font-semibold text-green-950 hover:text-green-950"
            >
              {tOutcome("personalize")}
            </Link>
          )}
        </div>
        <ShareLink
          shown={
            SITE_HOST +
            getPathname({
              locale,
              href: {
                pathname: "/advisor/[sport]/[profile]",
                params: {
                  sport: sportSlug(sport, locale),
                  profile: profileSlug({ niveau, stijl }),
                },
              },
            })
          }
        />
      </div>

      {matches.length > 0 ? (
        <ol className="flex flex-col">
          {matches.map((m, i) => (
            <li key={m.item.id}>
              <a
                href={m.item.href}
                className="flex flex-wrap items-center gap-x-5 gap-y-3.5 border-b border-[#EEF3EA] px-[clamp(20px,3.5vw,40px)] py-[18px] text-[#0B2A17] hover:bg-[#F8FBF5] hover:text-[#0B2A17]"
              >
                <span className="w-5 text-[14px] font-semibold text-[#56695C]" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="grid size-[88px] shrink-0 place-items-center bg-[#F4F7F0]">
                  {m.item.imageUrl ? (
                    <Image
                      src={m.item.imageUrl}
                      alt=""
                      width={74}
                      height={74}
                      className="size-[84%] object-contain mix-blend-multiply"
                    />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1.5">
                  <span className="text-muted text-[13px] font-medium tracking-[.8px] uppercase">
                    {[
                      m.item.brand.name,
                      ...m.item.levels.map((l) => tf(`level.${l}`)),
                      m.item.style ? tf(`style.${m.item.style}`) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <h3 className="text-[18px] font-semibold">{m.item.name}</h3>
                  <span className="text-muted text-[14px] text-pretty">{why(m)}</span>
                </div>
                <div className="ml-auto flex min-w-[150px] flex-col items-end gap-2">
                  <span className="text-[20px] font-bold text-[#05561F]">
                    {t("match", { percent: m.percent })}
                  </span>
                  <div className="h-[5px] w-[120px] bg-[#E3EBDD]" aria-hidden="true">
                    <div className="h-full bg-[#05561F]" style={{ width: `${m.percent}%` }} />
                  </div>
                  <span className="text-[14px] whitespace-nowrap">
                    {t.rich("from", {
                      price: formatPrice(m.item.price!, locale),
                      count: m.item.shopCount,
                      strong: (chunks) => <strong>{chunks}</strong>,
                    })}
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex flex-col items-start gap-4 px-[clamp(20px,3.5vw,40px)] py-10">
          <p className="text-muted max-w-[560px] text-[16px] leading-normal">{t("empty")}</p>
          <Slant
            as={Link}
            href="/rackets"
            className="bg-green-950 px-5 py-3 text-[14px] font-semibold text-white hover:text-white"
          >
            {t("emptyCta")}
          </Slant>
        </div>
      )}
      <p className="bg-surface text-muted px-[clamp(20px,3.5vw,40px)] py-4 text-[13px]">
        {t("disclosure")}
      </p>
    </div>
  );
}
