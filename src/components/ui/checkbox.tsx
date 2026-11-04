import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { CheckIcon } from "./icons";

/**
 * Filter checkbox from the handover: 18px square box, dark green when checked with a
 * lime tick, optional result count on the right, 40% opacity when disabled (0 results).
 * A real <input> underneath, so filters also work in a plain <form> without JS.
 */
export function Checkbox({
  children,
  count,
  className = "",
  ...input
}: { children: ReactNode; count?: number } & Omit<ComponentPropsWithoutRef<"input">, "type">) {
  return (
    <label
      className={`group flex min-h-10 cursor-pointer items-center gap-2.5 py-1 text-[14px] has-disabled:cursor-not-allowed has-disabled:opacity-40 ${className}`}
    >
      <input type="checkbox" className="peer sr-only" {...input} />
      <span className="border-muted-2 text-lime peer-focus-visible:outline-ink grid size-[18px] shrink-0 place-items-center border-[1.5px] bg-white peer-checked:border-green-950 peer-checked:bg-green-950 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 [&_svg]:opacity-0 peer-checked:[&_svg]:opacity-100">
        <CheckIcon />
      </span>
      <span className="flex-1">{children}</span>
      {count !== undefined && <span className="text-muted-2 text-[13px]">{count}</span>}
    </label>
  );
}

/**
 * Size picker option (shoe sizes): 52px square, radio semantics. Selected = dark green.
 * `note` shows e.g. "3 winkels" or "laatste".
 */
export function SizeOption({
  children,
  note,
  ...input
}: { children: ReactNode; note?: ReactNode } & Omit<ComponentPropsWithoutRef<"input">, "type">) {
  return (
    <label className="cursor-pointer has-disabled:cursor-not-allowed has-disabled:opacity-40">
      <input type="radio" className="peer sr-only" {...input} />
      <span className="border-border peer-focus-visible:outline-ink hover:border-border-strong flex size-[52px] flex-col items-center justify-center border bg-white text-[15px] font-semibold peer-checked:border-green-950 peer-checked:bg-green-950 peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2">
        {children}
        {note && <span className="text-[11px] font-medium opacity-75">{note}</span>}
      </span>
    </label>
  );
}
