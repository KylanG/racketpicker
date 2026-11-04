import { routing, type Locale } from "./routing";

export type MatchedPathname = {
  /** Internal route name, e.g. "/rackets/[sport]". */
  pathname: keyof typeof routing.pathnames;
  params: Record<string, string>;
};

const escape = (s: string) => s.replace(/[.*+?^${}()|\\]/g, "\\$&");

/**
 * Maps a public URL path of a market ("/es/raquetas/padel") back to its internal route
 * and params ({ pathname: "/rackets/[sport]", params: { sport: "padel" } }), so the same
 * page can be linked in another market. Returns null for paths outside the route list.
 *
 * Also accepts the internal form ("/es/rackets/padel"): after the proxy rewrite, Next's
 * usePathname() returns that during server rendering.
 */
export function matchLocalizedPathname(path: string, locale: Locale): MatchedPathname | null {
  const prefix = `/${locale}`;
  let rest =
    path === prefix ? "/" : path.startsWith(`${prefix}/`) ? path.slice(prefix.length) : null;
  if (rest === null) return null;
  if (rest.length > 1) rest = rest.replace(/\/+$/, "");

  const entries = Object.entries(routing.pathnames);
  const candidates: [string, string][] = [
    ...entries.map(([internal, external]): [string, string] => [
      internal,
      typeof external === "string" ? external : external[locale],
    ]),
    ...entries.map(([internal]): [string, string] => [internal, internal]),
  ];

  for (const [internal, pattern] of candidates) {
    const names: string[] = [];
    const source = pattern
      .split(/(\[[^\]]+\])/)
      .map((part) => {
        const name = /^\[([^\]]+)\]$/.exec(part)?.[1];
        if (!name) return escape(part);
        names.push(name);
        return "([^/]+)";
      })
      .join("");
    const match = new RegExp(`^${source}$`).exec(rest);
    if (!match) continue;
    const params = Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(match[i + 1]!)]));
    return { pathname: internal as MatchedPathname["pathname"], params };
  }
  return null;
}
