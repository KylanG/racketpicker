"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type PointerEvent } from "react";
import { Reveal } from "@/components/ui/reveal";
import { Slant } from "@/components/ui/slant";
import { intlLocale, type Locale } from "@/i18n/routing";
import {
  addDays,
  chartPaths,
  HISTORY_RANGES,
  historyStats,
  inRange,
  MIN_HISTORY_DAYS,
  RANGE_DAYS,
  yAxis,
  type HistoryPoint,
  type HistoryRange,
} from "@/lib/catalog/price-history-calc";
import { formatPrice } from "@/lib/format/price";

/** "Prijshistorie": stat tiles and a line chart of the daily lowest price (RP-24). */
export function PriceHistory({
  points,
  today,
  trackedDays,
}: {
  points: HistoryPoint[];
  today: string;
  trackedDays: number;
}) {
  const t = useTranslations("product.history");
  const locale = useLocale() as Locale;
  const [range, setRange] = useState<HistoryRange>("90d");
  const [hover, setHover] = useState<number | null>(null);
  const price = (n: number) => formatPrice(n, locale);
  const date = (d: string) =>
    new Intl.DateTimeFormat(intlLocale[locale], {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${d}T12:00:00Z`));

  const hasHistory = points.length >= MIN_HISTORY_DAYS;
  const start = addDays(today, -(RANGE_DAYS[range] - 1));
  const series = inRange(points, range, today);
  const stats = historyStats(series);
  const axis = stats ? yAxis(stats.lowest, stats.highest) : null;
  const paths = axis ? chartPaths(series, start, today, axis.min, axis.max) : null;

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (!paths || paths.coords.length === 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 1000;
    let nearest = 0;
    paths.coords.forEach((c, i) => {
      if (Math.abs(c.x - x) < Math.abs(paths.coords[nearest].x - x)) nearest = i;
    });
    if (nearest !== hover) setHover(nearest);
  }

  const hov = hover != null && paths?.coords[hover] ? paths.coords[hover] : null;
  const hovPoint = hover != null ? series[hover] : null;
  const xp = hov ? hov.x / 10 : 0;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Reveal>
          <h2 className="text-[clamp(26px,2.4vw,34px)] font-semibold tracking-[-0.3px]">
            {t("title")}
          </h2>
        </Reveal>
        {hasHistory && (
          <div role="group" aria-label={t("rangeLabel")} className="flex gap-2">
            {HISTORY_RANGES.map((r) => (
              <Slant
                as="button"
                key={r}
                type="button"
                aria-pressed={r === range}
                onClick={() => {
                  setRange(r);
                  setHover(null);
                }}
                className={`min-h-11 cursor-pointer px-4 text-[14px] font-medium ${
                  r === range ? "bg-[#0B2A17] text-white" : "bg-surface text-[#0B2A17]"
                }`}
              >
                {t(`range.${r}`)}
              </Slant>
            ))}
          </div>
        )}
      </div>

      {hasHistory && stats && axis && paths ? (
        <>
          <Reveal stagger className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
            {(
              [
                ["now", stats.now, "text-green-800"],
                ["lowest", stats.lowest, "text-[#0B2A17]"],
                ["average", stats.average, "text-[#0B2A17]"],
                ["highest", stats.highest, "text-[#0B2A17]"],
              ] as const
            ).map(([k, v, color]) => (
              <div key={k} className="bg-surface flex flex-col gap-1 px-5 py-[18px]">
                <span className="text-muted text-[13px]">{t(`stats.${k}`)}</span>
                <span className={`text-[24px] font-bold ${color}`}>{price(v)}</span>
              </div>
            ))}
          </Reveal>

          <Reveal>
            <p className="sr-only">
              {t("summary", {
                from: date(series[0].date),
                lowest: price(stats.lowest),
                highest: price(stats.highest),
                now: price(stats.now),
              })}
            </p>
            <div
              aria-hidden="true"
              className="border-border relative h-[300px] touch-pan-y border-b border-l"
              onPointerMove={onMove}
              onPointerDown={onMove}
              onPointerLeave={() => setHover(null)}
            >
              {axis.ticks.map((v) => (
                <div
                  key={v}
                  className="absolute inset-x-0 border-t border-dashed border-[#E3EBDD]"
                  style={{ bottom: `${((v - axis.min) / (axis.max - axis.min)) * 100}%` }}
                >
                  <span className="text-muted-2 absolute -top-2.5 left-2 bg-white px-1.5 py-px text-[13px]">
                    {price(v)}
                  </span>
                </div>
              ))}
              <svg
                viewBox="0 0 1000 300"
                preserveAspectRatio="none"
                className="absolute inset-0 size-full overflow-visible"
              >
                <path d={paths.area} fill="#C8E63A" fillOpacity=".22" />
                <path
                  d={paths.line}
                  fill="none"
                  stroke="#05561F"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                />
              </svg>
              {hov && hovPoint && (
                <>
                  <div
                    className="pointer-events-none absolute inset-y-0 border-l border-[#033A19]"
                    style={{ left: `${xp}%` }}
                  />
                  <div
                    className="border-lime pointer-events-none absolute -mt-1.5 -ml-1.5 size-3 rounded-full border-2 bg-green-950"
                    style={{ left: `${xp}%`, top: `${hov.y / 3}%` }}
                  />
                  <div
                    className="pointer-events-none absolute -mt-14 flex flex-col bg-green-950 px-3 py-2 text-[13px] whitespace-nowrap text-white"
                    style={{
                      left: `${xp}%`,
                      top: `${hov.y / 3}%`,
                      transform:
                        xp > 80 ? "translateX(-100%)" : xp < 20 ? "none" : "translateX(-50%)",
                    }}
                  >
                    <strong className="text-[15px]">{price(hovPoint.price)}</strong>
                    <span className="text-[#B7CBBC]">{date(hovPoint.date)}</span>
                  </div>
                </>
              )}
            </div>
            <div className="text-muted-2 mt-3 flex justify-between text-[13px]">
              <span>{date(start)}</span>
              <span>{t("today")}</span>
            </div>
          </Reveal>
        </>
      ) : (
        <Reveal className="bg-surface flex flex-col items-start gap-2.5 px-8 py-10">
          <h3 className="text-[18px] font-semibold">{t("emptyTitle")}</h3>
          <p className="text-muted max-w-[560px] text-[15px] leading-[1.55]">
            {trackedDays > 0 ? t("emptyText", { days: trackedDays }) : t("emptyTextNew")}
          </p>
          <Slant
            as="a"
            href="#alert"
            className="mt-1.5 bg-green-950 px-[18px] py-3 text-[14px] font-semibold text-white hover:bg-green-800 hover:text-white"
          >
            {t("emptyCta")}
          </Slant>
        </Reveal>
      )}
    </>
  );
}
