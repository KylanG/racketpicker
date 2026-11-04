import type { ReactNode } from "react";

/**
 * Accordion item (FAQ, mobile menu) on native <details>/<summary>: keyboard and
 * screenreader support built in, works without JS, and content is in the HTML for SEO.
 */
export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  tone = "light",
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  tone?: "light" | "dark";
}) {
  const line = tone === "dark" ? "border-white/15" : "border-border";
  return (
    <details open={defaultOpen} className={`group border-b ${line}`}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <span
          aria-hidden="true"
          className="relative size-4 shrink-0 before:absolute before:inset-x-0 before:top-1/2 before:h-[1.8px] before:-translate-y-1/2 before:bg-current after:absolute after:inset-y-0 after:left-1/2 after:w-[1.8px] after:-translate-x-1/2 after:bg-current after:transition-transform after:duration-300 group-open:after:scale-y-0"
        />
      </summary>
      <div className="text-ink-2 pb-5 text-[16px] leading-[1.6]">{children}</div>
    </details>
  );
}
