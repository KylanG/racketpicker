import { useTranslations } from "next-intl";
import Image from "next/image";
import { Badge, Tag } from "@/components/ui/badge";
import { ArrowIcon, BellIcon } from "@/components/ui/icons";
import { Price } from "@/components/ui/price";
import { Slant } from "@/components/ui/slant";
import { discountPercent, sizeSummary, type ProductCardData } from "@/lib/catalog/product-card";
import { CardCompareToggle, CardFavToggle } from "./card-toggles";

/**
 * Product card for overviews, home deals and "Vergelijkbaar" (design/handoff/Rackets.dc.html).
 *
 * Accessibility: one stretched link on the title makes the whole card clickable; the
 * image is decorative (alt=""), the heart and compare toggle sit above the link, and the
 * CTA is a second link with a full accessible name ("Bekijk beste prijs voor …").
 */
export function ProductCard({
  product,
  priority = false,
  showCompare = false,
}: {
  product: ProductCardData;
  /** Load the image eagerly (first row above the fold). */
  priority?: boolean;
  /** Show the "Vergelijk" toggle (rackets overview, RP-28). */
  showCompare?: boolean;
}) {
  const t = useTranslations("productCard");
  const pct = product.inStock ? discountPercent(product.price, product.compareAt) : null;
  const sizes = sizeSummary(product.sizes);

  return (
    <article className="group border-border hover:shadow-card-hover relative flex flex-col border bg-white transition-shadow duration-200">
      <div className="bg-surface-2 relative aspect-square">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            className={`object-contain p-[8%] mix-blend-multiply ${product.inStock ? "" : "opacity-45"}`}
          />
        ) : (
          <span className="text-muted-2 absolute inset-0 grid place-items-center text-[13px]">
            {t("noImage")}
          </span>
        )}
        <span className="absolute top-3 left-3">
          {!product.inStock ? (
            <Badge variant="soldOut">{t("soldOut")}</Badge>
          ) : pct ? (
            <Badge variant="deal">{t("discount", { pct })}</Badge>
          ) : null}
        </span>
      </div>

      <div className="-mt-[52px] mr-1.5 mb-2 self-end">
        <CardFavToggle productId={product.id} label={t("save", { name: product.name })} />
      </div>

      <div className="flex flex-1 flex-col gap-2 px-[18px] pt-1.5">
        <p className="text-muted text-[13px] font-medium tracking-[0.8px] uppercase">
          {product.brand} · {product.sport}
        </p>
        <h3 className="text-[17px] leading-[1.25] font-semibold">
          <a
            href={product.href}
            className="text-ink after:absolute after:inset-0 after:content-[''] hover:text-green-800"
          >
            {product.name}
          </a>
        </h3>
        {product.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {product.tags.map((tag) => (
              <li key={tag}>
                <Tag>{tag}</Tag>
              </li>
            ))}
          </ul>
        )}
        {sizes && (
          <p className="text-muted text-[13px]">
            {sizes.kind === "fit"
              ? t("yourSizes", { sizes: sizes.sizes })
              : t("sizeRange", { min: sizes.min, max: sizes.max })}
          </p>
        )}
        <div className="mt-auto pt-1.5">
          {product.price != null && (
            <Price
              value={product.price}
              compareAt={pct ? product.compareAt : null}
              compareSrLabel={t("wasPrice")}
            />
          )}
        </div>
        <p
          className={`text-[13px] font-medium ${product.inStock ? "text-green-800" : "text-muted-2"}`}
        >
          {product.inStock ? t("shopsCompared", { count: product.shopCount }) : t("notInStock")}
        </p>
        {product.priceNote && <p className="text-muted-2 text-[12px]">{product.priceNote}</p>}
      </div>

      <Slant
        as="a"
        size={8}
        href={product.inStock ? product.href : `${product.href}#prijsalert`}
        aria-label={
          product.inStock
            ? t("viewBestPriceFor", { name: product.name })
            : t("stockAlertFor", { name: product.name })
        }
        className={`ease-rp relative z-10 mx-[18px] mt-4 flex min-h-11 items-center justify-between px-4 py-[13px] text-[14px] font-semibold transition-colors duration-300 ${
          product.inStock
            ? "[&_[data-arrow]]:text-lime bg-green-950 text-white hover:bg-green-800 hover:text-white"
            : "bg-surface text-ink hover:bg-surface-hover"
        } ${showCompare ? "" : "mb-[18px]"}`}
      >
        {product.inStock ? t("viewBestPrice") : t("stockAlert")}
        {product.inStock ? <ArrowIcon /> : <BellIcon className="text-green-950" />}
      </Slant>

      {showCompare && (
        <CardCompareToggle
          productId={product.id}
          text={t("compare")}
          label={t("compareName", { name: product.name })}
        />
      )}
    </article>
  );
}

/** Responsive card grid: 1 column on phones, then up to 2/3/4 per row (RP-27 "per rij"). */
export function ProductGrid({
  children,
  perRow = 3,
}: {
  children: React.ReactNode;
  perRow?: 2 | 3 | 4;
}) {
  const cols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
  };
  return <div className={`grid grid-cols-1 gap-5 ${cols[perRow]}`}>{children}</div>;
}
