"use client";

import { useTranslations } from "next-intl";
import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import { ArrowIcon } from "@/components/ui/icons";
import { Slant } from "@/components/ui/slant";
import { Link } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics/events";
import { subscribeToNewsletter } from "@/lib/newsletter/actions";
import { isValidEmail } from "@/lib/newsletter/email";

type FormError = "errorInvalid" | "errorUnavailable" | null;

function Check({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <path d="M2.5 8.5l3.5 3.5L13.5 4" fill="none" stroke="var(--color-lime)" strokeWidth="2" />
    </svg>
  );
}

/** Footer newsletter sign-up (double opt-in; sending follows in RP-32). */
export function NewsletterForm() {
  const t = useTranslations("footer");
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<FormError>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputId = `${id}-email`;
  const errorId = `${id}-error`;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = inputRef.current?.value ?? "";
    if (!isValidEmail(email)) {
      setError("errorInvalid");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await subscribeToNewsletter(email.trim()).catch(() => null);
      if (result?.status === "success") {
        setDone(true);
        trackEvent({ name: "sign_up", params: { method: "newsletter" } });
      } else setError(result?.status === "invalid" ? "errorInvalid" : "errorUnavailable");
    });
  };

  if (done) {
    return (
      <Slant
        size={12}
        role="status"
        className="flex items-center gap-3 bg-[rgb(200_230_58/0.12)] px-[22px] py-[18px] text-[16px] font-medium text-white"
      >
        <Check size={20} />
        {t("success")}
      </Slant>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex max-w-[560px] flex-col gap-3.5">
      {/* The focus ring goes around the whole bar instead of the bare input. */}
      <Slant
        size={12}
        className="has-[input:focus-visible]:outline-ink flex items-center gap-3 bg-white py-2 pr-2 pl-6 has-[input:focus-visible]:shadow-[0_0_0_6px_var(--color-lime)] has-[input:focus-visible]:outline-[3px] has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-solid"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="var(--color-green-800)"
          strokeWidth="1.7"
          aria-hidden="true"
          className="shrink-0"
        >
          <rect x="2.5" y="4.5" width="15" height="11" />
          <path d="M3 5l7 6 7-6" />
        </svg>
        <label htmlFor={inputId} className="sr-only">
          {t("emailLabel")}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder={t("emailPlaceholder")}
          aria-invalid={error === "errorInvalid" ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onInput={() => error === "errorInvalid" && setError(null)}
          className="text-ink placeholder:text-muted w-0 min-w-0 flex-1 border-0 bg-transparent py-3 text-[16px] font-medium outline-none focus-visible:shadow-none focus-visible:outline-none"
        />
        <Slant
          as="button"
          type="submit"
          size={8}
          disabled={pending}
          className="bg-lime hover:bg-lime-hover flex min-h-12 shrink-0 cursor-pointer items-center gap-2.5 pr-5 pl-[22px] text-[15px] font-semibold text-green-950 transition-colors duration-300 disabled:cursor-wait disabled:opacity-70"
        >
          <span>{t("subscribe")}</span>
          <ArrowIcon size={12} />
        </Slant>
      </Slant>

      {/* Errors and progress are announced without moving focus. */}
      <p id={errorId} aria-live="polite" className="text-lime text-[14px] font-medium empty:hidden">
        {error ? t(error) : pending ? <span className="sr-only">{t("subscribing")}</span> : null}
      </p>

      <ul className="flex flex-wrap gap-[18px] text-[14px] text-white">
        {(["perkWeekly", "perkReal", "perkCancel"] as const).map((key) => (
          <li key={key} className="flex items-center gap-2">
            <Check />
            {t(key)}
          </li>
        ))}
      </ul>
      <p className="text-on-dark text-[13px] leading-normal">
        {t.rich("confirmNote", {
          link: (chunks) => (
            <Link href="/privacy" className="text-white underline hover:text-white">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}
