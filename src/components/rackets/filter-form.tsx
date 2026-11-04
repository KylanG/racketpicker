"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, type FormEvent } from "react";
import { CheckIcon } from "@/components/ui/icons";
import { filtersToQuery, parseFilters, type Facet } from "@/lib/catalog/racket-filters";
import { useFilterNavigation } from "./filter-context";

export type FilterOption = { value: string; label: string; count: number; checked: boolean };
export type FilterGroup = { facet: Facet; title: string; options: FilterOption[]; open: boolean };
export type FilterPanelData = {
  groups: FilterGroup[];
  deals: { checked: boolean; count: number };
  hideSoldOut: { checked: boolean; count: number };
  activeCount: number;
};

function formQuery(form: HTMLFormElement): string {
  const params: Record<string, string[]> = {};
  for (const [key, value] of new FormData(form)) (params[key] ??= []).push(String(value));
  return filtersToQuery(parseFilters(params));
}

function SwitchRow({
  name,
  value,
  label,
  checked,
  count,
  id,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  count: number;
  id: string;
}) {
  const t = useTranslations("rackets.filters");
  const disabled = count === 0 && !checked;
  return (
    <label
      htmlFor={id}
      className={`border-border flex items-center justify-between gap-3 border-b py-4 ${disabled ? "opacity-45" : "cursor-pointer"}`}
    >
      <span className="text-[15px] font-semibold">
        {label}
        <span className="sr-only"> ({t("optionCount", { count })})</span>
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        name={name}
        value={value}
        defaultChecked={checked}
        disabled={disabled}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="peer-focus-visible:outline-ink flex h-6 w-[42px] shrink-0 justify-start bg-[#C9D6C4] p-[3px] transition-colors duration-200 peer-checked:justify-end peer-checked:bg-green-950 peer-focus-visible:shadow-[0_0_0_6px_var(--color-lime)] peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-solid"
      >
        <span className="block size-[18px] bg-white" />
      </span>
    </label>
  );
}

/**
 * The filter form. Works without JavaScript (GET form with a submit button); with
 * JavaScript every change updates the URL right away and the button is not needed.
 */
export function FilterForm({
  data,
  idPrefix,
  action,
}: {
  data: FilterPanelData;
  idPrefix: string;
  /** Path of the current page, for the no-JS submit and "Wis alles". */
  action: string;
}) {
  const t = useTranslations("rackets.filters");
  const ref = useRef<HTMLFormElement>(null);
  const { navigate } = useFilterNavigation();

  // Inputs are uncontrolled (so a click shows at once and keeps focus); when the server
  // sends new state (e.g. after "Wis alles" or the back button) the boxes follow it.
  useEffect(() => {
    const form = ref.current;
    if (!form) return;
    const checked = new Set<string>();
    if (data.deals.checked) checked.add("deals=1");
    if (data.hideSoldOut.checked) checked.add("uitverkocht=verberg");
    for (const g of data.groups)
      for (const o of g.options) if (o.checked) checked.add(`${g.facet}=${o.value}`);
    for (const input of form.querySelectorAll<HTMLInputElement>("input[type=checkbox]")) {
      input.checked = checked.has(`${input.name}=${input.value}`);
    }
  }, [data]);

  const onChange = () => ref.current && navigate(formQuery(ref.current));
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate(formQuery(e.currentTarget));
  };

  return (
    <form ref={ref} method="get" action={action} onChange={onChange} onSubmit={onSubmit}>
      <div className="border-border flex items-center justify-between border-b pb-3.5">
        <h2 className="text-[17px] font-semibold">{t("title")}</h2>
        {data.activeCount > 0 && (
          <a
            href={action}
            onClick={(e) => {
              e.preventDefault();
              navigate("");
            }}
            className="text-[13px] font-medium text-green-800 underline hover:text-green-950"
          >
            {t("clearAll")}
          </a>
        )}
      </div>

      <SwitchRow
        id={`${idPrefix}-deals`}
        name="deals"
        value="1"
        label={t("onlyDeals")}
        checked={data.deals.checked}
        count={data.deals.count}
      />
      <SwitchRow
        id={`${idPrefix}-soldout`}
        name="uitverkocht"
        value="verberg"
        label={t("hideSoldOut")}
        checked={data.hideSoldOut.checked}
        count={data.hideSoldOut.count}
      />

      {data.groups.map((group) => (
        <details key={group.facet} open={group.open} className="border-border group border-b">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between py-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
            {group.title}
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              aria-hidden="true"
              className="transition-transform duration-200 group-open:rotate-180"
            >
              <path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </summary>
          <fieldset className="flex flex-col gap-0.5 pb-3.5">
            <legend className="sr-only">{group.title}</legend>
            {group.options.map((o) => {
              const id = `${idPrefix}-${group.facet}-${o.value}`;
              const disabled = o.count === 0 && !o.checked;
              return (
                <label
                  key={o.value}
                  htmlFor={id}
                  className={`flex min-h-10 items-center gap-2.5 py-1 text-[14px] ${disabled ? "opacity-40" : "cursor-pointer"}`}
                >
                  <input
                    id={id}
                    type="checkbox"
                    name={group.facet}
                    value={o.value}
                    defaultChecked={o.checked}
                    disabled={disabled}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="peer-focus-visible:outline-ink text-lime grid size-[18px] shrink-0 place-items-center border-[1.5px] border-[#9FB3A5] peer-checked:border-green-950 peer-checked:bg-green-950 peer-focus-visible:shadow-[0_0_0_6px_var(--color-lime)] peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-solid peer-checked:[&>svg]:opacity-100"
                  >
                    <CheckIcon className="opacity-0" />
                  </span>
                  <span className="flex-1">{o.label}</span>
                  <span className="text-muted-2 text-[13px]">
                    <span aria-hidden="true">{o.count}</span>
                    <span className="sr-only">({t("optionCount", { count: o.count })})</span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        </details>
      ))}

      <noscript>
        <button
          type="submit"
          className="mt-4 min-h-11 w-full bg-green-950 px-4 text-[14px] font-semibold text-white"
        >
          {t("apply")}
        </button>
      </noscript>
    </form>
  );
}
