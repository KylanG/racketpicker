"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { trackEvent } from "@/lib/analytics/events";
import { matchSuggestions, type SearchEntry } from "@/lib/catalog/search-match";

/**
 * Hero search with suggestions (combobox + listbox, ARIA 1.2). ↑ ↓ choose, Enter opens,
 * Esc closes. Uses the same matching as the search screen (RP-46).
 */
export function HeroSearch({ index }: { index: SearchEntry[] }) {
  const t = useTranslations("home");
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);

  const matches = useMemo(() => matchSuggestions(index, query), [index, query]);
  const open = focused && query.trim().length > 0;
  const activeId = open && active >= 0 && matches[active] ? `${id}-opt-${active}` : undefined;

  const go = (entry: SearchEntry) => {
    setFocused(false);
    trackEvent({ name: "search", params: { search_term: query.trim() } });
    router.push(entry.href);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const entry = matches[active] ?? matches[0];
    if (entry) go(entry);
    else setFocused(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocused(true);
      setActive((i) => Math.min(matches.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (event.key === "Escape") {
      if (open) event.preventDefault();
      setFocused(false);
      setActive(-1);
    }
  };

  return (
    <div className="relative mt-[22px] max-w-[420px]">
      <div className="rp-slant-focus">
        <form
          role="search"
          onSubmit={onSubmit}
          // The focus ring (on the wrapper) follows the slant.
          className="flex items-center bg-white py-2.5 pr-2.5 pl-5"
          style={{ clipPath: "polygon(0 0,100% 0,calc(100% - 10px) 100%,0 100%)" }}
        >
          <input
            type="search"
            role="combobox"
            aria-label={t("searchLabel")}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            autoComplete="off"
            enterKeyHint="search"
            value={query}
            placeholder={t("searchLabel")}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(-1);
              setFocused(true);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
            className="text-ink placeholder:text-muted w-0 min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none focus-visible:shadow-none focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          <button
            type="submit"
            aria-label={t("searchSubmit")}
            className="bg-lime hover:bg-lime-hover grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-green-950"
          >
            <svg data-arrow width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M4 10L10 4M5 4h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </form>
      </div>

      <div
        hidden={!open}
        className="shadow-menu text-ink absolute inset-x-0 top-[calc(100%+6px)] z-10 flex-col bg-white p-2 [&:not([hidden])]:flex"
      >
        <ul id={listId} role="listbox" aria-label={t("suggestions")}>
          {matches.map((entry, i) => (
            <li
              key={entry.id}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              // Keep focus in the input while clicking an option.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(entry)}
              onMouseEnter={() => setActive(i)}
              className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-[14px] ${
                i === active ? "bg-surface" : ""
              }`}
            >
              <span>{entry.name}</span>
              <span className="text-muted shrink-0">{entry.brand}</span>
            </li>
          ))}
        </ul>
        {matches.length === 0 && (
          <p className="text-muted px-3 py-2.5 text-[14px]">{t("noSuggestions")}</p>
        )}
      </div>
      <p aria-live="polite" className="sr-only">
        {open ? t("suggestionCount", { count: matches.length }) : ""}
      </p>
    </div>
  );
}
