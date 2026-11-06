"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * "Deelbare link" with a copy button (RP-50). `shown` is the page URL without protocol
 * and query; the copy button takes the full current URL, answers included.
 */
export function ShareLink({ shown }: { shown: string }) {
  const t = useTranslations("advisor.result");
  const [copied, setCopied] = useState(false);
  return (
    <div className="text-muted flex flex-wrap items-center gap-2.5 text-[13px]">
      <span>{t("share")}</span>
      <code className="bg-surface px-2 py-[5px] font-mono text-[13px] font-medium break-all text-[#0B2A17]">
        {shown}
      </code>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(window.location.href).then(
            () => setCopied(true),
            () => setCopied(false),
          );
        }}
        className="min-h-11 cursor-pointer text-[13px] font-semibold text-[#05561F]"
        aria-live="polite"
      >
        {copied ? t("copied") : t("copy")}
      </button>
    </div>
  );
}
