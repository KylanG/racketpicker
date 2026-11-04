"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { ToggleTabs } from "@/components/ui/toggle-tabs";

type Tab = "all" | string;

/**
 * Sport filter for the featured deals. Cards are rendered on the server and passed in
 * per sport; the tabs only show sports that have deals.
 */
export function DealsGrid({
  sports,
  cards,
  header,
}: {
  sports: { key: string; label: string }[];
  cards: { id: string; sport: string; node: ReactNode }[];
  header: ReactNode;
}) {
  const t = useTranslations("home");
  const [tab, setTab] = useState<Tab>("all");
  const visible = tab === "all" ? cards : cards.filter((c) => c.sport === tab);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        {header}
        {sports.length > 1 && (
          <ToggleTabs
            label={t("dealsFilter")}
            value={tab}
            onChange={setTab}
            items={[
              { value: "all", label: t("dealsAll") },
              ...sports.map((s) => ({ value: s.key, label: s.label })),
            ]}
          />
        )}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
        {visible.map((c) => (
          <div key={c.id} className="contents">
            {c.node}
          </div>
        ))}
      </div>
    </>
  );
}
