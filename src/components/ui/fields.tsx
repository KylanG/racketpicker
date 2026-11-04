import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { SearchIcon } from "./icons";
import { Slant } from "./slant";

/** Text field with a visible label and optional hint/error (aria-describedby). */
export function TextField({
  label,
  hint,
  error,
  className = "",
  ...input
}: { label: ReactNode; hint?: ReactNode; error?: ReactNode } & ComponentPropsWithoutRef<"input">) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[14px] font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className="border-border-strong placeholder:text-muted aria-invalid:border-warn min-h-11 border bg-white px-3.5 py-2.5 text-[15px]"
        {...input}
      />
      {hint && (
        <span id={hintId} className="text-muted-2 text-[13px]">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert" className="text-warn text-[13px] font-medium">
          {error}
        </span>
      )}
    </div>
  );
}

/**
 * Slanted white search bar (14px) with magnifier and a lime "Zoeken" button.
 * Plain GET form by default, so it works without JS; the search overlay (RP-46)
 * adds suggestions on top.
 */
export function SearchBar({
  label,
  placeholder,
  submitLabel,
  action,
  name = "zoek",
  defaultValue,
  size = "md",
}: {
  label: string;
  placeholder: string;
  submitLabel: string;
  action: string;
  name?: string;
  defaultValue?: string;
  size?: "md" | "lg";
}) {
  return (
    <Slant
      as="form"
      size={14}
      role="search"
      action={action}
      className={`text-ink flex w-full items-center gap-3 bg-white pl-5 ${size === "lg" ? "min-h-16" : "min-h-14"}`}
    >
      <SearchIcon className="shrink-0 text-green-800" />
      <label className="sr-only" htmlFor={`search-${name}`}>
        {label}
      </label>
      <input
        id={`search-${name}`}
        type="search"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        className={`placeholder:text-muted w-0 min-w-0 flex-1 bg-transparent py-3 outline-none ${size === "lg" ? "text-[20px]" : "text-[17px]"}`}
      />
      <Slant
        as="button"
        type="submit"
        size={8}
        className="bg-lime hover:bg-lime-hover m-1.5 min-h-11 shrink-0 cursor-pointer px-5 font-semibold text-green-950 transition-colors"
      >
        {submitLabel}
      </Slant>
    </Slant>
  );
}
