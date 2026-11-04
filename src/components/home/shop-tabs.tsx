"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { ToggleTabs } from "@/components/ui/toggle-tabs";

/** "Waar wil je beginnen?": switch between the sport and category cards. */
export function ShopTabs({
  title,
  bySport,
  byCategory,
}: {
  title: ReactNode;
  bySport: ReactNode;
  byCategory: ReactNode | null;
}) {
  const t = useTranslations("home");
  const [tab, setTab] = useState<"sport" | "category">("sport");

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        {title}
        {byCategory && (
          <ToggleTabs
            label={t("shopTabs")}
            value={tab}
            onChange={setTab}
            items={[
              { value: "sport", label: t("shopBySport") },
              { value: "category", label: t("shopByCategory") },
            ]}
          />
        )}
      </div>
      {tab === "sport" || !byCategory ? bySport : byCategory}
    </>
  );
}
