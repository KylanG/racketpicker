import type { ReactNode } from "react";
import { CloseIcon } from "./icons";
import { Slant } from "./slant";

/**
 * Small labels from the handover.
 * - deal:    "-18%" on dark green with lime text (5px slant)
 * - soldOut: "Uitverkocht" on white with a soft shadow (5px slant)
 * - best:    "Beste deal" on lime (5px slant)
 * - tag:     level / style / weight on product cards (flat, no slant)
 */
const BADGES = {
  deal: "bg-green-950 px-2.5 py-[5px] font-semibold text-lime",
  soldOut: "bg-white px-2.5 py-[5px] font-semibold text-ink shadow-[0_2px_8px_rgb(0_30_10/0.12)]",
  best: "bg-lime px-2.5 py-[5px] font-semibold text-green-950",
} as const;

export function Badge({
  variant,
  children,
}: {
  variant: keyof typeof BADGES;
  children: ReactNode;
}) {
  return (
    <Slant
      as="span"
      size={5}
      className={`inline-flex text-[13px] leading-tight ${BADGES[variant]}`}
    >
      {children}
    </Slant>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="bg-surface inline-flex px-2 py-[3px] text-[13px]">{children}</span>;
}

/** Active filter with ×. `label` is read out with the remove action (e.g. "Verwijder filter"). */
export function FilterChip({
  children,
  removeLabel,
  onRemove,
  href,
}: {
  children: ReactNode;
  removeLabel: string;
  onRemove?: () => void;
  href?: string;
}) {
  const className =
    "inline-flex min-h-9 items-center gap-2 bg-surface px-3 py-2 text-[13px] font-medium text-ink hover:bg-surface-hover";
  const content = (
    <>
      {children}
      <CloseIcon />
      <span className="sr-only">{removeLabel}</span>
    </>
  );
  return href ? (
    <Slant as="a" size={5} href={href} className={className}>
      {content}
    </Slant>
  ) : (
    <Slant as="button" size={5} type="button" onClick={onRemove} className={className}>
      {content}
    </Slant>
  );
}
