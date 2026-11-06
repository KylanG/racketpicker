"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { HeartIcon } from "@/components/ui/icons";
import { Slant } from "@/components/ui/slant";
import { Link } from "@/i18n/navigation";
import type { ProductCardData } from "@/lib/catalog/product-card";
import { useFavorites } from "@/lib/favorites/store";

/**
 * Saved products (Favorieten.dc.html; RP-53) with today's prices: the page passes every
 * published product, this keeps the saved ones in saved order. Saved products that are no
 * longer published are left out (with a short note).
 */
export function FavoritesGrid({ products }: { products: ProductCardData[] }) {
  const t = useTranslations("favorites");
  const { ids, clear } = useFavorites();
  // The server cannot read localStorage: render nothing until the browser has, instead of
  // flashing the empty state.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const byId = new Map(products.map((p) => [p.id, p]));
  const saved = ids.map((id) => byId.get(id)).filter((p): p is ProductCardData => Boolean(p));
  const gone = ids.length - saved.length;

  if (!mounted) return <div className="min-h-[320px]" aria-hidden="true" />;
  if (saved.length === 0) {
    return (
      <div className="bg-surface flex flex-col items-center gap-4 px-8 py-14 text-center">
        <span className="text-green-800" aria-hidden="true">
          <HeartIcon size={36} />
        </span>
        <h2 className="text-[22px] font-semibold">{t("emptyTitle")}</h2>
        <p className="text-muted max-w-[420px] text-[16px] leading-normal">{t("emptyText")}</p>
        <Slant
          as={Link}
          href="/rackets"
          className="bg-lime hover:bg-lime-hover mt-1.5 px-6 py-3.5 text-[15px] font-semibold text-green-950 hover:text-green-950"
        >
          {t("emptyCta")}
        </Slant>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-[15px]">
          {t.rich("count", { count: saved.length, b: (c) => <strong>{c}</strong> })}
        </p>
        <button
          type="button"
          onClick={clear}
          className="min-h-11 cursor-pointer text-[14px] font-medium underline"
        >
          {t("clear")}
        </button>
      </div>
      {gone > 0 && <p className="text-muted text-[14px]">{t("gone", { count: gone })}</p>}
      <ul className="grid grid-cols-1 gap-5 min-[560px]:grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
        {saved.map((p) => (
          <li key={p.id} className="flex [&>*]:flex-1">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </>
  );
}
