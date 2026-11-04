/**
 * Home page season (design/handoff/README.md, "Homepagina"). Switch `ACTIVE_SEASON` per
 * season; texts live in messages under `home.season.<key>`.
 *
 * - blackFriday: deals first, then the CTA blocks, then "Waar wil je beginnen?"
 * - regular:     "Waar wil je beginnen?" first
 */
export type SeasonKey = "blackFriday" | "regular";

export type HomeBlock = "deals" | "ctas" | "shop";

type Season = {
  /** Hero image on the right, or null for a text-only hero. */
  image: { src: string; width: number; height: number } | null;
  blocks: HomeBlock[];
};

export const SEASONS: Record<SeasonKey, Season> = {
  blackFriday: {
    image: { src: "/seasons/black-friday.webp", width: 1200, height: 649 },
    blocks: ["deals", "ctas", "shop"],
  },
  regular: {
    image: null,
    blocks: ["shop", "deals", "ctas"],
  },
};

export const ACTIVE_SEASON: SeasonKey = "blackFriday";
