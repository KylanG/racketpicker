/**
 * Home page season (design/handoff/README.md, "Homepagina"). Switch `ACTIVE_SEASON` per
 * season; texts live in messages under `home.season.<key>`.
 *
 * - blackFriday: deals first, then the CTA blocks, then "Waar wil je beginnen?". Without
 *   featured deals (the first 30 days of price history, RP-87) the price alert takes the
 *   deals' place, with the season's own text.
 * - regular:     "Waar wil je beginnen?" first
 */
export type SeasonKey = "blackFriday" | "regular";

export type HomeBlock = "deals" | "ctas" | "shop" | "alert";

type Season = {
  /** Hero image on the right, or null for a text-only hero. */
  image: { src: string; width: number; height: number } | null;
  blocks: HomeBlock[];
  /** Blocks to use while there are no featured deals; defaults to `blocks`. */
  blocksWithoutDeals?: HomeBlock[];
};

export const SEASONS: Record<SeasonKey, Season> = {
  blackFriday: {
    image: { src: "/seasons/black-friday.webp", width: 1200, height: 649 },
    blocks: ["deals", "ctas", "shop"],
    blocksWithoutDeals: ["alert", "ctas", "shop"],
  },
  regular: {
    image: null,
    blocks: ["shop", "deals", "ctas"],
  },
};

export const ACTIVE_SEASON: SeasonKey = "blackFriday";
