import type { FeedItemKind, NormalizedFeedItem } from "./types";

/** Words that mean "this is a racket" (NL, EN, ES). */
const RACKET = /\b(padel\s*racket|padelracket|racket|raquet|pala|bat)s?\b/;

/** Accessories and other products that mention padel/rackets but are not a racket. */
const NOT_A_RACKET =
  /\b(over\s*grip|overgrip|grip|grips|hoes|cover|tas|bag|backpack|rugzak|bal|ballen|ball|balls|bote|schoen|schoenen|shoe|shoes|zapatilla|protector|bescherm\w*|tape|string|polsband|wristband|sok|sokken|socks|shirt|short|shorts|rok|skirt|jurk|pet|cap|set|pack|net|paal|tafel|hanger|houder|holder|keychain|sleutelhanger)\b/;

function haystack(item: Pick<NormalizedFeedItem, "title" | "category">): string {
  return `${item.title} ${item.category ?? ""}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * True when a feed item is a padel racket. Used for general sports shops (e.g. Daka)
 * whose feeds contain everything; padel-only shops can use filter 'all'.
 */
export function isPadelRacket(item: Pick<NormalizedFeedItem, "title" | "category">): boolean {
  const text = haystack(item);
  const isPadel = /\bpadel/.test(text) || /\bpala\b/.test(text);
  if (!isPadel) return false;
  // Accessories are checked on the title only: a category like "Padel > Rackets & Tassen"
  // should not reject a racket.
  const title = haystack({ title: item.title, category: null });
  if (NOT_A_RACKET.test(title)) return false;
  return RACKET.test(text);
}

/** Words that mean "this is a bag" (EN, NL, ES), including backpacks and trolleys. */
const BAG =
  /\b(bags?|racket\s*bag|racketbag|backpacks?|rugzak|tas|tassen|padeltas|trolley|thermo\s*bag|thermobag|mochila|paletero|bolsa|bolso)\b/;

/** Multipacks and things that hold something else than rackets. */
const NOT_A_BAG =
  /\b(pack|bundle|\d+\s*x|shoe\s*bag|schoenentas|ball\s*bag|bal(len)?tas|keychain|sleutelhanger|neceser|toilettas|toiletry|wash\s*bag|gymsack|gym\s*sack|cover|d\s*case)\b/;

/** Kids' and junior versions: not on the site (the bol discovery skips them too). */
const JUNIOR = /\b(kids?|junior|jr|nino|nina|boy|girl)\b/;

/** A racket and a bag sold together ("racket + bag", "racket with … bag"). */
const RACKET_WITH_BAG =
  /\b(racket|racquet|pala)\b.*(\+|\bwith\b).*\b(bag|backpack)\b|\bbag\b.*\+.*\b(racket|pala)\b/;

/** True when a feed item is a padel bag: racket bag, backpack or trolley. */
export function isPadelBag(item: Pick<NormalizedFeedItem, "title" | "category">): boolean {
  const text = haystack(item);
  if (!/\bpadel/.test(text)) return false;
  const title = haystack({ title: item.title, category: null });
  const category = haystack({ title: "", category: item.category });
  if (NOT_A_BAG.test(title) || RACKET_WITH_BAG.test(title)) return false;
  if (/\b(bundles?|packs?)\b/.test(category)) return false;
  // "(Racket Bag)" names the bag in the title; a category "Padel > Bags" is enough too.
  return BAG.test(title) || /\bbags?\b/.test(category);
}

export const RACKET_KIND: FeedItemKind = { category: "rackets", productType: null };
export const BAG_KIND: FeedItemKind = { category: "accessories", productType: "bags" };

/**
 * What a feed item is, for feeds that bring more than rackets (RP-91). Bags are checked
 * first: "Racket Bag" names a racket too. Null: not something we import.
 */
export function classifyItem(
  item: Pick<NormalizedFeedItem, "title" | "category">,
): FeedItemKind | null {
  if (JUNIOR.test(haystack({ title: item.title, category: null }))) return null;
  if (isPadelBag(item)) return BAG_KIND;
  if (isPadelRacket(item)) return RACKET_KIND;
  return null;
}
