"use client";

import { useTranslations } from "next-intl";
import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import { ArrowIcon } from "@/components/ui/icons";
import { Slant } from "@/components/ui/slant";
import { Link } from "@/i18n/navigation";
import { sendContactMessage } from "@/lib/contact/actions";
import { CONTACT_SUBJECTS } from "@/lib/contact/config";

const FIELD =
  "border-[#8FA595] text-ink w-full border bg-white px-3.5 py-[13px] text-[16px] font-normal aria-[invalid=true]:border-warn";

/** Contact form (design/handoff/Info.dc.html). Shown only when e-mail sending is set up. */
export function ContactForm() {
  const t = useTranslations("info.pages.contact");
  const id = useId();
  const ref = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<"idle" | "sent" | "invalid" | "unavailable">("idle");
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      setState("invalid");
      form.querySelector<HTMLElement>(":invalid")?.focus();
      return;
    }
    const data = new FormData(form);
    startTransition(async () => {
      const result = await sendContactMessage(data).catch(() => ({
        status: "unavailable" as const,
      }));
      setState(result.status);
    });
  };

  if (state === "sent") {
    return (
      <p role="status" className="bg-surface px-8 py-7 text-[17px] font-medium">
        {t("form.sent")}
      </p>
    );
  }

  const invalid = state === "invalid";
  return (
    <form
      ref={ref}
      noValidate
      onSubmit={onSubmit}
      className="bg-surface flex flex-col gap-4 p-[clamp(20px,3vw,32px)]"
      aria-describedby={state !== "idle" ? `${id}-status` : undefined}
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4">
        <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
          {t("form.name")}
          <input
            name="name"
            required
            maxLength={100}
            autoComplete="name"
            aria-invalid={invalid || undefined}
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
          {t("form.email")}
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={invalid || undefined}
            className={FIELD}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
        {t("form.subject")}
        <select name="subject" defaultValue="product" className={FIELD}>
          {CONTACT_SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {t(`form.subjects.${s}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
        {t("form.message")}
        <textarea
          name="message"
          required
          rows={5}
          maxLength={5000}
          aria-invalid={invalid || undefined}
          className={`${FIELD} resize-y`}
        />
      </label>
      {/* Honeypot: hidden from people and assistive tech, bots tend to fill it. */}
      <label className="absolute -left-[9999px]" aria-hidden="true">
        {t("form.honeypot")}
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <p
        id={`${id}-status`}
        aria-live="polite"
        className="text-warn text-[14px] font-medium empty:hidden"
      >
        {invalid
          ? t("form.errorInvalid")
          : state === "unavailable"
            ? t("form.errorUnavailable")
            : ""}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted max-w-[380px] text-[13px] leading-normal">
          {t.rich("form.privacy", {
            link: (chunks) => (
              <Link href="/privacy" className="text-ink underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
        <Slant
          as="button"
          type="submit"
          size={8}
          disabled={pending}
          className="[&_[data-arrow]]:text-lime flex min-h-12 cursor-pointer items-center gap-2.5 bg-green-950 pr-[22px] pl-6 text-[15px] font-semibold text-white hover:bg-green-800 disabled:cursor-wait disabled:opacity-70"
        >
          <span>{pending ? t("form.sending") : t("form.send")}</span>
          <ArrowIcon />
        </Slant>
      </div>
    </form>
  );
}
