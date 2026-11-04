import type { Locale } from "@/i18n/routing";
import { formatPrice } from "@/lib/format/price";

/**
 * Price with an optional struck-through comparison price.
 * Per the Omnibus rule the comparison is the lowest price of the 30 days before the
 * reduction; an MSRP may only be shown with `compareLabel` (e.g. "adviesprijs").
 * `compareSrLabel` names the struck-through price for screen readers.
 */
export function Price({
  value,
  compareAt,
  compareLabel,
  compareSrLabel,
  locale = "nl",
  size = "md",
}: {
  value: number;
  compareAt?: number | null;
  compareLabel?: string;
  compareSrLabel?: string;
  locale?: Locale;
  size?: "md" | "lg";
}) {
  const showCompare = compareAt != null && compareAt > value;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2.5">
      <span
        className={size === "lg" ? "text-[40px] leading-none font-bold" : "text-[22px] font-bold"}
      >
        {formatPrice(value, locale)}
      </span>
      {showCompare && (
        <span className="text-muted-2 text-[14px]">
          {compareLabel && <span className="mr-1">{compareLabel}</span>}
          {compareSrLabel && <span className="sr-only">{compareSrLabel}: </span>}
          <s>{formatPrice(compareAt, locale)}</s>
        </span>
      )}
    </span>
  );
}
