import type { NormalizedFeedItem } from "./types";

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
