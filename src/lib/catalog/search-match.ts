/** One entry of the search index: a product (later also brands and sports, RP-46). */
export type SearchEntry = { id: string; name: string; brand: string; href: string };

export const MAX_SUGGESTIONS = 6;

const normalize = (s: string) =>
  s.toLocaleLowerCase("nl").normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

/**
 * Suggestions while typing: every word of the query must occur in "brand name"; matches
 * at the start of the name rank first. Shared by the hero search and the search screen.
 */
export function matchSuggestions(
  index: SearchEntry[],
  query: string,
  max = MAX_SUGGESTIONS,
): SearchEntry[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return index
    .map((entry) => {
      const name = normalize(entry.name);
      const haystack = `${normalize(entry.brand)} ${name}`;
      if (!words.every((w) => haystack.includes(w))) return null;
      const at = name.indexOf(words[0]!);
      return { entry, rank: at < 0 ? 99 : at };
    })
    .filter((x): x is { entry: SearchEntry; rank: number } => x !== null)
    .sort((a, b) => a.rank - b.rank || a.entry.name.localeCompare(b.entry.name, "nl"))
    .slice(0, max)
    .map((x) => x.entry);
}
