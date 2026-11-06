"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  activeSteps,
  currentStep,
  isComplete,
  parseAnswers,
  profileSlug,
  quizQuery,
  stepOptions,
  type Answers,
} from "@/lib/advisor/questions";
import { sportSlug, type SportKey } from "@/lib/catalog/taxonomy";

/**
 * The quiz card (Keuzehulp.dc.html): one question per screen, a progress bar and
 * "Vorige". Answers and the step live in the URL, so the browser's back button works and
 * a half-filled quiz can be shared. The last answer opens the outcome page (RP-50).
 */
export function AdvisorQuiz({ sports }: { sports: SportKey[] }) {
  const t = useTranslations("advisor");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const params = useSearchParams();
  const raw = Object.fromEntries(params.entries());
  const steps = activeSteps(sports);
  const answers = parseAnswers(raw, sports);
  const step = currentStep(raw, answers, steps);
  const key = steps[step]!;
  const options = stepOptions(key, sports);
  const selected = answers[key];

  const headingRef = useRef<HTMLHeadingElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const firstRender = useRef(true);

  // Move focus to the new question, but not on the first load of the page.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const go = (a: Answers, next: number) =>
    router.push({ pathname: "/advisor", query: quizQuery(a, steps, next) }, { scroll: false });

  function pick(value: string) {
    const a = { ...answers, [key]: value } as Answers;
    if (step + 1 < steps.length) return go(a, step + 1);
    if (!isComplete(a)) {
      // An earlier question is still open (edited URL): ask that one first.
      return go(
        a,
        steps.findIndex((k) => a[k] == null),
      );
    }
    router.push({
      pathname: "/advisor/[sport]/[profile]",
      params: { sport: sportSlug(a.sport, locale), profile: profileSlug(a) },
      query: { frequentie: a.frequentie, budget: a.budget },
    });
  }

  // Radio group: arrow keys move between the options, Enter or Space picks one.
  const focusIndex = Math.max(0, selected ? options.indexOf(selected) : 0);
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    let next = delta != null ? (i + delta + options.length) % options.length : null;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = options.length - 1;
    if (next == null) return;
    e.preventDefault();
    optionRefs.current[next]?.focus();
  }

  return (
    <div className="flex min-h-[480px] flex-col bg-white text-[#0B2A17] shadow-[0_30px_60px_rgba(0,20,8,.35)]">
      <div className="border-border flex items-center gap-5 border-b px-[clamp(20px,3.5vw,40px)] py-[22px]">
        <button
          type="button"
          onClick={() => go(answers, step - 1)}
          disabled={step === 0}
          className="flex min-h-11 cursor-pointer items-center gap-1.5 text-[14px] font-medium disabled:cursor-default disabled:opacity-30"
        >
          <svg width="8" height="12" viewBox="0 0 8 12" aria-hidden="true">
            <path d="M6 2L2 6l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          {t("back")}
        </button>
        <div className="flex flex-1 gap-1.5" aria-hidden="true">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 transition-colors duration-300 ${
                i <= step ? "bg-[#05561F]" : "bg-[#E3EBDD]"
              }`}
            />
          ))}
        </div>
        <span className="text-muted text-[13px] whitespace-nowrap" aria-live="polite">
          {t("progress", { step: step + 1, total: steps.length })}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-7 px-[clamp(20px,3.5vw,40px)] py-[clamp(28px,4vw,48px)]">
        <div className="flex flex-col gap-2">
          <h2
            ref={headingRef}
            id="advisor-question"
            tabIndex={-1}
            className="text-[clamp(24px,2.4vw,32px)] font-semibold tracking-[-0.3px] outline-none"
          >
            {t(`steps.${key}.title`)}
          </h2>
          <p id="advisor-question-sub" className="text-muted text-[16px]">
            {t(`steps.${key}.sub`)}
          </p>
        </div>
        <div
          key={key}
          role="radiogroup"
          aria-labelledby="advisor-question"
          aria-describedby="advisor-question-sub"
          className="rp-fade-in grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3"
        >
          {options.map((value, i) => {
            const on = value === selected;
            return (
              <button
                key={value}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={i === focusIndex ? 0 : -1}
                onClick={() => pick(value)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={`flex min-h-24 cursor-pointer flex-col gap-1.5 border-[1.5px] px-5 py-[18px] text-left transition-colors duration-150 hover:border-[#033A19] ${
                  on ? "border-[#033A19] bg-[#F3F7EE]" : "border-[#8FA595] bg-white"
                }`}
              >
                <span className="text-[17px] font-semibold">
                  {t(`options.${key}.${value}.label` as "options.niveau.beginner.label")}
                </span>
                <span className="text-muted text-[14px] leading-[1.4]">
                  {t(
                    `options.${key}.${value}.description` as "options.niveau.beginner.description",
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
