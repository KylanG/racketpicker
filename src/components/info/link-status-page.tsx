import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Reveal } from "@/components/ui/reveal";
import { Slant } from "@/components/ui/slant";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { LinkStatus } from "@/lib/newsletter/status";

/**
 * Result page after a link in one of our mails (newsletter RP-32, alerts RP-33):
 * confirmed, unsubscribed or invalid. Texts come from `{namespace}.{status}`.
 */
export async function LinkStatusPage({
  locale,
  status,
  namespace,
}: {
  locale: Locale;
  status: LinkStatus;
  namespace: "newsletter.status" | "alerts.status";
}) {
  const t = await getTranslations({ locale, namespace });
  return (
    <>
      <div className="rp-hero-sub text-white">
        <Header />
        <section className="rp-container flex flex-col gap-[18px] pt-[clamp(40px,5vw,72px)] pb-[clamp(48px,6vw,88px)]">
          <nav aria-label={t("breadcrumb")}>
            <ol className="text-on-dark flex gap-2 text-[13px]">
              <li className="flex gap-2">
                <Link href="/" className="text-on-dark hover:text-white">
                  {t("home")}
                </Link>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page" className="text-white">
                {t("title")}
              </li>
            </ol>
          </nav>
          <Reveal>
            <h1 className="text-[clamp(32px,3.2vw,46px)] leading-[1.05] font-semibold tracking-[-0.4px]">
              {t(`${status}.heading`)}
            </h1>
          </Reveal>
        </section>
      </div>
      {/* White content block, as on the info pages, so the footer's slant has room. */}
      <section
        id="main"
        tabIndex={-1}
        className="rp-container flex w-full flex-col items-start gap-6 pt-14 pb-24 outline-none"
      >
        <p className="text-ink max-w-[640px] text-[18px] leading-[1.55]">{t(`${status}.text`)}</p>
        <div className="flex flex-wrap gap-3">
          <Slant
            as={Link}
            href={{ pathname: "/", hash: "deals" }}
            className="bg-lime hover:bg-lime-hover px-6 py-3.5 text-[15px] font-semibold text-green-950 hover:text-green-950"
          >
            {t("cta")}
          </Slant>
          <Slant
            as={Link}
            href="/rackets"
            className="bg-green-950 px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-green-900 hover:text-white"
          >
            {t("ctaRackets")}
          </Slant>
        </div>
      </section>
    </>
  );
}
